import { observe } from '@sugars/simple-mvvm/observer'
import { legacyKey } from './legacy-key.js'
import { identifier, parse, selectRows } from './query.js'
import type { Row } from './query.js'
import { readRevisions, readSnapshot, sameSnapshot, SheetConflictError, writeSnapshot } from './snapshots.js'
import type { SheetVersion, Snapshot } from './snapshots.js'

export type { Row } from './query.js'
export { SheetConflictError } from './snapshots.js'
export type { SheetVersion } from './snapshots.js'

export interface FieldConstraint {
    type: 'boolean' | 'object' | 'string' | 'number'
    length?: number
    pattern?: string
    min?: number
    max?: number
}

export interface StorageBackend {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    readonly length?: number
    key?(index: number): string | null
    removeItem?(key: string): void
}

type Constraints = Record<string, FieldConstraint>

export interface SheetSnapshot {
    ai: number
    fields: Row
    pk: string
    constraints: Constraints
    rows: Record<string, Row>
}

interface Table {
    status: { revision: number }
    pending: number
    notifying: boolean
}

const tables = new WeakMap<StorageBackend, Map<string, Table>>()

function defaultStorage(): StorageBackend {
    if (!globalThis.localStorage) throw new TypeError('Sheet needs localStorage or an explicit storage backend')
    return globalThis.localStorage
}

// TangramJS src/data/{Sheet,Storage}.js, original meta table and JSON parts.
function readLegacy(storage: StorageBackend, name: string): SheetSnapshot | undefined {
    const catalog = storage.getItem(legacyKey('pandora.data.Table'))
    if (!catalog) return
    const metadata = (JSON.parse(catalog) as Record<string, SheetSnapshot & { storages: string[] }>)[name]
    if (!metadata || !Array.isArray(metadata.storages)) return
    const chunks = metadata.storages.map(part => {
        const chunk = storage.getItem(legacyKey(part))
        return chunk ? (JSON.parse(chunk) as { data?: string }).data ?? '' : ''
    })
    const { ai, fields, pk, constraints = {} } = metadata
    return { ai, fields, pk, constraints, rows: JSON.parse(chunks.join('') || '{}') }
}

function tableFor(storage: StorageBackend, name: string): Table {
    let catalog = tables.get(storage)
    if (!catalog) {
        catalog = new Map()
        tables.set(storage, catalog)
    }
    const open = catalog.get(name)
    if (open) return open
    const table = { status: { revision: 0 }, pending: 0, notifying: false }
    observe(table.status)
    catalog.set(name, table)
    return table
}

function notify(table: Table): void {
    table.pending++
    if (table.notifying) return
    table.notifying = true
    try {
        while (table.pending > 0) {
            table.pending--
            table.status.revision++
        }
    } finally {
        table.notifying = false
    }
}

function readSheet(storage: StorageBackend, name: string): Snapshot {
    return readSnapshot(storage, name, () => readLegacy(storage, name))
}

function writeSheet(storage: StorageBackend, name: string, previous: Snapshot, data: SheetSnapshot | null): void {
    writeSnapshot(storage, name, [previous], data, () => {
        if (!sameSnapshot(previous, readSheet(storage, name))) throw new SheetConflictError(name)
    })
}

function insertRows(next: SheetSnapshot, rows: Row[]): number {
    for (const input of rows) {
        const id = ++next.ai
        next.rows[id] = { ...assign(next, structuredClone(input)), [next.pk]: id }
    }
    return next.ai
}

function editRows(next: SheetSnapshot, ids: string[], edit: (row: Row) => Row | undefined): number {
    let count = 0
    for (const id of ids) {
        if (!Object.hasOwn(next.rows, id)) continue
        const result = edit(next.rows[id]!)
        if (result) next.rows[id] = result
        else delete next.rows[id]
        count++
    }
    return count
}

function updateRows(next: SheetSnapshot, ids: string[], input: Row): number {
    const data = structuredClone(input)
    return editRows(next, ids, row => assign(next, data, row))
}

// TangramJS src/data/Sheet.js, check and assign.
function check(value: unknown, constraint: FieldConstraint): boolean {
    switch (constraint.type) {
        case 'boolean': return value === true || value === false || value === 1 || value === 0
        case 'object': return typeof value === 'object'
        case 'string':
            return typeof value === 'string'
                && (constraint.length === undefined || value.length <= constraint.length)
                && (!constraint.pattern || new RegExp(constraint.pattern).test(value))
        case 'number':
            return typeof value === 'number' && Number.isFinite(value)
                && (constraint.min === undefined || value >= constraint.min)
                && (constraint.max === undefined || value <= constraint.max)
    }
}

