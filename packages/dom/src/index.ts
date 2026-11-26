import type { RuntimeCollection, SelectionValue } from './runtime-types.js'
import { Elements as RuntimeElements, isArrayLike, isNode, isWindow, parseHTML, pseudos, uniqueSort } from './selection.js'
import { camelCase, dataMethods, getData, hasData, removeData, setData } from './data.js'
import { DomEvent, eventMethods, hasEvents } from './events.js'
import { domMethods, param } from './dom.js'
import { cssNumber, styleMethods } from './style.js'
import { easing, effectMethods, fx, Tween } from './effects.js'

export { DomEvent }
export const Elements = RuntimeElements as unknown as {
    new <T = HTMLElement>(input?: Selector<T>, context?: Selector<ParentNode>): Elements<T>
}

// TangramJS src/dom/Elements.js, dom.select and dom.$.
const query = function $(input?: unknown, context?: unknown): RuntimeElements {
    if (typeof input === 'function') return new RuntimeElements(globalThis.document).ready(input)
    const properties = typeof input === 'string' && /^<[\w-]+\s*\/?>$/.test(input.trim()) && isPlainObject(context)
    const selection = new RuntimeElements(input, properties ? undefined : context)
    if (properties) {
        for (const [name, value] of Object.entries(context)) {
            if (typeof selection[name] === 'function') selection[name](value)
            else selection.attr(name, value)
        }
    }
    return selection
}
export const $ = query as unknown as DomQuery

export function select<T = HTMLElement>(input?: Selector<T> | Record<string, unknown>, context?: Selector<ParentNode>): Elements<T>
export function select(input: unknown, context?: unknown) {
    if (!isPlainObject(input)) return $(input, context as Selector<ParentNode>)
    // The old selector also accepted objects with tag, class, and attribute filters.
    const { tagName, className, ...attributes } = input
    const classes = typeof className === 'string' ? className.match(/\S+/g) ?? [] : (className ?? []) as string[]
    return $(context ?? globalThis.document).find('*').filter(function (this: Element) {
        return (!tagName || this.localName.toLowerCase() === String(tagName).toLowerCase()) &&
            classes.every(name => this.classList.contains(name)) &&
            Object.entries(attributes).every(([key, value]) => this.getAttribute(key) === String(value))
    })
}

function isPlainObject(object: unknown): object is Record<string, unknown> {
    if (object == null || Object.prototype.toString.call(object) !== '[object Object]') return false
    const proto = Object.getPrototypeOf(object)
    return proto === null || Object.getPrototypeOf(proto) === null && Object.hasOwn(proto, 'constructor') &&
        Function.prototype.toString.call(proto.constructor) === Function.prototype.toString.call(Object)
}

function merge(target: SelectionValue, sources: unknown[], deep: boolean): SelectionValue {
    for (const source of sources) {
        for (const [key, value] of Object.entries(source ?? {})) {
            if (key === '__proto__' || value === undefined || value === target) continue
            if (deep && (Array.isArray(value) || isPlainObject(value))) {
                const current = Object.hasOwn(target, key) ? target[key] : undefined
                const base = Array.isArray(value) ? Array.isArray(current) ? current : [] : isPlainObject(current) ? current : {}
                target[key] = merge(base, [value], true)
            } else target[key] = value
        }
    }
    return target
}

function extend(this: SelectionValue, ...args: SelectionValue[]) {
    if (this === $ && args.length === 2 && typeof args[1] === 'boolean' && isPlainObject(args[0])) {
        return extendSelection(args[0], args[1])
    }
    const deep = typeof args[0] === 'boolean' ? args.shift() : false
    const target = args.length > 1 ? args.shift() : this
    return merge(target != null && ['object', 'function'].includes(typeof target) ? target : {}, args, deep)
}

function extendSelection(methods: Record<string, unknown> & ThisType<RuntimeCollection>, rewrite = false): RuntimeCollection {
    const additions = Object.entries(methods).filter(([name]) => rewrite || !(name in $.fn))
    return merge($.fn, [Object.fromEntries(additions)], false)
}

select.extend = extendSelection

function each(value: SelectionValue, callback: (this: SelectionValue, key: string | number, value: SelectionValue) => unknown) {
    if (value == null) return value
    if (isArrayLike(value)) {
        for (let index = 0, length = value.length; index < length; index++) {
            if (callback.call(value[index], index, value[index]) === false) break
        }
    } else for (const key of Object.keys(value)) {
        if (callback.call(value[key], key, value[key]) === false) break
    }
    return value
}

