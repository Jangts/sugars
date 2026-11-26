/* 将选择器、原生节点或值序列转换成集合，处理选择器扩展、集合筛选与 end() 回退链。 */

import type { SelectionPredicate, SelectionValue } from './runtime-types.js'

// TangramJS src/dom/Elements.js, collection construction and traversal.
export const isNode = (value: SelectionValue): value is Node => value != null && typeof value.nodeType === 'number'
export const isElement = (value: SelectionValue): value is HTMLElement => value?.nodeType === 1
export const isWindow = (value: SelectionValue): value is Window => value != null && value === value.window
export const isArrayLike = (value: SelectionValue): value is ArrayLike<SelectionValue> => value != null && typeof value !== 'string' &&
    typeof value !== 'function' && !isWindow(value) && Number.isSafeInteger(value.length) && value.length >= 0

export function parseHTML(markup: string, context: Node = globalThis.document, keepScripts = false) {
    const doc = context?.nodeType === 9 ? context as Document : context?.ownerDocument ?? globalThis.document
    if (!doc || typeof markup !== 'string') return []
    const template = doc.createElement('template')
    template.innerHTML = markup
    if (!keepScripts) template.content.querySelectorAll('script').forEach(script => script.remove())
    return Array.from(template.content.childNodes)
}

export function uniqueSort<T>(items: Iterable<T>): T[] {
    return [...new Set(items)].sort((first, second) => {
        const comparator = first as SelectionValue
        if (!comparator?.compareDocumentPosition || !isNode(second)) return 0
        const position = comparator.compareDocumentPosition(second)
        if (position & 1) return 0
        return position & 4 ? -1 : 1
    })
}

const visible = (element: HTMLElement) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
export const pseudos: Record<string, (element: HTMLElement) => boolean> = Object.assign(Object.create(null), {
    visible,
    hidden: (element: HTMLElement) => !visible(element),
    input: (element: Element) => element.matches('input, select, textarea, button'),
    button: (element: Element) => element.matches('button, input[type=button]'),
    checkbox: (element: Element) => element.matches('input[type=checkbox]'),
    radio: (element: Element) => element.matches('input[type=radio]'),
    file: (element: Element) => element.matches('input[type=file]'),
    password: (element: Element) => element.matches('input[type=password]'),
    text: (element: Element) => element.matches('input:not([type]), input[type=text]'),
    selected: (element: HTMLOptionElement) => element.selected === true,
    header: (element: Element) => /^H[1-6]$/.test(element.tagName),
    parent: (element: Element) => Array.from(element.childNodes).some(node => node.nodeType < 6),
})

const position: Record<string, (items: HTMLElement[], index: number) => HTMLElement[]> = {
    first: (items) => items.slice(0, 1),
    last: (items) => items.slice(-1),
    eq: (items, index) => index >= -items.length && index < items.length ? [items.at(index)!] : [],
    even: (items) => items.filter((_, i) => i % 2 === 0),
    odd: (items) => items.filter((_, i) => i % 2 === 1),
    lt: (items, index) => items.slice(0, index),
    gt: (items, index) => items.slice(Math.max(0, (index < 0 ? items.length + index : index) + 1)),
}

function selectorSuffix(selector: string): { base: string; steps: [string, number][] } {
    const steps: [string, number][] = []
    let base = selector.trim()
    let match
    while ((match = /(?<!\\):([\w-]+)(?:\((-?\d+)\))?$/.exec(base))) {
        const name = match[1]!
        const arg = match[2]
        if (!Object.hasOwn(pseudos, name) && !Object.hasOwn(position, name)) break
        steps.unshift([name, Number(arg)])
        const prefix = base.slice(0, match.index)
        base = /[\s>+~]$/.test(prefix) ? prefix + '*' : prefix
    }
    return { base: base || '*', steps }
}

function applySuffix(items: HTMLElement[], steps: [string, number][]) {
    for (const [name, index] of steps) {
        items = Object.hasOwn(position, name) ? position[name]!(items, index) : items.filter(pseudos[name]!)
    }
    return items
}

function selectorGroups(selector: string) {
    const groups = []
    let begin = 0
    let depth = 0
    let quote: string | undefined
    for (let i = 0; i < selector.length; i++) {
        const char = selector[i]
        if (char === '\\') i++
        else if (quote) {
            if (char === quote) quote = undefined
        } else if (char === '"' || char === "'") quote = char
        else if (char === '(' || char === '[') depth++
        else if (char === ')' || char === ']') depth--
        else if (char === ',' && !depth) {
            groups.push(selector.slice(begin, i))
            begin = i + 1
        }
    }
    groups.push(selector.slice(begin))
    return groups
}

