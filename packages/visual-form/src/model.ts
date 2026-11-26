export type FormDataRecord = Record<string, unknown>
export type ModelType = 'any' | 'scala' | 'string' | 'string not null' | 'bool' | 'int' | 'int not null'
    | 'number' | 'number not null' | 'fulldate' | 'dayofyear' | 'month' | 'timeofday' | 'hourminute' | 'datetime'

export interface ModelField {
    type?: ModelType
    length?: number
    default?: unknown
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

    check(property: string, value: unknown): boolean {
        return Object.hasOwn(this.fields, property) && checkField(this.fields[property]!, value)
    }

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

    read(id: number): FormDataRecord | undefined
    read(): Record<number, FormDataRecord>
    read(id?: number): FormDataRecord | Record<number, FormDataRecord> | undefined {
        if (id !== undefined) return structuredClone(this.#rows[id - 1])
        return Object.fromEntries(this.#rows.flatMap((row, index) => row ? [[index + 1, structuredClone(row)]] : []))
    }

    update(id: number, data: FormDataRecord | string, value?: unknown): FormDataRecord | undefined {
        const row = this.#rows[id - 1]
        if (!row) return
        const input = typeof data === 'string' ? { [data]: value } : data
        const accepted = Object.fromEntries(Object.entries(input).filter(([key, proposed]) => this.check(key, proposed)))
        this.#rows[id - 1] = { ...row, ...structuredClone(accepted) }
        return this.read(id)
    }

    delete(id: number): boolean {
        if (!this.#rows[id - 1]) return false
        this.#rows[id - 1] = undefined
        return true
    }
}