function assign(table: SheetSnapshot, data: Row, current: Row = {}): Row {
    return Object.fromEntries(Object.entries(table.fields).map(([key, fallback]) => {
        const constraint = Object.hasOwn(table.constraints, key) ? table.constraints[key] : undefined
        const next = data[key]
        const value = key !== table.pk && Object.hasOwn(data, key) && (!constraint || check(next, constraint))
            ? next
            : Object.hasOwn(current, key) ? current[key] : fallback
        return [key, value]
    }))
}

function assertName(name: string): void {
    if (!identifier.test(name)) throw new TypeError('Invalid Sheet name ' + name)
}

export class Sheet {
    #table: Table
    #views = new Set<() => void>()
    readonly tablename: string
    readonly storage: StorageBackend

    constructor(tablename: string, fields: Row = { id: 0 }, primarykey = 'id', constraints: Constraints = {}, storage = defaultStorage()) {
        assertName(tablename)
        this.tablename = tablename
        this.storage = storage
        this.#table = tableFor(storage, tablename)
        const previous = this.#read()
        if (!previous.data) {
            assertName(primarykey)
            if (!Object.hasOwn(fields, primarykey)) fields = { [primarykey]: 0, ...fields }
            for (const key of Object.keys(fields)) assertName(key)
            const data = { ai: 0, fields: structuredClone(fields), pk: primarykey, constraints: structuredClone(constraints), rows: {} }
            writeSheet(storage, tablename, previous, data)
        }
    }

