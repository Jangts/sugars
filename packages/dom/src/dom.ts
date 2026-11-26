import type { RuntimeCollection, SelectionValue } from './runtime-types.js'
import { copyData, removeData } from './data.js'
import { clearEvents, copyEvents } from './events.js'
import { choose, isElement, isNode, parseHTML } from './selection.js'

// TangramJS src/dom/Elements.js, attribute, class, content, and value APIs.
const propertyNames: Record<string, string> = { for: 'htmlFor', class: 'className', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
    colspan: 'colSpan', rowspan: 'rowSpan', contenteditable: 'contentEditable', usemap: 'useMap' }
const propertyName = (name: string) => Object.hasOwn(propertyNames, name.toLowerCase()) ? propertyNames[name.toLowerCase()]! : name
const booleanAttributes = new Set('checked selected disabled readonly multiple required autofocus autoplay controls loop muted open hidden'.split(' '))
const words = (value: unknown): string[] => Array.isArray(value) ? value : typeof value === 'string' ? value.match(/\S+/g) ?? [] : []

function readAttr(element: SelectionValue, name: string) {
    const value = element?.getAttribute?.(name)
    if (value == null) return undefined
    const key = name.toLowerCase()
    return element.namespaceURI === 'http://www.w3.org/1999/xhtml' && booleanAttributes.has(key) ? key : value
}

function writeAttr(element: SelectionValue, name: string, value: unknown) {
    if (!isElement(element) || value === undefined) return
    const key = name.toLowerCase()
    const boolean = element.namespaceURI === 'http://www.w3.org/1999/xhtml' && booleanAttributes.has(key)
    if (value === null || boolean && value === false) element.removeAttribute(name)
    else element.setAttribute(name, boolean ? key : String(value))
}

function access(collection: RuntimeCollection, name: string | Record<string, unknown>, value: unknown,
    get: (element: SelectionValue, name: string) => unknown,
    set: (element: SelectionValue, name: string, value: unknown) => void, provided: boolean) {
    if (typeof name === 'string' && !provided) return get(collection[0], name)
    const changes = typeof name === 'string' ? { [name]: value } : name
    return collection.each(function (index) {
        for (const [key, input] of Object.entries(changes ?? {})) {
            if (input !== undefined) set(this, key, typeof input === 'function' ? input.call(this, index, get(this, key)) : input)
        }
    })
}

function clear(node: Node, includeNode: boolean) {
    if (includeNode) {
        removeData(node)
        clearEvents(node)
    }
    for (const child of (node as ParentNode).querySelectorAll?.('*') ?? []) {
        removeData(child)
        clearEvents(child)
    }
}

function copy(source: Node, withData: boolean, deep: boolean) {
    const clone = source.cloneNode(true)
    if (withData) {
        copyData(source, clone)
        copyEvents(source, clone)
    }
    if (deep) {
        const copies = (clone as ParentNode).querySelectorAll?.('*') ?? []
        Array.from((source as ParentNode).querySelectorAll?.('*') ?? []).forEach((child, index) => {
            copyData(child, copies[index]!)
            copyEvents(child, copies[index]!)
        })
    }
    return clone
}

function materialize(content: SelectionValue, context: Node): Node[] {
    const document = context.nodeType === 9 ? context as Document : context.ownerDocument!
    if (content == null || content === false) return []
    if (isNode(content)) return [content]
    if (typeof content === 'string') return /[<&]/.test(content) ? parseHTML(content, document, true) : [document.createTextNode(content)]
    if (typeof content === 'number') return [document.createTextNode(String(content))]
    const values = choose(content)
    if (values.length === 1 && values[0] === content) return []
    return values.flatMap(item => materialize(item, context))
}

type InsertionAction = 'append' | 'prepend' | 'before' | 'after' | 'replaceWith'
const insertions: Record<InsertionAction, (target: SelectionValue, nodes: Node[]) => void> = {
    append: (target, nodes) => target.append?.(...nodes),
    prepend: (target, nodes) => target.prepend?.(...nodes),
    before: (target, nodes) => target.before?.(...nodes),
    after: (target, nodes) => target.after?.(...nodes),
    replaceWith: (target, nodes) => {
        if (!target.parentNode || nodes.includes(target)) return
        clear(target, true)
        target.replaceWith?.(...nodes)
    },
}