let guid = 1
function proxy(input: SelectionValue, context: SelectionValue, ...args: unknown[]) {
    if (typeof context === 'string') [input, context] = [input?.[context], input]
    if (typeof input !== 'function') return undefined
    const callback = input as Function & { guid?: number }
    const bound = function (this: unknown, ...rest: unknown[]) { return callback.apply(context ?? this, [...args, ...rest]) }
    // jQuery-compatible off(originalHandler) for proxied callbacks.
    bound.guid = callback.guid ??= guid++
    return bound
}

export function installGlobals(target: object = globalThis, dollar = true) {
    const names = dollar ? ['jQuery', '$'] : ['jQuery']
    const previous = names.map(name => [name, Object.getOwnPropertyDescriptor(target, name)] as const)
    const globals = target as Record<string, unknown>
    for (const name of names) globals[name] = $
    return () => {
        for (const [name, descriptor] of previous) {
            if (globals[name] !== $) continue
            if (descriptor) Object.defineProperty(target, name, descriptor)
            else delete globals[name]
        }
    }
}

function ready(this: RuntimeCollection, callback: (this: Document, query: DomQuery) => void) {
    const doc = this[0]?.nodeType === 9 ? this[0] : this[0]?.ownerDocument ?? globalThis.document
    if (doc?.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => callback.call(doc, $), { once: true })
    else if (doc) queueMicrotask(() => callback.call(doc, $))
    return this
}

Object.assign(RuntimeElements.prototype, domMethods, styleMethods, dataMethods, eventMethods, effectMethods, {
    constructor: $,
    extend,
    ready,
    jquery: '0.1.0-sugars',
})

function Event(source: string | globalThis.Event, properties?: Record<string, unknown>) { return new DomEvent(source, properties) }
Event.prototype = DomEvent.prototype

function makeArray(value: SelectionValue, results: SelectionValue[] = []) {
    if (value != null) for (const item of isArrayLike(value) ? Array.from(value) : [value]) results.push(item)
    return results
}

function sortInto(items: Iterable<unknown>) {
    const sorted = uniqueSort(items)
    if (!Array.isArray(items)) return sorted
    items.length = 0
    for (const item of sorted) items.push(item)
    return items
}

query.prototype = RuntimeElements.prototype
Object.assign(query, {
    fn: RuntimeElements.prototype,
    extend,
    each,
    map(value: SelectionValue, callback: (item: SelectionValue, key: string | number, argument: unknown) => unknown, argument: unknown) {
        const result: unknown[] = []
        each(value, (key, item) => { const entry = callback(item, key, argument); if (entry != null) result.push(entry) })
        return result.flat()
    },
    grep: (items: ArrayLike<unknown>, callback: (item: unknown, index: number) => unknown, invert = false) => Array.from(items).filter((item, i) => Boolean(callback(item, i)) !== invert),
    merge(first: SelectionValue, second: ArrayLike<unknown>) { for (const item of Array.from(second)) Array.prototype.push.call(first, item); return first },
    makeArray,
    inArray: (item: unknown, items: ArrayLike<unknown> | null, start?: number) => items == null ? -1 : Array.prototype.indexOf.call(items, item, start),
    contains: (parent: Node | undefined, child: unknown) => parent !== child && isNode(child) && Boolean(parent?.contains?.(child)),
    unique: sortInto,
    uniqueSort: sortInto,
    isPlainObject,
    isEmptyObject: (object: unknown) => Object.keys(object ?? {}).length === 0,
    isFunction: (value: unknown) => typeof value === 'function',
    isArray: Array.isArray,
    isWindow,
    isNumeric: (value: unknown) => (typeof value === 'string' && value.trim() !== '' || typeof value === 'number') && Number.isFinite(Number(value)),
    type: (value: unknown) => value == null ? String(value) : Object.prototype.toString.call(value).slice(8, -1).toLowerCase(),
    trim: (value: unknown) => value == null ? '' : String(value).trim(),
    noop() {},
    now: Date.now,
    proxy,
    data(target: unknown, key?: string | Record<string, unknown>, value?: unknown) {
        return typeof key === 'object' && key !== null || value !== undefined
            ? setData(target, key as string | Record<string, unknown>, value) : getData(target, key)
    },
    removeData,
    hasData: (target: object) => hasData(target) || hasEvents(target),
    Event,
    parseHTML,
    parseJSON: JSON.parse,
    param,
    camelCase,
    cssNumber,
    expr: { pseudos, ':': pseudos },
    easing,
    Tween,
    fx,
    installGlobals,
})

export default $

