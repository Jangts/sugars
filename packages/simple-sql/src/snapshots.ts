/* 读取本地表快照并校验版本链，在支持枚举存储键的后端检测跨实例并发分支。 */

import type { SheetSnapshot, StorageBackend } from './index.js'

export interface SheetVersion {
    /** 后端中的唯一版本键。 */
    id: string
    /** 当前分支内容的副本，null 表示该分支删除了整个表。 */
    snapshot: SheetSnapshot | null
}

export class SheetConflictError extends Error {
    constructor(readonly tablename: string, readonly versions: readonly SheetVersion[] = []) {
        super('Concurrent changes to Sheet ' + tablename)
        this.name = 'SheetConflictError'
    }
}

export interface Snapshot {
    id: string
    raw: string | null
    data: SheetSnapshot | null | undefined
    ancestors?: string[]
}

interface Revision {
    parents: string[]
    data: SheetSnapshot | null
}

type RevisionStorage = StorageBackend & Required<Pick<StorageBackend, 'length' | 'key' | 'removeItem'>>

const revisionPrefix = (name: string) => 'sugars.simple-sql.revision:' + name + ':'
const snapshotKey = (name: string) => 'sugars.simple-sql.' + name

function supportsRevisions(storage: StorageBackend): storage is RevisionStorage {
    return typeof storage.length === 'number' && typeof storage.key === 'function' && typeof storage.removeItem === 'function'
}

function revisionKeys(storage: RevisionStorage, prefix: string): string[] {
    const keys = new Set<string>()
    for (let i = 0, length = storage.length; i < length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(prefix)) keys.add(key)
    }
    return [...keys].sort()
}

/** 连续两次枚举版本键，确保读取的是同一组键，再从父子引用推导未被替代的版本头。 */
export function readRevisions(storage: StorageBackend, name: string): Snapshot[] {
    if (!supportsRevisions(storage)) return []
    const prefix = revisionPrefix(name)
    for (let attempt = 0; attempt < 8; attempt++) {
        const keys = revisionKeys(storage, prefix)
        const rows = new Map<string, { raw: string; entry: Revision }>()
        for (const key of keys) {
            const raw = storage.getItem(key)
            if (raw !== null) rows.set(key, { raw, entry: JSON.parse(raw) as Revision })
        }
        const current = revisionKeys(storage, prefix)
        if (rows.size !== keys.length || current.length !== keys.length ||
            current.some((key, index) => key !== keys[index])) continue
        const superseded = new Set([...rows.values()].flatMap(({ entry }) => entry.parents))
        return [...rows.entries()].filter(([key]) => !superseded.has(key))
            .map(([id, { raw, entry }]) => ({ id, raw, data: entry.data, ancestors: entry.parents }))
    }
    throw new SheetConflictError(name)
}

export function asConflict(name: string, heads: Snapshot[]): SheetConflictError {
    return new SheetConflictError(name, heads.map(({ id, data }) => ({ id, snapshot: data ?? null })))
}

export function readSnapshot(
    storage: StorageBackend, name: string, readLegacy: () => SheetSnapshot | undefined,
): Snapshot {
    const heads = readRevisions(storage, name)
    if (heads.length > 1) throw asConflict(name, heads)
    if (heads[0]) return heads[0]
    const id = snapshotKey(name)
    const raw = storage.getItem(id)
    if (raw !== null) return { id, raw, data: JSON.parse(raw) as SheetSnapshot | null }
    const legacy = readLegacy()
    return { id, raw: legacy ? JSON.stringify(legacy) : null, data: legacy }
}

export function sameSnapshot(left: Snapshot, right: Snapshot): boolean {
    return left.id === right.id && left.raw === right.raw
}

/** 提交前重检调用方读取的基线。可枚举的后端用独立版本键保存同源并发写入。 */
export function writeSnapshot(
    storage: StorageBackend, name: string, parents: Snapshot[], data: SheetSnapshot | null, check: () => void,
): void {
    if (!supportsRevisions(storage)) {
        const raw = JSON.stringify(data)
        check()
        storage.setItem(snapshotKey(name), raw)
        return
    }

    // 同一父版本上的并发写入分别使用独立的不可变键，避免互相覆盖。
    const prefix = revisionPrefix(name)
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))]
        .map(byte => byte.toString(16).padStart(2, '0')).join('')
    const superseded = new Set(parents.flatMap(parent => [
        parent.id,
        ...(parent.ancestors ?? []).filter(id => id.startsWith(prefix) && storage.getItem(id) !== null),
    ]))
    const entry: Revision = { parents: [...superseded], data }
    const raw = JSON.stringify(entry)
    check()
    storage.setItem(prefix + nonce, raw)

    for (const id of superseded) {
        if (!id.startsWith(prefix)) continue
        try {
            storage.removeItem(id)
        } catch {
            // 旧版本即使未清理，也会因被子版本引用而退出版本头集合。
        }
    }
}
