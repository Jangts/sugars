/**
 * `@sugars/dom` 的公开入口。
 *
 * 组装 jQuery 风格的查询函数、集合原型和插件扩展入口，公开 TangramJS 的对象筛选入口。
 * `$` 组装 `Elements`、`DomEvent` 及插件扩展。旧对象筛选使用 `select`，`installGlobals` 供需要全局 jQuery 名称的插件使用。
 */

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

/**
 * 兼容旧对象筛选器，用标签、类名和属性从上下文查找元素。
 *
 * @param input - 普通选择器、元素集合或按标签和属性定义的旧式筛选对象。
 * @param context - 查找范围，缺省为当前文档。
 * @returns 可继续执行集合操作的 Elements。
 */
export function select<T = HTMLElement>(input?: Selector<T> | Record<string, unknown>, context?: Selector<ParentNode>): Elements<T>
export function select(input: unknown, context?: unknown) {
    if (!isPlainObject(input)) return $(input, context as Selector<ParentNode>)
    // 兼容旧选择器的对象参数，可按标签、类名和属性筛选。
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
    // 代理回调复用原处理器的 guid，使 off(originalHandler) 可以解除绑定。
    bound.guid = callback.guid ??= guid++
    return bound
}

/**
 * 可选地安装 jQuery 和 $。返回的清理函数只还原仍指向本包的全局名称。
 *
 * @param target - 要临时接管全局名称的对象。
 * @param dollar - 是否同时安装美元符号别名。
 * @returns 还原本次接管的函数。
 */
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
    /** 当前属性补间所属的集合成员。 */
    elem: T
    /** 正在动画的样式或滚动属性名。 */
    prop: string
    options: AnimationOptions<T>
    /** 属性起始数值。 */
    start: number
    /** 解析相对值与单位之后的终点。 */
    end: number
    /** 本次 step 调用时的当前数值。 */
    now: number
    /** 写回属性时使用的单位，数值滚动距离不带单位。 */
    unit: string
    /** 经缓动换算的动画进度。 */
    pos: number
}

export type Easing = (progress: number, currentTime: number, start: number, delta: number, duration: number) => number
export type Complete<T> = (this: T) => void
export type Speed = number | 'slow' | 'fast'