export type Selector<T = Element> = string | T | Iterable<T> | ArrayLike<T> | null | false
export type Filter<T> = string | T | Iterable<T> | ArrayLike<T> | ((this: T, index: number, value: T) => unknown)
export type Setter<T, V> = V | ((this: T, index: number, previous: V) => V | undefined)
export type Content = string | number | Node | ArrayLike<Node> | Iterable<Node> | null | false
export type Insertion<T> = Content | ((this: T, index: number, markup: string) => Content)
export type Handler<T = Element> = ((this: T, event: DomEvent, ...parameters: any[]) => unknown) | false
export type EventMap = Record<string, Handler<any>>
export type Offset = { top: number; left: number }
type DirectionSetter<T> = Setter<T, number | string>

type EventShortcut<T, R> = {
    (): R
    (handler: Handler<T>): R
    (data: unknown, handler: Handler<T>): R
}

export interface TweenState<T = Element> {
    elem: T
    prop: string
    options: AnimationOptions<T>
    start: number
    end: number
    now: number
    unit: string
    pos: number
}

export type Easing = (progress: number, currentTime: number, start: number, delta: number, duration: number) => number
export type Complete<T> = (this: T) => void
export type Speed = number | 'slow' | 'fast'

export interface AnimationOptions<T = Element> {
    duration?: Speed
    easing?: string | Easing
    queue?: boolean
    complete?: Complete<T>
    step?(this: T, value: number, tween: TweenState<T>): void
    progress?(this: T, animation: unknown, percent: number, remaining: number): void
    [option: string]: unknown
}