    #read(): Snapshot {
        return readSheet(this.storage, this.tablename)
    }

    #data(snapshot = this.#read()): SheetSnapshot {
        if (!snapshot.data) throw new Error('Sheet has been dropped')
        return snapshot.data
    }

    #draft(): { previous: Snapshot; next: SheetSnapshot } {
        const previous = this.#read()
        return { previous, next: structuredClone(this.#data(previous)) }
    }

    #commit(previous: Snapshot, data: SheetSnapshot | null): void {
        writeSheet(this.storage, this.tablename, previous, data)
        notify(this.#table)
    }

    get revision(): number { return this.#table.status.revision }

    subscribe(callback: (revision: number) => void, onError = globalThis.reportError ?? console.error): () => void {
        const listener = observe(this.#table.status).on('write', 'revision', function (revision) {
            try {
                callback.call(this, revision)
            } catch (error) {
                queueMicrotask(() => onError(error))
            }
        })
        return () => listener?.disconnect()
    }

    add(fieldname: string, value: unknown = '', constraint?: FieldConstraint): this {
        assertName(fieldname)
        const { previous, next } = this.#draft()
        if (Object.hasOwn(next.fields, fieldname)) return this
        next.fields = { ...next.fields, [fieldname]: value }
        if (constraint) next.constraints = { ...next.constraints, [fieldname]: constraint }
        for (const id of Object.keys(next.rows)) next.rows[id] = { ...next.rows[id], [fieldname]: value }
        this.#commit(previous, next)
        return this
    }

    drop(): null
    drop(fieldname: string): this
    drop(fieldname?: string): this | null {
        if (fieldname === undefined) {
            this.#commit(this.#read(), null)
            return null
        }
        const { previous, next } = this.#draft()
        if (!Object.hasOwn(next.fields, fieldname)) return this
        if (fieldname === next.pk) throw new Error('Cannot drop the primary key')
        delete next.fields[fieldname]
        delete next.constraints[fieldname]
        for (const row of Object.values(next.rows)) delete row[fieldname]
        this.#commit(previous, next)
        return this
    }

    alter(fieldname: string, newname: string, value?: unknown): this {
        assertName(newname)
        const { previous, next } = this.#draft()
        if (!Object.hasOwn(next.fields, fieldname)) return this
        if (fieldname !== newname && Object.hasOwn(next.fields, newname)) throw new Error('Sheet field already exists ' + newname)
        const defaultValue = value === undefined ? next.fields[fieldname] : value
        delete next.fields[fieldname]
        next.fields = { ...next.fields, [newname]: defaultValue }
        if (Object.hasOwn(next.constraints, fieldname)) {
            const constraint = next.constraints[fieldname]!
            delete next.constraints[fieldname]
            next.constraints = { ...next.constraints, [newname]: constraint }
        }
        for (const [id, row] of Object.entries(next.rows)) {
            const cell = row[fieldname]
            delete row[fieldname]
            next.rows[id] = { ...row, [newname]: cell }
        }
        if (next.pk === fieldname) next.pk = newname
        this.#commit(previous, next)
        return this
    }

    insert(...rows: Row[]): number {
        const { previous, next } = this.#draft()
        const id = insertRows(next, rows)
        if (rows.length) this.#commit(previous, next)
        return id
    }

    update(id: number | string, data: Row): this {
        const { previous, next } = this.#draft()
        if (updateRows(next, [String(id)], data)) this.#commit(previous, next)
        return this
    }

    select(...ids: (number | string)[]): Row[] {
        const { rows } = this.#data()
        return structuredClone(ids.length ? ids.flatMap(id => Object.hasOwn(rows, id) ? [rows[id]!] : []) : Object.values(rows))
    }

    delete(...ids: (number | string)[]): this {
        const { previous, next } = this.#draft()
        if (editRows(next, ids.map(String), () => undefined)) this.#commit(previous, next)
        return this
    }

    fields(): Record<string, { default: unknown; constraint?: FieldConstraint; isPKey: boolean }> | false {
        const { data } = this.#read()
        if (!data) return false
        return structuredClone(Object.fromEntries(Object.entries(data.fields).map(([key, value]) => {
            return [key, { default: value, constraint: Object.hasOwn(data.constraints, key) ? data.constraints[key] : undefined, isPKey: data.pk === key }]
        })))
    }

    render(width?: number | string, border?: number | string, context: HTMLElement = document.body): HTMLTableElement {
        const table = context.ownerDocument.createElement('table')
        table.className = 'table'
        if (width !== undefined) table.setAttribute('width', String(width))
        if (border !== undefined) table.setAttribute('border', String(border))
        const redraw = () => {
            table.replaceChildren()
            const { data } = this.#read()
            if (!data) return
            const fields = [data.pk, ...Object.keys(data.fields).filter(key => key !== data.pk)]
            const body = table.createTBody()
            const head = body.insertRow()
            head.className = 'head-row'
            for (const name of fields) {
                const cell = context.ownerDocument.createElement('th')
                cell.textContent = name
                head.append(cell)
            }
            for (const row of Object.values(data.rows)) {
                const entry = body.insertRow()
                for (const name of fields) {
                    const value = row[name]
                    entry.insertCell().textContent = value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
                }
            }
        }
        redraw()
        context.append(table)
        const unsubscribe = this.subscribe(redraw)
        this.#views.add(() => { unsubscribe(); table.remove() })
        return table
    }

    destroy(): void {
        for (const cleanup of this.#views) cleanup()
        this.#views.clear()
    }

    static exec(sql: string, storage = defaultStorage()): Row[] | number | false {
        const statement = parse(sql)
        const name = statement.table
        const snapshot = readSheet(storage, name)
        const { data } = snapshot
        if (!data) return false
        const save = (next: SheetSnapshot): void => {
            writeSheet(storage, name, snapshot, next)
            notify(tableFor(storage, name))
        }
        if (statement.operation === 'insert') {
            const next = structuredClone(data)
            const lastId = insertRows(next, statement.values)
            save(next)
            return lastId
        }
        const rows = selectRows(Object.values(data.rows), statement.selection)
        if (statement.operation === 'select') {
            if (statement.columns[0] === '*') return rows
            return rows.map(row => Object.fromEntries(statement.columns.map(key => [key, Object.hasOwn(row, key) ? row[key] : undefined])))
        }
        const ids = rows.map(row => String(row[data.pk]))
        const next = structuredClone(data)
        const count = statement.operation === 'update'
            ? updateRows(next, ids, statement.values)
            : editRows(next, ids, () => undefined)
        if (count) save(next)
        return count
    }

    static async withWriteLock<T>(tablename: string, action: () => T | Promise<T>): Promise<T> {
        assertName(tablename)
        const locks = globalThis.navigator?.locks
        if (!locks) throw new Error('Sheet.withWriteLock requires Web Locks')
        return await locks.request('sugars.simple-sql:' + tablename, action)
    }

    static resolveConflict(
        tablename: string,
        resolve: (versions: readonly SheetVersion[]) => SheetSnapshot | null,
        storage = defaultStorage(),
    ): boolean {
        assertName(tablename)
        const heads = readRevisions(storage, tablename)
        if (heads.length < 2) return false
        const versions = heads.map(({ id, data }) => ({ id, snapshot: structuredClone(data ?? null) }))
        const resolution = resolve(versions)
        if (resolution !== null) {
            if (!Number.isSafeInteger(resolution.ai) || resolution.ai < 0 ||
                !identifier.test(resolution.pk) || !Object.hasOwn(resolution.fields, resolution.pk)) {
                throw new TypeError('Invalid Sheet conflict resolution schema')
            }
            for (const [key, row] of Object.entries(resolution.rows)) {
                const id = Number(key)
                if (!Number.isSafeInteger(id) || id < 1 || id > resolution.ai ||
                    String(id) !== key || row[resolution.pk] !== id) {
                    throw new TypeError('Invalid primary key in Sheet conflict resolution')
                }
            }
        }
        writeSnapshot(storage, tablename, heads, resolution, () => {
            const current = readRevisions(storage, tablename)
            if (heads.length !== current.length || !heads.every((head, index) => sameSnapshot(head, current[index]!))) {
                throw new SheetConflictError(tablename)
            }
        })
        notify(tableFor(storage, tablename))
        return true
    }
}

export { Sheet as SimpleSQL }