function insert(collection: RuntimeCollection, action: InsertionAction, content: SelectionValue[]) {
    const targets = collection.toArray().filter(isNode)
    const insert = insertions[action]
    for (const [i, target] of targets.entries()) {
        const nodes = content.flatMap(item => {
            if (typeof item === 'function') return materialize(item.call(target, i, (target as Element).innerHTML), target)
            const material = materialize(item, target)
            return i < targets.length - 1 ? material.map(node => copy(node, true, true)) : material
        }).filter(node => node !== target)
        // Table rows inserted directly into an existing body follow the collection API.
        const destination = ['append', 'prepend'].includes(action) && target.nodeName === 'TABLE' && nodes[0]?.nodeName === 'TR'
            ? (target as HTMLTableElement).tBodies[0] ?? target : target
        insert(destination, nodes)
    }
    return collection
}

function insertTo(collection: RuntimeCollection, action: InsertionAction, target: SelectionValue) {
    const targets = choose(target).filter(isNode)
    const nodes: Node[] = []
    for (const [i, container] of targets.entries()) {
        const entries = collection.toArray().filter(isNode).map(item => i === targets.length - 1 ? item : copy(item, true, true))
        insert(collection.pushStack([container]), action, entries)
        nodes.push(...entries)
    }
    return collection.pushStack(nodes)
}

function classes(collection: RuntimeCollection, input: SelectionValue, mode: 'add' | 'remove' | 'toggle', state?: boolean) {
    return collection.each(function (index) {
        if (!isElement(this)) return
        const value = typeof input === 'function' ? input.call(this, index, this.getAttribute('class') ?? '', state) : input
        if (mode === 'remove' && input === undefined || mode === 'toggle' && value === false) {
            this.setAttribute('class', '')
            return
        }
        for (const token of words(value)) {
            if (mode === 'toggle') {
                if (typeof state === 'boolean') this.classList.toggle(token, state)
                else this.classList.toggle(token)
            } else this.classList[mode](token)
        }
    })
}

function valueOf(element: SelectionValue): SelectionValue {
    if (!element) return undefined
    if (element.nodeName === 'OPTION') return element.getAttribute('value') ?? element.textContent.trim().replace(/\s+/g, ' ')
    if (element.nodeName === 'SELECT') {
        const values = Array.from<HTMLOptionElement>(element.options).filter(option => option.selected && !option.disabled &&
            !(option.parentElement?.nodeName === 'OPTGROUP' && (option.parentElement as HTMLOptGroupElement).disabled)).map(valueOf)
        return element.multiple ? values : values[0] ?? null
    }
    return typeof element.value === 'string' ? element.value.replace(/\r/g, '') : element.value ?? ''
}

function setValue(element: SelectionValue, value: unknown) {
    if (!element || !('value' in element)) return
    const text = Array.isArray(value) ? value.map(item => String(item ?? '')) : String(value ?? '')
    if (element.nodeName === 'SELECT') {
        const values = new Set(Array.isArray(text) ? text : [text])
        let matched = false
        for (const option of element.options) {
            option.selected = values.has(valueOf(option))
            matched ||= option.selected
        }
        if (!matched) element.selectedIndex = -1
    } else if (Array.isArray(text) && /^(?:radio|checkbox)$/.test(element.type)) element.checked = text.includes(String(valueOf(element)))
    else element.value = text
}

export function param(input: unknown, traditional = false) {
    const fields: string[] = []
    const add = (key: string, value: SelectionValue) => fields.push(encodeURIComponent(key) + '=' + encodeURIComponent((typeof value === 'function' ? value() : value) ?? ''))
    const write = (key: string, value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach((item, i) => {
                if (traditional || key.endsWith('[]')) add(key, item)
                else write(key + '[' + (item && typeof item === 'object' ? i : '') + ']', item)
            })
        } else if (!traditional && value && Object.prototype.toString.call(value) === '[object Object]') {
            for (const [field, item] of Object.entries(value)) write(key + '[' + field + ']', item)
        } else add(key, value)
    }
    if (Array.isArray(input)) input.forEach(({ name, value }) => add(name, value))
    else for (const [key, value] of Object.entries(input ?? {})) write(key, value)
    return fields.join('&')
}

