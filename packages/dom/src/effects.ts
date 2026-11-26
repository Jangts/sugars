import type { RuntimeCollection, SelectionValue } from './runtime-types.js'
import type { AnimationOptions, TweenState, Complete, Easing, Speed } from './index.js'
import type { ScrollKey } from './style.js'
import { camelCase } from './data.js'
import { isElement, isWindow, pseudos } from './selection.js'
import { cssNumber, readScroll, readStyle, writeScroll, writeStyle } from './style.js'

// TangramJS src/dom/Elements.js, queued animation and visibility effects.
type Options = AnimationOptions<SelectionValue>
type TweenValues = TweenState<SelectionValue>
type Done = Complete<SelectionValue>
type Duration = Speed | Done | Options
type Curve = string | Done
type Properties = Record<string, string | number | undefined>
type Job = (next: () => void) => void
type Finish = (complete: boolean, applyFinal?: boolean) => void
type ScheduleState = { waiting: Job[]; running: Set<Finish>; active: boolean }
type TweenHook = { get?(tween: TweenValues): number; set?(tween: TweenValues): void }

const schedules = new WeakMap<object, ScheduleState>()
const displays = new WeakMap<HTMLElement, string>()
const scrollKeys = new Set<string>(['scrollTop', 'scrollLeft'])
const numeric = /^([+-]=)?([+-]?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/i
export const easing: Record<string, Easing> = Object.assign(Object.create(null), {
    linear: (progress: number) => progress,
    swing: (progress: number) => 0.5 - Math.cos(progress * Math.PI) / 2,
    easeInOutQuart: (progress: number) => progress < .5 ? 8 * progress ** 4 : 1 - 8 * (1 - progress) ** 4,
    easeInOutBack: (progress: number) => {
        const overshoot = 1.70158 * 1.525
        const time = progress * 2
        return time < 1 ? time ** 2 * ((overshoot + 1) * time - overshoot) / 2
            : ((time - 2) ** 2 * ((overshoot + 1) * (time - 2) + overshoot) + 2) / 2
    },
})
export const fx: { off: boolean; speeds: Record<string, number>; step: Record<string, (tween: TweenValues) => void> } = {
    off: false, speeds: { slow: 600, fast: 200, _default: 400 }, step: Object.create(null),
}
export const Tween: { propHooks: Record<string, TweenHook> } = { propHooks: Object.create(null) }

function pending(element: object) {
    let state = schedules.get(element)
    if (!state) schedules.set(element, state = { waiting: [], running: new Set(), active: false })
    return state
}

function dequeue(element: object, state: ScheduleState) {
    if (state.active) return
    const job = state.waiting.shift()
    if (!job) return
    state.active = true
    let ended = false
    const next = () => {
        if (ended) return
        ended = true
        state.active = false
        dequeue(element, state)
    }
    try {
        job(next)
    } catch (error) {
        try { next() } finally { throw error }
    }
}

function settings(duration?: Duration, easing?: Curve, complete?: Done): Options {
    if (duration && typeof duration === 'object') return { ...duration }
    if (typeof duration === 'function') return { complete: duration }
    if (typeof easing === 'function') [complete, easing] = [easing, undefined]
    return { duration, easing, complete }
}

function show(element: SelectionValue) {
    if (!isElement(element)) return
    if (element.style.display === 'none') element.style.display = displays.get(element) ?? ''
    if (readStyle(element, 'display') !== 'none') return
    const probe = element.ownerDocument.createElement(element.localName)
    const root = element.ownerDocument.body ?? element.ownerDocument.documentElement
    root.append(probe)
    const display = readStyle(probe, 'display')
    probe.remove()
    element.style.display = display === 'none' || !display ? 'block' : display
}

function hide(element: SelectionValue) {
    if (!isElement(element) || element.style.display === 'none') return
    displays.set(element, element.style.display)
    element.style.display = 'none'
}

function animatedValue(element: SelectionValue, key: string, target: string | number | undefined, options: Options) {
    const scrolling = scrollKeys.has(key)
    const hook = Tween.propHooks[key]
    if (!scrolling && !hook && !element.style) return undefined
    const change = scrolling ? (value: string | number | undefined) => writeScroll(element, key as ScrollKey, Number(value))
        : (value: string | number | undefined) => writeStyle(element, key, value)
    const format = typeof target === 'number' ? String(target) : target
    const match = typeof format === 'string' ? numeric.exec(format) : undefined
    if (!match) return { apply: (progress: number) => { if (progress === 1) change(target) } }
    const [, relative, number, suffix] = match
    // The get hook runs before the starting value and unit are known.
    const tween = { elem: element, prop: key, options, now: 0 } as TweenValues
    const computedValue = hook?.get ? hook.get(tween) : scrolling ? readScroll(element, key as ScrollKey) : readStyle(element, key)
    const unit = suffix || (scrolling || cssNumber[camelCase(key)] || key.startsWith('--') ? '' : 'px')
    let from = Number.parseFloat(computedValue as string) || 0
    if (!scrolling && element.style && readUnit(computedValue, unit) !== unit && from) {
        const inline = element.style[camelCase(key)]
        const inlineNumber = Number.parseFloat(inline)
        if (readUnit(inline, unit) === unit && Number.isFinite(inlineNumber)) from = inlineNumber
        else if (suffix) {
            change(100 + unit)
            const reference = Number.parseFloat(readStyle(element, key)!)
            element.style[camelCase(key)] = inline
            if (reference) from = from / reference * 100
        }
    }
    const to = relative ? from + (relative === '+=' ? 1 : -1) * Number(number) : Number(number)
    Object.assign(tween, { start: from, end: to, unit })
    return { apply(progress: number) {
        tween.pos = progress
        tween.now = from + (to - from) * progress
        options.step?.call(element, tween.now, tween)
        if (hook?.set) hook.set(tween)
        else if (fx.step[key]) fx.step[key]!(tween)
        else change(tween.now + unit)
    } }
}

function readUnit(value: string | number | undefined, fallback: string) { return String(value ?? '').match(/[a-z%]+$/i)?.[0] ?? fallback }

function schedule(element: SelectionValue, properties: Properties, options: Options,
    prepare?: (element: SelectionValue) => boolean | void,
    finalize?: (element: SelectionValue, complete: boolean) => void) {
    if (element == null || typeof element !== 'object') return
    const state = pending(element)
    const run: Job = next => {
        const instant = prepare?.(element) === false
        const speed = Object.hasOwn(fx.speeds, options.duration as string)
            ? fx.speeds[options.duration as string]! : fx.speeds._default!
        const duration = instant || fx.off ? 0 : Math.max(0, typeof options.duration === 'number' && Number.isFinite(options.duration)
            ? options.duration : speed)
        const win = (isWindow(element) ? element : element.ownerDocument?.defaultView ?? element.defaultView) ?? globalThis
        const curve = typeof options.easing === 'function' ? options.easing : easing[options.easing as string] ?? easing.swing!
        const tweens = Object.entries(properties).map(([key, value]) => animatedValue(element, key, value, options)).filter(tween => tween !== undefined)
        const clock = win.performance ?? performance
        const begin = clock.now()
        let frame: number | undefined
        const step = (time: number) => {
            try {
                const percent = duration ? Math.max(0, Math.min(1, (time - begin) / duration)) : 1
                const progress = percent === 1 ? 1 : curve(percent, duration * percent, 0, 1, duration)
                tweens.forEach(tween => tween.apply(progress))
                options.progress?.call(element, null, percent, Math.max(0, duration - (time - begin)))
                if (!state.running.has(finish)) return
                if (percent === 1) finish(true, false)
                else frame = win.requestAnimationFrame(step)
            } catch (error) {
                try { finish(false) } finally { throw error }
            }
        }
        const finish: Finish = (complete, applyFinal = true) => {
            if (!state.running.delete(finish)) return
            if (frame !== undefined) win.cancelAnimationFrame(frame)
            try {
                let finished = false
                try {
                    if (complete && applyFinal) tweens.forEach(tween => tween.apply(1))
                    finished = complete
                } finally {
                    finalize?.(element, finished)
                }
                if (complete) options.complete?.call(element)
            } finally {
                next()
            }
        }
        state.running.add(finish)
        step(begin)
    }
    if (options.queue === false) run(() => {})
    else {
        state.waiting.push(run)
        dequeue(element, state)
    }
}

const vertical = ['height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom']
const horizontal = ['width', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight']

function visibilityEffect(collection: RuntimeCollection, showElement: boolean | undefined, keys: string[],
    duration?: Duration, curve?: Curve, complete?: Done) {
    const options = settings(duration, curve, complete)
    return collection.each(function () {
        if (!isElement(this)) return
        const properties: Properties = {}
        let initial: [string, string][] | undefined
        let overflow: [string, string, string] | undefined
        let reveal: boolean
        const box = keys.length > 1
        const prepare = (element: SelectionValue) => {
            const hidden = readStyle(element, 'display') === 'none'
            reveal = showElement ?? hidden
            if (reveal !== hidden) return false
            if (reveal) show(element)
            initial = keys.map(key => [key, element.style[key]])
            if (box) {
                overflow = [element.style.overflow, element.style.overflowX, element.style.overflowY]
                element.style.overflow = 'hidden'
            }
            for (const key of keys) properties[key] = reveal ? readStyle(element, key) : 0
            if (reveal) for (const key of keys) writeStyle(element, key, 0)
        }
        const finalize = (element: SelectionValue, finished: boolean) => {
            if (overflow) [element.style.overflow, element.style.overflowX, element.style.overflowY] = overflow
            if (!finished || !initial) return
            if (!reveal) hide(element)
            for (const [key, value] of initial) element.style[key] = value
        }
        schedule(this, properties, options, prepare, finalize)
    })
}

pseudos.animated = element => Boolean(schedules.get(element)?.running.size)

export const effectMethods = {
    animate(properties: Properties, duration?: Duration, curve?: Curve, complete?: Done) {
        const options = settings(duration, curve, complete)
        return this.each(function () { schedule(this, properties, options) })
    },
    transition(style: string, value: string | number, duration?: Speed, curve?: string, callback?: Done) {
        return this.animate({ [style]: value }, duration!, curve, callback)
    },
    animator(options: Options & { to?: Properties; tween?: Easing; callback?: Done } = {}) {
        const { to = {}, duration, tween, easing, callback } = options
        return this.animate(to as Record<string, string | number>, { duration, easing: easing ?? tween, complete: callback })
    },
    stop(clearQueue = false, jumpToEnd = false) {
        return this.each(function () {
            const state = schedules.get(this)
            if (!state) return
            if (clearQueue) state.waiting.length = 0
            for (const finish of [...state.running]) finish(jumpToEnd)
        })
    },
    show(duration?: Duration | boolean, curve?: Curve, complete?: Done) {
        if (duration !== undefined && typeof duration !== 'boolean') return visibilityEffect(this, true, [...vertical, ...horizontal, 'opacity'], duration, curve, complete)
        return this.each(function () { show(this) })
    },
    hide(duration?: Duration | boolean, curve?: Curve, complete?: Done) {
        if (duration !== undefined && typeof duration !== 'boolean') return visibilityEffect(this, false, [...vertical, ...horizontal, 'opacity'], duration, curve, complete)
        return this.each(function () { hide(this) })
    },
    toggle(state?: Duration | boolean, curve?: Curve, complete?: Done) {
        if (state !== undefined && typeof state !== 'boolean') return visibilityEffect(this, undefined, [...vertical, ...horizontal, 'opacity'], state, curve, complete)
        return this.each(function () { (state ?? readStyle(this, 'display') === 'none' ? show : hide)(this) })
    },
    fadeIn(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, true, ['opacity'], duration, curve, complete) },
    fadeOut(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, false, ['opacity'], duration, curve, complete) },
    fadeToggle(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, undefined, ['opacity'], duration, curve, complete) },
    slideDown(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, true, vertical, duration, curve, complete) },
    slideUp(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, false, vertical, duration, curve, complete) },
    slideToggle(duration?: Duration, curve?: Curve, complete?: Done) { return visibilityEffect(this, undefined, vertical, duration, curve, complete) },
    fadeTo(duration: Duration, opacity: number, curve?: Curve, complete?: Done) {
        return this.each(function () {
            schedule(this, { opacity }, settings(duration, curve, complete), element => {
                if (readStyle(element, 'display') === 'none') {
                    show(element)
                    writeStyle(element, 'opacity', 0)
                }
            })
        })
    },
} satisfies ThisType<RuntimeCollection>
