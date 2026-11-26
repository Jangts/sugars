import type { RuntimeCollection, SelectionValue } from './runtime-types.js'
import type { EventMap, Handler } from './index.js'
import { isElement, isWindow, query } from './selection.js'

// TangramJS src/dom/{Elements,Events}.js, delegated dispatch over native events.
type Listener = ((this: SelectionValue, event: DomEvent, ...extra: SelectionValue[]) => unknown) & { guid?: number }
type EventNames = string | string[] | null | undefined
type EventSource = string | Event | DomEvent
type EventRegistration = {
    type: string
    native: string
    namespaces: string[]
    namespace: string
    selector: string | null | undefined
    data: unknown
    handler: Listener
    once: boolean
    fired?: boolean
}
type EventGroup = { records: EventRegistration[]; listener: (event: Event) => void }

const registrations = new WeakMap<object, Map<string, EventGroup>>()
const wrappers = new WeakMap<Event, DomEvent>()
const knownAliases: Record<string, string> = { mouseenter: 'mouseover', mouseleave: 'mouseout', pointerenter: 'pointerover', pointerleave: 'pointerout' }
const focusAliases: Record<string, string> = { focus: 'focusin', blur: 'focusout' }
const returnFalse = () => false
const splitWords = (words: EventNames): string[] => Array.isArray(words) ? words : words?.match(/\S+/g) ?? []
const parseType = (name: string) => {
    const [type = '', ...namespaces] = name.split('.')
    return { type, namespaces: namespaces.filter(Boolean).sort() }
}
const nativeType = (type: string, selector?: string | null) => Object.hasOwn(knownAliases, type) ? knownAliases[type]!
    : selector && Object.hasOwn(focusAliases, type) ? focusAliases[type]! : type
const includesNamespace = (namespaces: string[], requested: string[]) => requested.every(name => namespaces.includes(name))

export class DomEvent {
    #defaultPrevented = false
    #propagationStopped = false
    #immediateStopped = false

    declare type: string
    declare namespace: string
    declare timeStamp: number
    declare originalEvent?: Event
    declare target: SelectionValue
    declare relatedTarget?: EventTarget | null
    declare delegateTarget: SelectionValue
    declare currentTarget: SelectionValue
    declare data: SelectionValue
    declare result: unknown
    declare handleObj?: EventRegistration
    declare extra?: unknown[]
    declare triggerType?: string
    declare button?: number
    declare buttons?: number
    declare key?: string
    declare keyCode?: number
    declare code?: string
    declare pageX?: number
    declare pageY?: number
    declare clientX?: number
    declare clientY?: number
    declare ctrlKey?: boolean
    declare metaKey?: boolean
    declare shiftKey?: boolean
    declare altKey?: boolean

    constructor(source: string | Event, properties?: Record<string, unknown>) {
        const { type, namespaces } = parseType(typeof source === 'string' ? source : source.type)
        this.type = type
        this.namespace = namespaces.join('.')
        this.timeStamp = typeof source === 'string' ? Date.now() : source.timeStamp
        if (typeof source !== 'string') {
            this.originalEvent = source
            const target = source.target as Node | null
            this.target = target?.nodeType === 3 ? target.parentNode : target
            this.relatedTarget = (source as MouseEvent).relatedTarget
        }
        Object.assign(this, properties)
    }