export const domMethods = {
    attr(name: string | Record<string, unknown>, value?: unknown) { return access(this, name, value, readAttr, writeAttr, arguments.length > 1) },
    removeAttr(name: string) { return this.each(function () { for (const key of words(name)) this.removeAttribute?.(key) }) },
    prop(name: string | Record<string, unknown>, value?: unknown) {
        return access(this, name, value, (node, key) => node?.[propertyName(key)],
            (node, key, next) => { if (node != null && next !== undefined) node[propertyName(key)] = next }, arguments.length > 1)
    },
    removeProp(name: string) { return this.each(function () { delete this[propertyName(name)] }) },
    hasClass(name: string) { return this.toArray().some(node => node?.classList?.contains(name)) },
    addClass(value?: SelectionValue) { return classes(this, value, 'add') },
    removeClass(value?: SelectionValue) { return classes(this, value, 'remove') },
    toggleClass(value?: SelectionValue, state?: boolean) { return classes(this, value, 'toggle', state) },
    html(value?: SelectionValue) {
        if (value === undefined) return this[0]?.innerHTML
        return this.each(function (index) {
            if (!isElement(this)) return
            const next = typeof value === 'function' ? value.call(this, index, this.innerHTML) : value
            if (next === undefined) return
            clear(this, false)
            this.replaceChildren(...materialize(next, this))
        })
    },
    text(value?: SelectionValue) {
        if (value === undefined) return this.toArray().map(node => node?.textContent ?? '').join('')
        return this.each(function (index) {
            if (![1, 9, 11].includes(this?.nodeType)) return
            const next = typeof value === 'function' ? value.call(this, index, this.textContent) : value
            if (next === undefined) return
            clear(this, false)
            this.textContent = next ?? ''
        })
    },
    empty() { return this.each(function () { if (isElement(this)) { clear(this, false); this.replaceChildren() } }) },
    append(...content: SelectionValue[]) { return insert(this, 'append', content) },
    prepend(...content: SelectionValue[]) { return insert(this, 'prepend', content) },
    before(...content: SelectionValue[]) { return insert(this, 'before', content) },
    after(...content: SelectionValue[]) { return insert(this, 'after', content) },
    replaceWith(...content: SelectionValue[]) { return insert(this, 'replaceWith', content) },
    appendTo(target: SelectionValue) { return insertTo(this, 'append', target) },
    prependTo(target: SelectionValue) { return insertTo(this, 'prepend', target) },
    insertBefore(target: SelectionValue) { return insertTo(this, 'before', target) },
    insertAfter(target: SelectionValue) { return insertTo(this, 'after', target) },
    replaceAll(target: SelectionValue) { return insertTo(this, 'replaceWith', target) },
    remove(selector?: SelectionValue) {
        const removed = selector === undefined ? this : this.filter(selector)
        removed.each(function () { if (isNode(this)) { clear(this, true); (this as ChildNode).remove?.() } })
        return this
    },
    detach(selector?: SelectionValue) {
        const removed = selector === undefined ? this : this.filter(selector)
        removed.each(function () { this?.remove?.() })
        return this
    },
    clone(data = false, deep = data) { return this.map(function () { return isNode(this) ? copy(this, data, deep) : undefined }) },
    val(value?: SelectionValue) {
        if (arguments.length === 0) return valueOf(this[0])
        return this.each(function (index) {
            setValue(this, typeof value === 'function' ? value.call(this, index, valueOf(this)) : value)
        })
    },
    serializeArray() {
        return this.toArray().flatMap(element => Array.from<SelectionValue>(element?.elements ?? [element]))
            .filter(element => element?.name && element.matches?.('input, select, textarea, keygen') &&
                !element.matches(':disabled') && !/^(?:submit|button|image|reset|file)$/.test(element.type) &&
                (!/^(?:checkbox|radio)$/.test(element.type) || element.checked))
            .flatMap(element => {
                const value = valueOf(element)
                if (value == null) return []
                return (Array.isArray(value) ? value : [value]).map(item => ({
                    name: element.name,
                    value: String(item).replace(/\r?\n/g, '\r\n'),
                }))
            })
    },
    serialize() { return param(this.serializeArray()) },
} satisfies ThisType<RuntimeCollection>
