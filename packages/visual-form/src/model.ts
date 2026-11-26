/* 独立保存字段规则、默认值与记录。创建和更新共用校验，读取时返回记录数据。 */

export type FormDataRecord = Record<string, unknown>
export type ModelType = 'any' | 'scala' | 'string' | 'string not null' | 'bool' | 'int' | 'int not null'
    | 'number' | 'number not null' | 'fulldate' | 'dayofyear' | 'month' | 'timeofday' | 'hourminute' | 'datetime'

export interface ModelField {
    /** 使用的校验类型，缺省允许字符串、数值及布尔值。 */
    type?: ModelType
    /** 标量转换为文本后的长度上限。 */
    length?: number
    /** 创建记录时，字段缺失或校验失败所使用的候选缺省值。 */
    default?: unknown
    /** 非空枚举限制有效值。基础标量使用现有值比较和字符串比较。 */
    range?: readonly unknown[] | null
}

const dates: Partial<Record<ModelType, RegExp>> = {
    fulldate: /^\d{4}-\d{1,2}-\d{1,2}$/,
    month: /^\d{4}-\d{1,2}$/,
    dayofyear: /^\d{1,2}-\d{1,2}$/,
    timeofday: /^\d{1,2}:\d{1,2}:\d{1,2}$/,
    hourminute: /^\d{1,2}:\d{1,2}$/,
    datetime: /^\d{4}-\d{1,2}-\d{1,2}[T ]\d{1,2}:\d{1,2}(?::\d{1,2})?$/,
}

const numberPattern = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i

function inRange(range: readonly unknown[] | null | undefined, value: unknown): boolean {
    return !range?.length || range.some(item => item === value ||
        (item != null && value != null && typeof item !== 'object' && typeof value !== 'object' && String(item) === String(value)))
}

// TangramJS src/data/Model.js, schema formatters and field checks.
function checkField(field: ModelField, value: unknown): boolean {
    const type = field.type ?? 'scala'
    const time = dates[type]
    if (time) return typeof value === 'string' && time.test(value.trim())
    if (type === 'any') return true
    if (type === 'bool') return typeof value === 'boolean'
    if (!['boolean', 'string', 'number'].includes(typeof value)) return false
    if ((type === 'string' || type === 'string not null') && typeof value !== 'string') return false
    if (type === 'string not null' && !value) return false
    const text = String(value)
    if (type === 'int' || type === 'int not null') {
        if (typeof value === 'number' ? !Number.isInteger(value) : !/^[+-]?\d+$/.test(text)) return false
    }
    if ((type === 'number' || type === 'number not null') && (!numberPattern.test(text) || !Number.isFinite(Number(text)))) return false
    return (!field.length || text.length <= field.length) && inRange(field.range, value)
}

export class Model {
    #rows: (FormDataRecord | undefined)[] = []
    readonly fields: Readonly<Record<string, ModelField>>

    constructor(fields: Record<string, ModelField>, readonly name?: string) {
        this.fields = Object.fromEntries(Object.entries(fields).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
            .map(([key, field]) => [key, { ...field }]))
    }

    /**
     * @param property - 要检查的已定义字段。
     * @param value - 候选值。
     * @returns 字段存在且通过其规则时为 true。
     */
    check(property: string, value: unknown): boolean {
        return Object.hasOwn(this.fields, property) && checkField(this.fields[property]!, value)
    }

    /**
     * @param data - 用于初始化的字段值，校验未通过时使用字段缺省值。
     * @returns 从 1 开始分配的记录 ID。
     */
    create(data: FormDataRecord = {}): number {
        const row = Object.fromEntries(Object.entries(this.fields).map(([key, field]) => {
            const type = field.type ?? 'scala'
            const fallback = type === 'bool' ? Boolean(field.default)
                : field.default === undefined ? (type.endsWith(' not null') || dates[type] ? null : '') : field.default
            return [key, Object.hasOwn(data, key) && checkField(field, data[key]) ? data[key] : fallback]
        }))
        this.#rows.push(structuredClone(row))
        return this.#rows.length
    }

    /**
     * @param id - 记录 ID。
     * @returns 记录的副本，找不到时为 undefined。
     */
    read(id: number): FormDataRecord | undefined
    /** @returns 所有存在记录的 ID 到副本的映射。 */
    read(): Record<number, FormDataRecord>
    read(id?: number): FormDataRecord | Record<number, FormDataRecord> | undefined {
        if (id !== undefined) return structuredClone(this.#rows[id - 1])
        return Object.fromEntries(this.#rows.flatMap((row, index) => row ? [[index + 1, structuredClone(row)]] : []))
    }

    /**
     * 只更新已定义且通过校验的字段。不接受的候选值保留原记录值。
     *
     * @param id - 已创建的记录 ID。
     * @param data - 待更新的字段对象或单个字段名。
     * @param value - 只更新一个字段时使用的候选值。
     * @returns 更新后的记录副本，记录不存在时为 undefined。
     */
    update(id: number, data: FormDataRecord | string, value?: unknown): FormDataRecord | undefined {
        const row = this.#rows[id - 1]
        if (!row) return
        const input = typeof data === 'string' ? { [data]: value } : data
        const accepted = Object.fromEntries(Object.entries(input).filter(([key, proposed]) => this.check(key, proposed)))
        this.#rows[id - 1] = { ...row, ...structuredClone(accepted) }
        return this.read(id)
    }

    /**
     * @param id - 要移除的记录 ID。
     * @returns 是否真正删除了记录。已删除索引不会被新记录复用。
     */
    delete(id: number): boolean {
        if (!this.#rows[id - 1]) return false
        this.#rows[id - 1] = undefined
        return true
    }
}
