/**
 * `@sugars/visual-form` 的公开入口。
 *
 * 将字段定义同时编译成 DOM 控件与 Model 约束，在 JSON、控件和可选 textarea 之间同步。
 * `VisualForm` 处理控件与 JSON 往返，导出的 `Model` 可独立使用字段约束与默认值。
 */

import { ViewModel } from '@sugars/simple-mvvm/view-model'
import type { ViewModelState } from '@sugars/simple-mvvm/view-model'
import { Model } from './model.js'
import type { FormDataRecord, ModelField, ModelType } from './model.js'

export { Model } from './model.js'
export type { FormDataRecord, ModelField, ModelType } from './model.js'

export type FieldValue = string | number | boolean
/** 字段定义元组的第一个成员用于模型键和控件名称，后续成员按控件类型解释。 */
export type FieldDefinition = readonly [name: string, control?: string, ...configuration: unknown[]]

interface CompiledField {
    name: string
    control: string
    maxLength: number
    range?: readonly FieldValue[]
    labels?: readonly unknown[]
}

const fieldTypes: Readonly<Record<string, ModelType>> = Object.freeze({
    color: 'string', date: 'fulldate', datetime: 'datetime', dayofweek: 'int not null', email: 'string',
    hourminute: 'hourminute', month: 'month', number: 'int not null', password: 'string',
    range: 'int not null', tel: 'string', text: 'string', time: 'timeofday', url: 'string',
    checkbox: 'bool',
})

const nativeTypes: Readonly<Record<string, string>> = {
    datetime: 'datetime-local', dayofweek: 'number', hourminute: 'time',
}

type FormDefinition = { fields: CompiledField[]; constraint: Model }

// TangramJS src/form/VisualJOSN/ClassObject.js, declareModel.
/** 同一字段定义同时生成控件配置和数据校验规则，让导入和导出使用同一套约束。 */
function compile(definitions: readonly FieldDefinition[], name?: string): FormDefinition {
    const entries: [string, ModelField][] = []
    const fields: CompiledField[] = []

    for (const [key, control = 'text', ...configuration] of definitions) {
        if (!key) continue
        const first = configuration[0]
        const hasLength = (typeof first === 'number' || typeof first === 'string' && /^\d+$/.test(first))
        const maxLength = hasLength ? Math.max(0, Math.trunc(Number(first))) : 0
        const [value, choices, captions] = hasLength ? configuration.slice(1) : configuration
        const values = Array.isArray(value) ? value : choices
        const range: FieldValue[] | undefined = Array.isArray(values) && values.length ? values : undefined
        const labels = Array.isArray(value) ? choices : captions
        const fallback = range
            ? range.find(item => item === value) ?? range[0]
            : Array.isArray(value) ? '' : value
        const type = Object.hasOwn(fieldTypes, control) ? fieldTypes[control]! : 'string'
        entries.push([key, { type, length: maxLength, default: fallback, range }])
        fields.push({ name: key, control, maxLength, range, labels: Array.isArray(labels) && labels.length >= (range?.length ?? 0) ? labels : range })
    }
    return { fields, constraint: new Model(Object.fromEntries(entries), name) }
}

function controlValue(input: HTMLInputElement | HTMLSelectElement, field: CompiledField): FieldValue {
    if (field.range) return field.control === 'checkbox'
        ? Boolean(field.range[(input as HTMLSelectElement).selectedIndex]) : input.value
    if (field.control === 'checkbox') return (input as HTMLInputElement).checked
    if (field.control === 'datetime') return input.value.replace('T', ' ')
    if (field.control === 'time' && /^\d{2}:\d{2}$/.test(input.value)) return input.value + ':00'
    return input.value
}

function createControl(doc: Document, field: CompiledField, value: unknown): HTMLInputElement | HTMLSelectElement {
    if (field.range) {
        const select = doc.createElement('select')
        for (const [i, choice] of field.range.entries()) {
            const option = doc.createElement('option')
            option.value = String(choice)
            option.textContent = String(field.labels?.[i] ?? choice)
            option.selected = String(choice) === String(value)
            select.append(option)
        }
        return select
    }
    const input = doc.createElement('input')
    input.type = Object.hasOwn(nativeTypes, field.control) ? nativeTypes[field.control]! : field.control
    if (field.maxLength) input.maxLength = field.maxLength
    if (field.control === 'checkbox') input.checked = Boolean(value)
    else {
        let text = value == null ? '' : String(value).trim()
        if (['time', 'hourminute', 'datetime', 'date', 'month'].includes(field.control)) {
            text = text.replace(' ', 'T').replace(/(?<=[-T:])\d(?!\d)/g, digit => '0' + digit)
            if (field.control === 'time') input.step = '1'
        } else {
            text = value == null ? '' : String(value)
        }
        input.value = text
    }
    return input
}