export function query(selector: string, context: ParentNode | undefined): HTMLElement[] {
    if (!context?.querySelectorAll || !selector.trim()) return []
    const groups = selectorGroups(selector)
    const result = groups.flatMap(group => {
        if (!group.trim()) throw new SyntaxError('Empty selector group')
        const { base, steps } = selectorSuffix(group)
        const scoped = /^[>+~]/.test(base) ? ':scope ' + base : base
        return applySuffix(Array.from(context.querySelectorAll<HTMLElement>(scoped)), steps)
    })
    return groups.length === 1 ? result : uniqueSort(result)
}

function matching(items: SelectionValue[], selector: string): SelectionValue[] {
    if (!selector.trim()) return []
    const matched = new Set<HTMLElement>()
    for (const group of selectorGroups(selector)) {
        const { base, steps } = selectorSuffix(group)
        for (const item of applySuffix(items.filter(element => isElement(element) && element.matches(base)), steps)) {
            matched.add(item)
        }
    }
    return items.filter(item => matched.has(item))
}

export function matches(element: SelectionValue, selector: string) {
    return matching([element], selector).length > 0
}

export function choose(input: SelectionValue, context?: SelectionValue): SelectionValue[] {
    if (input == null || input === false || input === '') return []
    if (typeof input === 'string') {
        const value = input.trim()
        const doc = globalThis.document
        if (value.startsWith('<') && value.endsWith('>')) {
            return parseHTML(value, isNode(context) ? context : undefined, true)
        }
        const roots = context === undefined ? [doc] : choose(context)
        return uniqueSort(roots.flatMap(root => query(value, root)))
    }
    if (isNode(input) || isWindow(input)) return [input]
    if (isArrayLike(input) || typeof (input as Partial<Iterable<SelectionValue>>)?.[Symbol.iterator] === 'function') return Array.from(input as ArrayLike<SelectionValue> | Iterable<SelectionValue>)
    return [input]
}

function filterItems(items: SelectionValue[], selector: SelectionValue, invert = false): SelectionValue[] {
    if (typeof selector === 'function') return items.filter((item, i) => Boolean(selector.call(item, i, item)) !== invert)
    const candidates = new Set(typeof selector === 'string' ? matching(items, selector) : choose(selector))
    return items.filter(item => candidates.has(item) !== invert)
}

function related(elements: Elements, key: 'parentElement' | 'previousElementSibling' | 'nextElementSibling', until: SelectionValue, filter: SelectionValue, reverse = false): Elements {
    let nodes = elements.toArray().flatMap(element => {
        const list: HTMLElement[] = []
        for (let node = element?.[key]; isElement(node); node = node[key]) {
            if (until !== undefined && filterItems([node], until).length) break
            list.push(node)
        }
        return list
    })
    if (elements.length > 1) {
        nodes = uniqueSort(nodes)
        if (reverse) nodes.reverse()
    }
    return elements.pushStack(filter === undefined ? nodes : filterItems(nodes, filter))
}

export class Elements implements Iterable<SelectionValue> {
    [index: number]: SelectionValue
    [key: string]: SelectionValue
    declare length: number
    declare prevObject?: Elements
    declare push: (...items: SelectionValue[]) => number
    declare ready: (callback: Function) => this
    declare attr: (name: string, value: unknown) => this

    constructor(input?: unknown, context?: unknown) {
        this.length = 0
        for (const item of choose(input, context)) this.push(item)
    }

    [Symbol.iterator](): ArrayIterator<SelectionValue> { return Array.prototype[Symbol.iterator].call(this) }

    toArray() { return Array.from(this) }
    get(index?: number) {
        if (index == null) return this.toArray()
        return this[index < 0 ? this.length + index : index]
    }
    pushStack(items: Iterable<SelectionValue> | ArrayLike<SelectionValue>): Elements {
        const next = new Elements(items)
        next.prevObject = this
        return next
    }
    end() { return this.prevObject ?? new Elements() }
    each(callback: SelectionPredicate): this {
        for (let i = 0; i < this.length; i++) if (callback.call(this[i], i, this[i]) === false) break
        return this
    }
    map(callback: SelectionPredicate): Elements {
        return this.pushStack(this.toArray().flatMap((item, i) => callback.call(item, i, item) ?? []).filter(item => item != null))
    }
    slice(...bounds: [start?: number, end?: number]) { return this.pushStack(this.toArray().slice(...bounds)) }
    eq(index: number) {
        const item = this.get(Number(index))
        return this.pushStack(item === undefined ? [] : [item])
    }
    first() { return this.eq(0) }
    last() { return this.eq(-1) }
    even() { return this.filter((i: number) => i % 2 === 0) }
    odd() { return this.filter((i: number) => i % 2 === 1) }

