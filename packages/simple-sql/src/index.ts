/**
 * `@sugars/simple-sql` 的公开入口。
 *
 * 本地表入口管理字段约束、记录增删改查和订阅。读写使用各调用方选择的存储后端。
 * `Sheet`（别名 `SimpleSQL`）承接实例和类 SQL 入口，`SheetConflictError` 暴露需要调用方合并的并发版本。
 */

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
    /** 校验分支。boolean 兼容数字 0 和 1，number 要求有限值。 */
    type: 'boolean' | 'object' | 'string' | 'number'
    /** 字符串最大长度，按 JavaScript 字符串代码单元计算。 */
    length?: number
    /** 字符串须通过的正则源码。 */
    pattern?: string
    /** 有限数值可接受的最小值，包含端点。 */
    min?: number
    /** 有限数值可接受的最大值，包含端点。 */
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
    /** 当前自增主键计数，删除行后仍保留。 */
    ai: number
    /** 全部字段及其缺省值，包括主键。 */
    fields: Row
    /** 主键字段名，记录也以对应数值的字符串表示为存储键。 */
    pk: string
    /** 按字段名登记的约束规则。 */
    constraints: Constraints
    /** 当前表的行，以自增键的十进制字符串索引。 */
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
/** 按旧版分片键寻找数据。新表读写使用快照，只有缺少现代快照时才读取历史分片。 */
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

    /**
     * @param tablename - 符合标识符规则的表名。
     * @param fields - 创建表时的字段和缺省值。已有表沿用持久快照。
     * @param primarykey - 创建表时使用的主键名，默认 id。
     * @param constraints - 新表按字段登记的校验规则。
     * @param storage - 存储后端，默认浏览器 localStorage。
     * @throws 表名或字段名不合法、存在并发分支或读写后端失败。
     */
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

    /**
     * 订阅已提交的表变更，返回退订函数。观察者失败交给 onError。
     *
     * @param callback - 接收同一后端中当前表的新修订号。
     * @param onError - 处理回调异常的函数，异步调用。
     * @returns 解除本次订阅的函数。
     */
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

    /**
     * @param fieldname - 新字段的名称。已存在时保留原表。
     * @param value - 新字段的缺省值，也写入已有记录。
     * @param constraint - 新字段可选约束。
     * @returns 当前表实例。
     * @throws 字段名无效、表已删除或提交发生冲突。
     */
    add(fieldname: string, value: unknown = '', constraint?: FieldConstraint): this {
        assertName(fieldname)
        // 写入路径先改工作副本。版本检查通过后才提交，再通知监听者。
        const { previous, next } = this.#draft()
        if (Object.hasOwn(next.fields, fieldname)) return this
        next.fields = { ...next.fields, [fieldname]: value }
        if (constraint) next.constraints = { ...next.constraints, [fieldname]: constraint }
        for (const id of Object.keys(next.rows)) next.rows[id] = { ...next.rows[id], [fieldname]: value }
        this.#commit(previous, next)
        return this
    }

    /**
     * 删除整表，持久化一个删除快照。
     * @returns null。
     */
    drop(): null
    /**
     * @param fieldname - 要从所有行删除的字段。
     * @returns 当前表。不存在的字段不产生写入。
     * @throws 尝试删除主键、表不可用或提交冲突。
     */
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

    /**
     * @param fieldname - 原字段名。
     * @param newname - 替换名称，不能覆盖其他字段。
     * @param value - 可选的新缺省值，已有行保留各自行值。
     * @returns 当前表。
     * @throws 新名无效、与已有字段冲突或表不可用。
     */
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

    /**
     * 按 schema 逐行写入并分配自增键，返回本次批次的最后一个主键。
     *
     * @param rows - 待保存记录，主键由实例分配。
     * @returns 最后一次插入后的自增主键计数。
     * @throws 表已删除、存储失败或提交时版本已变。
     */
    insert(...rows: Row[]): number {
        const { previous, next } = this.#draft()
        const id = insertRows(next, rows)
        if (rows.length) this.#commit(previous, next)
        return id
    }

    /**
     * @param id - 主键值。
     * @param data - 候选字段值，缺失和未通过规则的旧字段继续保留。
     * @returns 当前表。
     */
    update(id: number | string, data: Row): this {
        const { previous, next } = this.#draft()
        if (updateRows(next, [String(id)], data)) this.#commit(previous, next)
        return this
    }

    /**
     * @param ids - 要查询的主键。省略时返回全部记录。
     * @returns 从当前快照读取的记录数组。
     */
    select(...ids: (number | string)[]): Row[] {
        const { rows } = this.#data()
        return structuredClone(ids.length ? ids.flatMap(id => Object.hasOwn(rows, id) ? [rows[id]!] : []) : Object.values(rows))
    }

    /**
     * @param ids - 要删除的一个或多个主键。
     * @returns 当前表。
     */
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

    /**
     * @param width - 表格宽度。
     * @param border - 原生表格边框值。
     * @param context - 表格挂载容器，缺省为文档 body。
     * @returns 随同表更新的 DOM 表格，由 destroy() 解除订阅并移除。
     */
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

    /** 解除 render() 创建的视图订阅并移除表格元素，持久记录仍可通过其他实例访问。 */
    destroy(): void {
        for (const cleanup of this.#views) cleanup()
        this.#views.clear()
    }

    /**
     * 执行本地表的 SELECT、INSERT、UPDATE 或 DELETE。按语句返回结果行、最后主键或受影响行数，表不存在时返回 false。
     *
     * @param sql - 由本地解析器支持的一条语句。
     * @param storage - 查询或写入的后端，默认 localStorage。
     * @throws 语句超出语法范围、读取快照失败或写入存在并发冲突。
     */
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

    /**
     * 使用同源 Web Locks 序列化同名表的写入，参与者须通过同一个锁入口。
     *
     * @param tablename - 同源锁使用的表名。
     * @param action - 获得锁后才执行的操作。
     * @returns 操作的结果，操作抛出时传递其错误。
     * @throws 浏览器不提供 Web Locks 或表名无效。
     */
    static async withWriteLock<T>(tablename: string, action: () => T | Promise<T>): Promise<T> {
        assertName(tablename)
        const locks = globalThis.navigator?.locks
        if (!locks) throw new Error('Sheet.withWriteLock requires Web Locks')
        return await locks.request('sugars.simple-sql:' + tablename, action)
    }

    /**
     * 以当前分支快照作为合并输入。提交前再读一次版本头，防止合并覆盖期间出现的新分支。
     *
     * @param tablename - 存在并发版本的表名。
     * @param resolve - 接收各版本的独立副本，返回合并快照或 null 删除表。
     * @param storage - 存有各并发分支的后端。
     * @returns 是否写入了一次合并决议。
     * @throws 合并数据主键无效，或决议期间又产生新版本。
     */
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
