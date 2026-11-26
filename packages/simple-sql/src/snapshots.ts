import type { SheetSnapshot, StorageBackend } from './index.js'

export interface SheetVersion {
    id: string
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

export function writeSnapshot(
    storage: StorageBackend, name: string, parents: Snapshot[], data: SheetSnapshot | null, check: () => void,
): void {
    if (!supportsRevisions(storage)) {
        const raw = JSON.stringify(data)
        check()
        storage.setItem(snapshotKey(name), raw)
        return
    }

    // A separate immutable key lets competing writes survive even if both read the same parent.
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
            // A surviving parent is ignored by readers because the child supersedes it.
        }
    }
}