    preventDefault() {
        this.#defaultPrevented = true
        this.originalEvent?.preventDefault?.()
    }
    stopPropagation() {
        this.#propagationStopped = true
        this.originalEvent?.stopPropagation?.()
    }
    stopImmediatePropagation() {
        this.#immediateStopped = true
        this.originalEvent?.stopImmediatePropagation?.()
        this.stopPropagation()
    }
    isDefaultPrevented() { return this.#defaultPrevented || Boolean(this.originalEvent?.defaultPrevented) }
    isPropagationStopped() { return this.#propagationStopped }
    isImmediatePropagationStopped() { return this.#immediateStopped }
    get defaultPrevented() { return this.isDefaultPrevented() }
    get which() {
        const event = this.originalEvent as (Event & Partial<KeyboardEvent & MouseEvent>) | undefined
        return event?.which || event?.charCode || event?.keyCode || (event?.button != null ? [1, 2, 3][event.button] : undefined)
    }
    set which(value: number | undefined) { Object.defineProperty(this, 'which', { value, writable: true, configurable: true }) }
}

for (const name of ('altKey bubbles button buttons cancelable changedTouches clientX clientY code ctrlKey detail key keyCode ' +
    'metaKey offsetX offsetY pageX pageY pointerId pointerType screenX screenY shiftKey touches deltaX deltaY deltaMode').split(' ')) {
    Object.defineProperty(DomEvent.prototype, name, {
        get(this: DomEvent) { return (this.originalEvent as SelectionValue)?.[name] },
        set(this: DomEvent, value: unknown) { Object.defineProperty(this, name, { value, writable: true, configurable: true }) },
        configurable: true,
    })
}

function dispatch(target: SelectionValue, records: EventRegistration[], event: DomEvent,
    extra: unknown[], requested: string[] = [], logicalType?: string) {
    const matching = records.filter(record =>
        (!logicalType || record.type === logicalType) && includesNamespace(record.namespaces, requested))
    const delegated = matching.filter(record => record.selector)
    const queue: [SelectionValue, EventRegistration[]][] = []
    const selects = new Map<string, Set<HTMLElement>>()
    if (delegated.length && event.target !== target) {
        for (let node = event.target; node && node !== target; node = node.parentNode) {
            if (!isElement(node) || event.type === 'click' && (node as HTMLButtonElement).disabled) continue
            const handlers = delegated.filter(record => {
                const selector = record.selector!
                if (!selects.has(selector)) selects.set(selector, new Set(query(selector, target)))
                return selects.get(selector)!.has(node)
            })
            if (handlers.length) queue.push([node, handlers])
        }
    }
    queue.push([target, matching.filter(record => !record.selector)])
    event.delegateTarget = target
    const previousType = event.type
    for (const [current, handlers] of queue) {
        event.currentTarget = current
        for (const record of handlers) {
            if (event.isImmediatePropagationStopped()) break
            if (Object.hasOwn(knownAliases, record.type) && event.relatedTarget &&
                (event.relatedTarget === current || current.contains?.(event.relatedTarget))) continue
            if (record.once) {
                if (record.fired) continue
                record.fired = true
                removeRecord(target, record)
            }
            event.type = record.type
            event.data = record.data
            event.handleObj = record
            const result = record.handler.call(current, event, ...extra)
            if (result !== undefined) event.result = result
            if (result === false) {
                event.preventDefault()
                event.stopPropagation()
            }
        }
        if (event.isPropagationStopped()) break
    }
    event.type = previousType
    return event.result
}

function add(target: SelectionValue, names: EventNames, selector: string | null | undefined,
    data: unknown, handler: Listener, once: boolean) {
    if (target == null || !['object', 'function'].includes(typeof target)) return
    let types = registrations.get(target)
    if (!types) registrations.set(target, types = new Map())
    for (const name of splitWords(names)) {
        const { type, namespaces } = parseType(name)
        if (!type) continue
        const native = nativeType(type, selector)
        let group = types.get(native)
        if (!group) {
            group = { records: [], listener: original => {
                let event = wrappers.get(original)
                if (!event) wrappers.set(original, event = new DomEvent(original))
                else event.originalEvent = original
                event.target ??= original.target
                dispatch(target, group!.records, event, event.extra ?? [], splitNamespace(event.namespace), event.triggerType)
            } }
            types.set(native, group)
            target.addEventListener?.(native, group.listener)
        }
        group.records.push({ type, native, namespaces, namespace: namespaces.join('.'), selector, data, handler, once })
    }
}

const splitNamespace = (namespace: string) => namespace ? namespace.split('.') : []

function removeRecord(target: SelectionValue, record: EventRegistration) {
    const types = registrations.get(target)
    const group = types?.get(record.native)
    if (!types || !group) return
    const index = group.records.indexOf(record)
    if (index >= 0) group.records.splice(index, 1)
    if (!group.records.length) {
        target.removeEventListener?.(record.native, group.listener)
        types.delete(record.native)
    }
    if (!types.size) registrations.delete(target)
}

function remove(target: SelectionValue, names?: EventNames, selector?: string | null, handler?: Listener) {
    const types = registrations.get(target)
    if (!types) return
    const requested = names == null ? [{ type: '', namespaces: [] }] : splitWords(names).map(parseType)
    for (const { records } of [...types.values()]) {
        for (const record of [...records]) {
            if (selector != null && selector !== record.selector && !(selector === '**' && record.selector)) continue
            if (handler && handler !== record.handler && (handler.guid === undefined || handler.guid !== record.handler.guid)) continue
            if (requested.some(({ type, namespaces }) => (!type || type === record.type) && includesNamespace(record.namespaces, namespaces))) {
                removeRecord(target, record)
            }
        }
    }
}

export function hasEvents(target: object) { return registrations.has(target) }
export function clearEvents(target: object) { remove(target) }
export function copyEvents(source: object, target: object) {
    for (const { records } of registrations.get(source)?.values() ?? []) {
        for (const record of records) {
            const name = [record.type, ...record.namespaces].join('.')
            add(target, name, record.selector, record.data, record.handler, record.once)
        }
    }
}

function bind(collection: RuntimeCollection, once: boolean, names: EventNames | EventMap,
    selector?: SelectionValue, data?: unknown, callback?: unknown) {
    if (names && typeof names === 'object' && !Array.isArray(names)) {
        if (typeof selector !== 'string' && data === undefined) data = selector
        for (const [name, handler] of Object.entries(names)) bind(collection, once, name, typeof selector === 'string' ? selector : undefined, data, handler)
        return collection
    }
    if (callback == null) {
        if (data == null) {
            callback = selector
            selector = data = undefined
        } else if (typeof selector === 'string') {
            callback = data
            data = undefined
        } else {
            callback = data
            data = selector
            selector = undefined
        }
    }
    if (callback === false) callback = returnFalse
    if (typeof callback !== 'function') return collection
    const handler = callback as Listener
    return collection.each(function () { add(this, names, selector, data, handler, once) })
}

function eventPath(target: SelectionValue): SelectionValue[] {
    const path = [target]
    for (let node = target.parentNode; node; node = node.parentNode) path.push(node)
    const last = path.at(-1)
    if (last?.nodeType === 9 && last.defaultView) path.push(last.defaultView)
    return path
}

function trigger(target: SelectionValue, source: EventSource, extra: unknown, onlyHandlers: boolean) {
    if (target == null) return undefined
    const event = source instanceof DomEvent ? source : new DomEvent(source)
    event.target = target
    event.result = undefined
    const args = extra == null ? [] : Array.isArray(extra) ? extra : [extra]
    if (onlyHandlers || event.namespace || !target.dispatchEvent) {
        const path = onlyHandlers ? [target] : eventPath(target)
        for (const current of path) {
            const groups = registrations.get(current)
            const records = [...(groups?.values() ?? [])].flatMap(group => group.records)
            dispatch(current, records, event, args, splitNamespace(event.namespace), event.type)
            if (event.isPropagationStopped()) break
        }
        return event.result
    }
    if (typeof source === 'string' && (event.type === 'focus' || event.type === 'blur') && !args.length && !isWindow(target) && target[event.type]) {
        target[event.type]()
        return event.result
    }
    const win = (isWindow(target) ? target : target.ownerDocument?.defaultView ?? target.defaultView) ?? globalThis
    const Constructor = event.type === 'click' ? win.MouseEvent ?? win.Event : win.CustomEvent ?? win.Event
    const original = new Constructor(nativeType(event.type), { bubbles: true, cancelable: true, detail: extra })
    event.triggerType = event.type
    event.extra = args
    event.originalEvent ??= original
    wrappers.set(original, event)
    target.dispatchEvent(original)
    return event.result
}

export const eventMethods = {
    on(names: EventNames | EventMap, selector?: SelectionValue, data?: unknown, callback?: unknown) { return bind(this, false, names, selector, data, callback) },
    one(names: EventNames | EventMap, selector?: SelectionValue, data?: unknown, callback?: unknown) { return bind(this, true, names, selector, data, callback) },
    off(names?: EventNames | DomEvent | EventMap, selector?: SelectionValue, callback?: Handler<SelectionValue>) {
        if (names instanceof DomEvent && names.handleObj) {
            removeRecord(names.delegateTarget, names.handleObj)
            return this
        }
        if (names && typeof names === 'object' && !Array.isArray(names)) {
            for (const [name, handler] of Object.entries(names)) this.off(name, selector, handler)
            return this
        }
        if (typeof selector === 'function' || selector === false) [callback, selector] = [selector, undefined]
        if (callback === false) callback = returnFalse
        return this.each(function () { remove(this, names as EventNames, selector, callback as Listener | undefined) })
    },
    trigger(source: EventSource, data?: unknown) { return this.each(function () { trigger(this, source, data, false) }) },
    triggerHandler(source: EventSource, data?: unknown) { return trigger(this[0], source, data, true) },
    bind(names: string | string[], data: unknown, callback: Handler<SelectionValue>) { return this.on(names, undefined!, data, callback) },
    unbind(names?: string | string[], callback?: Handler<SelectionValue>) { return this.off(names, undefined, callback) },
    delegate(selector: string, names: string, data: unknown, callback: Handler<SelectionValue>) { return this.on(names, selector, data, callback) },
    undelegate(selector: string, names?: string, callback?: Handler<SelectionValue>) { return arguments.length === 1 ? this.off(selector, '**') : this.off(names, selector || '**', callback) },
    hover(enter: Handler<SelectionValue>, leave = enter) { return this.on('mouseenter', enter).on('mouseleave', leave) },
} satisfies ThisType<RuntimeCollection>

const shortcuts: Record<string, unknown> = eventMethods
for (const name of ('blur change click dblclick focus focusin focusout input keydown keypress keyup mousedown mouseenter ' +
    'mouseleave mousemove mouseout mouseover mouseup resize scroll select submit').split(' ')) {
    shortcuts[name] = function (this: RuntimeCollection, data?: unknown, callback?: SelectionValue) {
        return arguments.length ? this.on(name, undefined!, data, callback) : this.trigger(name)
    }
}