export interface Elements<T = HTMLElement> extends Iterable<T> {
    readonly length: number
    [index: number]: T
    jquery: string
    prevObject?: Elements
    push(...values: T[]): number
    sort(compare?: (left: T, right: T) => number): this
    splice(start: number, count?: number, ...values: T[]): T[]
    toArray(): T[]
    get(): T[]
    get(index: number): T | undefined
    pushStack<U>(items: Iterable<U> | ArrayLike<U>): Elements<U>
    end(): Elements<T>
    each(callback: (this: T, index: number, value: T) => unknown): this
    map<U>(callback: (this: T, index: number, value: T) => U | U[] | null | undefined): Elements<U>
    slice(start?: number, end?: number): Elements<T>
    eq(index: number): Elements<T>
    first(): Elements<T>
    last(): Elements<T>
    even(): Elements<T>
    odd(): Elements<T>
    find<U extends Element = HTMLElement>(selector: Selector<U>): Elements<U>
    filter(selector: Filter<T>): Elements<T>
    not(selector: Filter<T>): Elements<T>
    is(selector: Filter<T>): boolean
    is(selector: Filter<T>, screen: number | false): boolean
    is(selector: Filter<T>, screen: true): T[]
    is(index?: number): string | undefined
    is(tags: true): (string | undefined)[]
    has(selector: Selector<Node>): Elements<T>
    closest(selector: Filter<T>, boundary?: Element): Elements<HTMLElement>
    closet(selector: Filter<T>): Elements<HTMLElement>
    sub(part: number | readonly number[] | 'first' | 'last' | 'even' | 'odd'): Elements<T>
    add<U>(selector: Selector<U>, context?: Selector<ParentNode>): Elements<T | U>
    concat<U>(selector: Selector<U>, context?: Selector<ParentNode>): Elements<T | U>
    addBack(selector?: Filter<T>): Elements<T>
    index(selector?: Selector<T>): number
    parent(selector?: string): Elements<HTMLElement>
    children(selector?: string): Elements<HTMLElement>
    contents(): Elements<Node>
    siblings(selector?: string): Elements<HTMLElement>
    next(selector?: string): Elements<HTMLElement>
    prev(selector?: string): Elements<HTMLElement>
    parents(selector?: string): Elements<HTMLElement>
    parentsUntil(until?: Filter<Element>, selector?: string): Elements<HTMLElement>
    nextAll(selector?: string): Elements<HTMLElement>
    prevAll(selector?: string): Elements<HTMLElement>
    nextUntil(until?: Filter<Element>, selector?: string): Elements<HTMLElement>
    prevUntil(until?: Filter<Element>, selector?: string): Elements<HTMLElement>
    attr(name: string): string | undefined
    attr(name: string, value: Setter<T, string | number | boolean | null | undefined>): this
    attr(values: Record<string, Setter<T, string | number | boolean | null | undefined>>): this
    removeAttr(name: string): this
    prop<V = unknown>(name: string): V | undefined
    prop(name: string, value: unknown): this
    prop(values: Record<string, unknown>): this
    removeProp(name: string): this
    hasClass(name: string): boolean
    addClass(value: Setter<T, string | string[]>): this
    removeClass(value?: Setter<T, string | string[]>): this
    toggleClass(value: Setter<T, string | string[] | boolean>, state?: boolean): this
    data(): Record<string, any> | undefined
    data<V = any>(name: string): V | undefined
    data(name: string, value: unknown): this
    data(values: Record<string, unknown>): this
    removeData(name?: string | string[]): this
    html(): string | undefined
    html(value: Insertion<T>): this
    text(): string
    text(value: Setter<T, string | number | boolean | null>): this
    empty(): this
    append(...content: Insertion<T>[]): this
    prepend(...content: Insertion<T>[]): this
    before(...content: Insertion<T>[]): this
    after(...content: Insertion<T>[]): this
    replaceWith(...content: Insertion<T>[]): this
    appendTo(target: Selector<Node>): Elements<T>
    prependTo(target: Selector<Node>): Elements<T>
    insertBefore(target: Selector<Node>): Elements<T>
    insertAfter(target: Selector<Node>): Elements<T>
    replaceAll(target: Selector<Node>): Elements<T>
    remove(selector?: Filter<T>): this
    detach(selector?: Filter<T>): this
    clone(withData?: boolean, deepWithData?: boolean): Elements<T>
    val(): string | string[] | null | undefined
    val(value: Setter<T, string | number | readonly (string | number)[] | null>): this
    serialize(): string
    serializeArray(): { name: string; value: string }[]
    css(name: string): string | undefined
    css(names: readonly string[]): Record<string, string | undefined>
    css(name: string, value: Setter<T, string | number | undefined>): this
    css(values: Record<string, Setter<T, string | number | undefined>>): this
    width(): number | undefined
    width(value: DirectionSetter<T>): this
    height(): number | undefined
    height(value: DirectionSetter<T>): this
    innerWidth(): number | undefined
    innerWidth(value: DirectionSetter<T>): this
    innerHeight(): number | undefined
    innerHeight(value: DirectionSetter<T>): this
    outerWidth(includeMargin?: boolean): number | undefined
    outerWidth(value: DirectionSetter<T>, includeMargin?: boolean): this
    outerHeight(includeMargin?: boolean): number | undefined
    outerHeight(value: DirectionSetter<T>, includeMargin?: boolean): this
    widths(): number
    heights(): number
    scrollLeft(): number | undefined
    scrollLeft(value: Setter<T, number>): this
    scrollTop(): number | undefined
    scrollTop(value: Setter<T, number>): this
    scrollWidth(): number | undefined
    scrollHeight(): number | undefined
    offsetWidth(): number | undefined
    offsetHeight(): number | undefined
    offsetLeft(): number | undefined
    offsetTop(): number | undefined
    offset(): Offset | undefined
    offset(value: Partial<Offset> | ((this: T, index: number, previous: Offset) => Partial<Offset>)): this
    position(): Offset | undefined
    offsetParent(): Elements<HTMLElement>
    on(events: string | string[], handler: Handler<T>): this
    on(events: string | string[], data: unknown, handler: Handler<any>): this
    on(events: string | string[], selector: string | null, data: unknown, handler: Handler<any>): this
    on(events: EventMap, selector?: string | unknown, data?: unknown): this
    one: Elements<T>['on']
    off(events?: string | string[] | DomEvent | EventMap, selector?: string | null | Handler<any>, handler?: Handler<any>): this
    trigger(event: string | Event | DomEvent, data?: unknown): this
    triggerHandler(event: string | Event | DomEvent, data?: unknown): unknown
    bind(events: string | string[], data: unknown, handler?: Handler<T>): this
    unbind(events?: string | string[], handler?: Handler<T>): this
    delegate(selector: string, events: string, data: unknown, handler?: Handler<any>): this
    undelegate(selector: string, events?: string, handler?: Handler<any>): this
    hover(enter: Handler<T>, leave?: Handler<T>): this
    blur: EventShortcut<T, this>
    change: EventShortcut<T, this>
    click: EventShortcut<T, this>
    dblclick: EventShortcut<T, this>
    focus: EventShortcut<T, this>
    focusin: EventShortcut<T, this>
    focusout: EventShortcut<T, this>
    input: EventShortcut<T, this>
    keydown: EventShortcut<T, this>
    keypress: EventShortcut<T, this>
    keyup: EventShortcut<T, this>
    mousedown: EventShortcut<T, this>
    mouseenter: EventShortcut<T, this>
    mouseleave: EventShortcut<T, this>
    mousemove: EventShortcut<T, this>
    mouseout: EventShortcut<T, this>
    mouseover: EventShortcut<T, this>
    mouseup: EventShortcut<T, this>
    resize: EventShortcut<T, this>
    scroll: EventShortcut<T, this>
    select: EventShortcut<T, this>
    submit: EventShortcut<T, this>
    animate(values: Record<string, string | number>, options?: AnimationOptions<T>): this
    animate(values: Record<string, string | number>, duration: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    transition(style: string, value: string | number, duration?: Speed, easing?: string, callback?: Complete<T>): this
    animator(options?: AnimationOptions<T> & { to?: Record<string, string | number>; tween?: Easing; callback?: Complete<T> }): this
    stop(clearQueue?: boolean, jumpToEnd?: boolean): this
    show(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    hide(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    toggle(state?: boolean | Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    fadeIn(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    fadeOut(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    fadeToggle(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    fadeTo(duration: Speed, opacity: number, easing?: string | Complete<T>, callback?: Complete<T>): this
    slideDown(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    slideUp(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    slideToggle(duration?: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    ready(callback: (this: Document, query: DomQuery) => void): this
}

interface Extension {
    extend(methods: Record<string, unknown> & ThisType<Elements<any>>): this
}
interface EventFactory {
    <T extends Record<string, unknown>>(source: string | Event, properties: T): DomEvent & T
    (source: string | Event): DomEvent
    new (source: string | Event, properties?: Record<string, unknown>): DomEvent
}

export interface DomQuery extends Extension {
    (callback: (this: Document, query: DomQuery) => void): Elements<Document>
    <T extends Element = HTMLElement>(selector: string, context?: Selector<ParentNode> | Record<string, unknown>): Elements<T>
    <T = HTMLElement>(input?: Selector<T>, context?: Selector<ParentNode>): Elements<T>
    new <T = HTMLElement>(input?: Selector<T>, context?: Selector<ParentNode>): Elements<T>
    fn: Elements<any> & Extension & Record<string, any>
    extend(methods: Record<string, unknown> & ThisType<Elements<any>>, rewrite: boolean): Elements<any>
    extend<T, S>(target: T, source: S): T & S
    extend<T>(deep: boolean, target: T, ...sources: object[]): T & Record<string, any>
    extend<T>(target: T, ...sources: object[]): T & Record<string, any>
    each<T>(items: ArrayLike<T>, callback: (this: T, index: number, item: T) => unknown): ArrayLike<T>
    each<T>(items: Record<string, T>, callback: (this: T, key: string, item: T) => unknown): Record<string, T>
    map<T, U>(items: ArrayLike<T> | Record<string, T>, callback: (item: T, key: any, arg: unknown) => U | U[] | null | undefined, argument?: unknown): U[]
    grep<T>(items: ArrayLike<T>, callback: (item: T, index: number) => unknown, invert?: boolean): T[]
    merge<T>(first: T[], second: ArrayLike<T>): T[]
    makeArray<T>(item: T | ArrayLike<T>, result?: T[]): T[]
    inArray<T>(item: T, values: ArrayLike<T>, start?: number): number
    contains(parent: Node, child: Node): boolean
    unique<T>(items: Iterable<T>): T[]
    uniqueSort<T>(items: Iterable<T>): T[]
    isPlainObject(value: unknown): value is Record<string, unknown>
    isEmptyObject(value: unknown): boolean
    isFunction(value: unknown): value is (...args: any[]) => unknown
    isWindow(value: unknown): value is Window
    isArray: typeof Array.isArray
    isNumeric(value: unknown): boolean
    type(value: unknown): string
    trim(value: unknown): string
    noop(): void
    now(): number
    proxy<F extends (...args: any[]) => any>(callback: F, context: unknown, ...leading: unknown[]): F | undefined
    data<V = any>(target: object, key: string): V | undefined
    data(target: object, key?: string | Record<string, unknown>, value?: unknown): any
    removeData(target: object, name?: string | string[]): void
    hasData(target: object): boolean
    Event: EventFactory
    parseHTML(markup: string, context?: Node, keepScripts?: boolean): Node[]
    parseJSON: typeof JSON.parse
    param(data: object, traditional?: boolean): string
    camelCase(name: string): string
    cssNumber: Record<string, boolean>
    expr: { pseudos: Record<string, (element: Element) => boolean>; ':': Record<string, (element: Element) => boolean> }
    easing: Record<string, Easing>
    Tween: { propHooks: Record<string, { get?: (tween: TweenState<any>) => number; set?: (tween: TweenState<any>) => void }> }
    fx: { off: boolean; speeds: Record<string, number>; step: Record<string, (tween: TweenState<any>) => void> }
    installGlobals: typeof installGlobals
}