// TangramJS src/form/VisualJOSN/{ClassObject,Object}.js
export class VisualForm {
    static #schemas = new Map<string, readonly FieldDefinition[]>()

    static declare(name: string, fields: readonly FieldDefinition[]): string {
        if (!/\w/.test(name)) throw new TypeError('VisualForm needs a schema name')
        let result = name
        for (let i = 1; this.#schemas.has(result); i++) result = name + '_' + i
        this.#schemas.set(result, structuredClone(fields))
        return result
    }

    readonly Element: HTMLElement
    readonly model: Readonly<FormDefinition>
    readonly $ID: number
    textarea?: HTMLTextAreaElement
    #textareaDisplay = ''
    #view: ViewModelState<{ row: FormDataRecord }>
    #controls: (HTMLInputElement | HTMLSelectElement)[] = []
    #classes: string[]

    /**
     * @param element - 调用方提供的控件容器。
     * @param schema - 字段定义数组或其 JSON 文本。
     * @param textarea - 可选的 JSON 输入输出后备字段。
     * @throws 字段定义或初始 JSON 无法解析时传递错误。
     */
    constructor(element: HTMLElement, schema: readonly FieldDefinition[] | string, textarea?: HTMLTextAreaElement) {
        this.Element = element
        const definitions = typeof schema === 'string' ? VisualForm.#schemas.get(schema) : schema
        if (!definitions) throw new TypeError('Unknown VisualForm schema ' + schema)
        this.model = compile(definitions, typeof schema === 'string' ? schema : undefined)
        this.$ID = this.model.constraint.create()
        this.#classes = ['tangram', 'visual-json', 'visual-json-obj'].filter(name => !element.classList.contains(name))
        element.classList.add(...this.#classes)
        this.#view = this.#createView()
        try {
            if (textarea) this.bindInput(textarea)
        } catch (error) {
            this.destroy()
            throw error
        }
    }

    #createView() {
        const render = (row: FormDataRecord) => {
            this.#controls = this.model.fields.map(field => {
                const control = createControl(this.Element.ownerDocument, field, row[field.name])
                control.dataset.propName = field.name
                control.name = field.name
                return control
            })
            this.Element.replaceChildren(...this.#controls)
        }
        return new ViewModel({
            data: { row: this.model.constraint.read(this.$ID)! },
            render() { render(this.data.row) },
        })
    }

    /**
     * 先以 textarea 当前值装载模型，成功后才接管其显示状态。
     *
     * @param textarea - 值为 JSON 文本的后备字段。
     * @returns 当前表单。
     */
    bindInput(textarea: HTMLTextAreaElement): this {
        this.loadJSON(textarea.value || '{}')
        if (this.textarea) this.textarea.style.display = this.#textareaDisplay
        this.textarea = textarea
        this.#textareaDisplay = textarea.style.display
        textarea.style.display = 'none'
        return this
    }

    /**
     * 解析对象并交给 Model 校验。JSON null 按空对象处理，数组和其他原始值会报错。
     *
     * @param json - 对象的 JSON 文本。
     * @returns 已更新模型的当前表单。
     * @throws {SyntaxError} JSON 文本不合法。
     * @throws {TypeError} JSON 值不是对象或 null。
     */
    loadJSON(json: string): this {
        const data: unknown = JSON.parse(json)
        if (data == null) return this.input({})
        if (typeof data !== 'object' || Array.isArray(data)) throw new TypeError('VisualForm needs a JSON object')
        return this.input(data as FormDataRecord)
    }

    /**
     * 按模型约束导入字段。无效字段沿用原记录。
     * @param data - 以字段名为键的输入。
     * @returns 当前表单。
     */
    input(data: FormDataRecord): this {
        const row = this.model.constraint.update(this.$ID, data)
        if (row) this.#view.row = row
        return this
    }

    /**
     * 读取当前控件并写回模型，最终以模型接受的字段值为准。
     *
     * @returns 模型接受的最新字段值。
     */
    output(): FormDataRecord {
        const data = Object.fromEntries(this.model.fields.map((field, i) => {
            return [field.name, controlValue(this.#controls[i]!, field)]
        }))
        return this.model.constraint.update(this.$ID, data) ?? {}
    }

    /**
     * 取当前控件的校验结果并序列化，同时同步已绑定的 textarea。
     *
     * @returns 由当前模型记录得到的 JSON 字符串。
     */
    getJSON(): string {
        const json = JSON.stringify(this.output())
        if (this.textarea) this.textarea.value = json
        return json
    }

    /** 移除实例创建的控件与订阅，并恢复 textarea 原先的显示方式。 */
    destroy(): void {
        this.#view.destroy()
        if (this.textarea) this.textarea.style.display = this.#textareaDisplay
        for (const control of this.#controls) control.remove()
        this.Element.classList.remove(...this.#classes)
    }
}

export { VisualForm as ClassObject }