    find(selector: SelectionValue): Elements {
        if (typeof selector !== 'string') {
            return this.pushStack(choose(selector).filter(node => isNode(node) && this.toArray().some(root => root !== node && root?.contains?.(node))))
        }
        return this.pushStack(uniqueSort(this.toArray().flatMap(node => query(selector, node))))
    }
    filter(selector: SelectionValue): Elements { return this.pushStack(filterItems(this.toArray(), selector)) }
    not(selector: SelectionValue): Elements { return this.pushStack(filterItems(this.toArray(), selector, true)) }
    is(selector?: SelectionValue, screen?: boolean | number): SelectionValue {
        if (typeof screen === 'number') return this.eq(screen).is(selector)
        if (screen === true) return this.filter(selector).get()
        if (screen === false) return this.filter(selector).length === this.length
        if (selector === undefined || typeof selector === 'number') return this.get(selector ?? 0)?.tagName
        if (selector === true) return this.toArray().map(item => item?.tagName)
        return this.filter(selector).length > 0
    }
    has(selector: SelectionValue): Elements {
        return this.filter(function (this: SelectionValue) {
            return typeof selector === 'string' ? query(selector, this).length > 0
                : choose(selector).some(node => node !== this && isNode(node) && this?.contains?.(node))
        })
    }
    closest(selector: SelectionValue, boundary?: Element): Elements {
        return this.pushStack(uniqueSort(this.toArray().flatMap(item => {
            for (let node = item; isElement(node) && node !== boundary; node = node.parentElement) {
                if (filterItems([node], selector).length) return [node]
            }
            return []
        })))
    }
    closet(selector: string): Elements { return this.pushStack(this.parent().closest(selector)) }
    add(input: SelectionValue, context?: SelectionValue): Elements { return this.pushStack(uniqueSort([...this, ...choose(input, context)])) }
    concat(input: SelectionValue, context?: SelectionValue): this {
        const known = new Set(this)
        for (const item of choose(input, context)) {
            if (!known.has(item)) {
                known.add(item)
                this.push(item)
            }
        }
        return this
    }
    addBack(selector?: SelectionValue): Elements { return this.add(selector === undefined ? this.prevObject : this.prevObject?.filter(selector)) }
    sub(part: number | readonly number[] | string): Elements {
        if (typeof part === 'number') return this.eq(part)
        if (part === 'odd') return this.even()
        if (part === 'even') return this.odd()
        if (part === 'first' || part === 'last') return this[part]()
        return this.pushStack(Array.isArray(part) ? new Set(part.map(index => this.get(index)).filter(item => item !== undefined)) : [])
    }
    index(input?: SelectionValue): number {
        if (input === undefined) {
            const first = this[0]
            return first?.parentElement ? Array.from(first.parentElement.children).indexOf(first) : -1
        }
        return typeof input === 'string' ? choose(input).indexOf(this[0]) : this.toArray().indexOf(choose(input)[0])
    }
    parent(filter?: string): Elements { return this.#walk(item => [item?.parentElement].filter(Boolean), filter) }
    children(filter?: string): Elements { return this.#walk(item => Array.from(item?.children ?? []), filter) }
    contents() { return this.pushStack(this.toArray().flatMap(item => item?.contentDocument ?? Array.from((item?.content ?? item)?.childNodes ?? []))) }
    siblings(filter?: string): Elements { return this.#walk(item => Array.from(item?.parentElement?.children ?? []).filter(node => node !== item), filter) }
    next(filter?: string): Elements { return this.#walk(item => [item?.nextElementSibling].filter(Boolean), filter) }
    prev(filter?: string): Elements { return this.#walk(item => [item?.previousElementSibling].filter(Boolean), filter) }
    parents(filter?: string): Elements { return related(this, 'parentElement', undefined, filter, true) }
    parentsUntil(until?: SelectionValue, filter?: string): Elements { return related(this, 'parentElement', until, filter, true) }
    nextAll(filter?: string): Elements { return related(this, 'nextElementSibling', undefined, filter) }
    prevAll(filter?: string): Elements { return related(this, 'previousElementSibling', undefined, filter, true) }
    nextUntil(until?: SelectionValue, filter?: string): Elements { return related(this, 'nextElementSibling', until, filter) }
    prevUntil(until?: SelectionValue, filter?: string): Elements { return related(this, 'previousElementSibling', until, filter, true) }

    #walk(visit: (item: SelectionValue) => SelectionValue[], filter?: string): Elements {
        const nodes = uniqueSort(this.toArray().flatMap(visit))
        return this.pushStack(filter === undefined ? nodes : filterItems(nodes, filter))
    }
}

Object.assign(Elements.prototype, { push: Array.prototype.push, sort: Array.prototype.sort, splice: Array.prototype.splice })