export interface AnimationOptions<T = Element> {
    /** 毫秒时长或 slow、fast 预设，缺省使用 fx.speeds._default。 */
    duration?: Speed
    /** 缓动名或接收进度和时间参数的函数。 */
    easing?: string | Easing
    /** false 允许立即与同一成员已有的动画并行，缺省按队列执行。 */
    queue?: boolean
    /** 已执行最终帧后调用，this 指向正在动画的成员。 */
    complete?: Complete<T>
    /** 每个属性当帧计算后、写入前调用。 */
    step?(this: T, value: number, tween: TweenState<T>): void
    /** 每帧通知进度及剩余毫秒。旧实现的 animation 参数为 null。 */
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
    /**
     * @param index - 成员索引，负值从集合末尾计数。
     * @returns 指定成员，越界时为 undefined。
     */
    get(index: number): T | undefined
    /**
     * @param items - 新集合的成员。
     * @returns 记住当前集合的新包装，可用 end() 回退。
     */
    pushStack<U>(items: Iterable<U> | ArrayLike<U>): Elements<U>
    /** @returns 上一层集合，没有上层时为空集合。 */
    end(): Elements<T>
    /**
     * @param callback - 以成员为 this，接收索引和值。返回 false 会结束遍历。
     * @returns 当前集合。
     */
    each(callback: (this: T, index: number, value: T) => unknown): this
    /**
     * @param callback - 将成员映射成新值，null 和 undefined 被跳过，数组展开一层。
     * @returns 记得上一层集合的映射结果。
     */
    map<U>(callback: (this: T, index: number, value: T) => U | U[] | null | undefined): Elements<U>
    slice(start?: number, end?: number): Elements<T>
    eq(index: number): Elements<T>
    first(): Elements<T>
    last(): Elements<T>
    even(): Elements<T>
    odd(): Elements<T>
    /**
     * @param selector - 在当前成员的后代中检查的选择器或元素。
     * @returns 去重后的匹配集合。
     */
    find<U extends Element = HTMLElement>(selector: Selector<U>): Elements<U>
    /**
     * @param selector - 匹配条件或用于比较的成员集合。
     * @returns 保留符合条件成员的新集合。
     */
    filter(selector: Filter<T>): Elements<T>
    not(selector: Filter<T>): Elements<T>
    is(selector: Filter<T>): boolean
    is(selector: Filter<T>, screen: number | false): boolean
    is(selector: Filter<T>, screen: true): T[]
    is(index?: number): string | undefined
    is(tags: true): (string | undefined)[]
    has(selector: Selector<Node>): Elements<T>
    /**
     * @param selector - 检查成员及祖先的条件。
     * @param boundary - 查找时遇到便停止的边界。
     * @returns 每条查找路径遇到的最先匹配项。
     */
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
    /**
     * @param name - DOM 属性名。
     * @returns 首个成员的属性值，属性缺失时为 undefined。
     */
    attr(name: string): string | undefined
    /**
     * @param name - 要写入的属性名。
     * @param value - 新值或按索引和旧值计算的回调，null 删除该属性。
     * @returns 当前集合。
     */
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
    /** @returns 首个对象成员的数据仓库，可能包含读入的 data 属性。无可用成员时为 undefined。 */
    data(): Record<string, any> | undefined
    data<V = any>(name: string): V | undefined
    data(name: string, value: unknown): this
    data(values: Record<string, unknown>): this
    removeData(name?: string | string[]): this
    html(): string | undefined
    /**
     * @param value - 替换成员内容的 HTML 或节点，也可按原内容计算。
     * @returns 当前集合。
     */
    html(value: Insertion<T>): this
    text(): string
    text(value: Setter<T, string | number | boolean | null>): this
    empty(): this
    /**
     * @param content - 追加的节点、文本或每个目标的计算回调。
     * @returns 当前集合。多目标插入时为前面的目标复制节点。
     */
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
    /**
     * @param selector - 可选的移除范围。
     * @returns 原集合。移除前清理相关节点及后代的集合数据和事件。
     */
    remove(selector?: Filter<T>): this
    /**
     * @param selector - 可选的移除范围。
     * @returns 原集合。节点移出 DOM，其已有插件数据仍可随节点复用。
     */
    detach(selector?: Filter<T>): this
    /**
     * @param withData - 是否复制源节点的插件数据及事件。
     * @param deepWithData - 是否复制后代的数据和事件，默认跟随 withData。
     * @returns 深复制的 DOM 节点所组成的集合。
     */
    clone(withData?: boolean, deepWithData?: boolean): Elements<T>
    val(): string | string[] | null | undefined
    val(value: Setter<T, string | number | readonly (string | number)[] | null>): this
    serialize(): string
    serializeArray(): { name: string; value: string }[]
    /**
     * @param name - 样式属性名，可用 CSS 名称或驼峰写法。
     * @returns 首个成员的样式文本，缺少元素时为 undefined。
     */
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
    /**
     * @param events - 事件名，可附加点分隔的命名空间。
     * @param handler - 接收 DomEvent 的直接绑定回调。
     * @returns 当前集合。
     */
    on(events: string | string[], handler: Handler<T>): this
    /**
     * @param events - 待绑定的事件名。
     * @param data - 派发时放在 event.data 的值。
     * @param handler - 接收 DomEvent 的回调。
     * @returns 当前集合。
     */
    on(events: string | string[], data: unknown, handler: Handler<any>): this
    /**
     * @param events - 待委托的事件名。
     * @param selector - 匹配传播路径的 CSS 选择器，null 走直接绑定。
     * @param data - 派发时附加到 event.data 的值。
     * @param handler - this 指向实际匹配节点的处理器。
     * @returns 当前集合。
     */
    on(events: string | string[], selector: string | null, data: unknown, handler: Handler<any>): this
    on(events: EventMap, selector?: string | unknown, data?: unknown): this
    one: Elements<T>['on']
    /**
     * @param events - 可用命名空间缩小清理范围。省略时清理全部符合条件的绑定。
     * @param selector - 匹配登记时的选择器，也可直接传处理器。
     * @param handler - 用于按函数身份定位的原处理器。
     * @returns 当前集合。
     */
    off(events?: string | string[] | DomEvent | EventMap, selector?: string | null | Handler<any>, handler?: Handler<any>): this
    /**
     * @param event - 事件名、原生事件或本包事件对象。
     * @param data - 传给处理器的附加数据。
     * @returns 当前集合。
     */
    trigger(event: string | Event | DomEvent, data?: unknown): this
    /**
     * 只对首个成员执行本包处理器。
     * @param event - 要触发的本包事件。
     * @param data - 传给处理器的附加数据。
     * @returns 最后一项非 undefined 的处理结果。
     */
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
    /**
     * @param values - 属性到目标数值、相对值或带单位文本的映射。
     * @param options - 时长、缓动、队列和回调设置。
     * @returns 启动或排入动画的当前集合。
     */
    animate(values: Record<string, string | number>, options?: AnimationOptions<T>): this
    /**
     * @param values - 要插值的目标属性值。
     * @param duration - 毫秒、速度名或完成回调。
     * @param easing - 缓动名，也支持在这个位置传完成回调。
     * @param callback - 单项动画完成回调。
     * @returns 当前集合。
     */
    animate(values: Record<string, string | number>, duration: Speed | Complete<T>, easing?: string | Complete<T>, callback?: Complete<T>): this
    transition(style: string, value: string | number, duration?: Speed, easing?: string, callback?: Complete<T>): this
    animator(options?: AnimationOptions<T> & { to?: Record<string, string | number>; tween?: Easing; callback?: Complete<T> }): this
    /**
     * @param clearQueue - 是否丢弃等待中的动画。
     * @param jumpToEnd - 是否提交运行中动画的终值，并按完成处理。
     * @returns 当前集合。
     */
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
    /**
     * @param callback - 文档准备完成后通知，this 为所属文档，参数为查询函数。
     * @returns 当前集合。
     */
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

/** 公开的查询函数与插件扩展点。插件通常在 $.fn 上扩展所有集合实例。 */
export interface DomQuery extends Extension {
    (callback: (this: Document, query: DomQuery) => void): Elements<Document>
    <T extends Element = HTMLElement>(selector: string, context?: Selector<ParentNode> | Record<string, unknown>): Elements<T>
    <T = HTMLElement>(input?: Selector<T>, context?: Selector<ParentNode>): Elements<T>
    new <T = HTMLElement>(input?: Selector<T>, context?: Selector<ParentNode>): Elements<T>
    /** 所有集合实例共享的扩展原型，插件可登记集合方法。 */
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
    /**
     * @param data - 用于序列化的对象或表单字段列表。
     * @param traditional - 是否按传统模式序列化数组。
     * @returns 转义后的查询字符串。
     */
    param(data: object, traditional?: boolean): string
    camelCase(name: string): string
    cssNumber: Record<string, boolean>
    expr: { pseudos: Record<string, (element: Element) => boolean>; ':': Record<string, (element: Element) => boolean> }
    easing: Record<string, Easing>
    Tween: { propHooks: Record<string, { get?: (tween: TweenState<any>) => number; set?: (tween: TweenState<any>) => void }> }
    fx: { off: boolean; speeds: Record<string, number>; step: Record<string, (tween: TweenState<any>) => void> }
    installGlobals: typeof installGlobals
}
