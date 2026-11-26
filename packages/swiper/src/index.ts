import { ViewModel } from '@sugars/simple-mvvm/view-model'
import type { ViewModelState } from '@sugars/simple-mvvm/view-model'
import { presets } from './presets.js'
import type { PresetName } from './presets.js'

export type { PresetName } from './presets.js'

export interface SwiperOptions {
    preset?: PresetName | string
    data?: unknown
    curr?: number
    speed?: number
    duration?: number
    easing?: string
    direction?: 'left' | 'right' | 'top' | 'bottom'
    positive?: boolean
    autoplay?: boolean
    loop?: boolean
    pauseOnHover?: boolean
    pauseOnAction?: boolean
    kbCtrlAble?: boolean
    touch?: boolean
    switchActionType?: 'click' | 'hover'
    stageTheme?: string | readonly string[]
    panelTheme?: string | readonly string[]
    renderPanel?: boolean
    preparedActors?: boolean
    start?(this: Swiper, index: number): void
    before?(this: Swiper, index: number): void
    after?(this: Swiper, index: number): void
    onprogress?(this: Swiper, percent: number): void
}

export interface SwiperPreset extends SwiperOptions {
    name?: string
    axis?: 'horizontal' | 'vertical'
    clones?: number
    counter?(this: Swiper, count: number): number
    bluider?(this: Swiper): void
    layout(this: Swiper): void
    cut(this: Swiper, target: number, from: number, requested: number): void
}

type Snapshot = { node: HTMLElement; style: string | null; classes: string | null; actorIndex: string | null }
const legacyEasing: Readonly<Record<string, string>> = {
    easeInOutQuart: 'cubic-bezier(.77,0,.175,1)',
    easeInOutBack: 'cubic-bezier(.68,-.55,.265,1.55)',
}
let instanceId = 0

// TangramJS src/see/Slider/Slider.js, shared playback and input handling.
export class Swiper {
    static presets: Record<string, SwiperPreset> = Object.assign(Object.create(null), presets)

    static extend(...extensions: (string | Partial<SwiperPreset>)[]): void {
        const base = Object.assign({}, ...extensions.flatMap(extension => typeof extension === 'string' && this.presets[extension]
            ? [this.presets[extension]] : []))
        for (const extension of extensions) {
            if (typeof extension === 'string' || !extension.name) continue
            const merged: Partial<SwiperPreset> = { ...base, ...extension }
            if (!merged.layout || !merged.cut) throw new TypeError('A Swiper preset needs layout and cut')
            this.presets[extension.name] = merged as SwiperPreset
        }
    }

    readonly uid = 'slider-' + instanceId++
    readonly Element: HTMLElement
    readonly stages: HTMLElement[]
    readonly troupe: HTMLElement
    readonly actors: HTMLElement[]
    readonly panel: HTMLElement[]
    readonly anchors: HTMLElement[]
    readonly actorsNum: number
    readonly data: unknown
    readonly options: Readonly<SwiperOptions>
    readonly duration: number
    readonly speed: number
    readonly easing: string
    readonly direction: NonNullable<SwiperOptions['direction']>
    readonly positive: boolean
    readonly loop: boolean
    autoplay: boolean
    #preset: SwiperPreset
    #view: ViewModelState<{ curr: number }>
    #events = new AbortController()
    #timer?: number
    #after?: number
    #hover = false
    #touch?: { x: number; y: number }
    #clones: HTMLElement[] = []
    #snapshots: Snapshot[] = []

    constructor(element: HTMLElement | string, preset?: string | SwiperOptions | SwiperPreset, options: SwiperOptions = {}) {
        const root = typeof element === 'string' ? document.getElementById(element) : element
        if (!root) throw new TypeError('Swiper needs a root element')
        this.Element = root
        const descriptor = typeof preset === 'object' ? { ...preset, ...options } : options
        const name = typeof preset === 'string' ? preset : descriptor.preset ?? (preset && 'name' in preset ? preset.name : undefined) ?? 'slide'
        const registered = Swiper.presets[name] ?? presets.slide
        this.#preset = typeof preset === 'object' && 'layout' in preset ? preset : registered
        const settings = this.options = { ...this.#preset, ...descriptor }
        this.data = settings.data
        this.duration = Math.max(0, settings.duration ?? 600)
        this.speed = Math.max(1, settings.speed ?? 5000)
        const easing = settings.easing ?? 'linear'
        this.easing = Object.hasOwn(legacyEasing, easing) ? legacyEasing[easing]! : easing
        this.direction = settings.direction ?? (this.#preset.axis === 'vertical' ? 'top' : 'left')
        this.positive = settings.positive ?? true
        this.loop = settings.loop ?? true
        this.autoplay = settings.autoplay ?? true

        this.#preset.bluider?.call(this)
        const troupe = root.querySelector<HTMLElement>('.troupe')
        if (!troupe) throw new TypeError('Swiper needs a .troupe containing its .actor elements')
        this.troupe = troupe
        this.stages = Array.from(root.querySelectorAll<HTMLElement>('.stage'))
        this.panel = Array.from(root.querySelectorAll<HTMLElement>('.panel'))
        this.anchors = Array.from(root.querySelectorAll<HTMLElement>('.slider-anchor'))
        const original = Array.from(troupe.querySelectorAll<HTMLElement>('.actor'))
        this.#remember([root, troupe, ...this.stages, ...this.panel, ...this.anchors, ...original])
        root.classList.add('tangram-slider')
        if (name && !/\s/.test(name)) root.classList.add(name)
        this.#applyTheme(this.stages, settings.stageTheme)
        this.#applyTheme(this.panel, settings.panelTheme ?? settings.stageTheme)
        const clones = this.#preset.clones ?? 0
        const count = settings.preparedActors ? original.length - clones : original.length
        this.actorsNum = Math.max(0, this.#preset.counter?.call(this, original.length) ?? count)
        this.actors = clones && !settings.preparedActors && original.length
            ? this.#prepare(original, clones)
            : original
        const offset = clones ? 1 : 0
        this.actors.forEach((actor, index) => { actor.dataset.actorIndex = String(this.#normalize(index - offset)) })
        if (settings.renderPanel) this.anchors.forEach((anchor, index) => { anchor.dataset.actorIndex = String(index % Math.max(1, this.actorsNum)) })

        const initial = this.#normalize(this.positive ? settings.curr ?? 0 : this.actorsNum - 1)
        const render = (index: number) => this.anchorStatus(index)
        this.#view = new ViewModel({ data: { curr: initial }, render() { render(this.data.curr) } })
        try {
            this.#preset.layout.call(this)
            this.#bind()
            settings.start?.call(this, initial)
            if (this.actorsNum) this.play(initial)
        } catch (error) {
            this.destroy()
            throw error
        }
    }

    #remember(elements: HTMLElement[]): void {
        this.#snapshots = [...new Set(elements)].map(node => ({
            node, style: node.getAttribute('style'), classes: node.getAttribute('class'),
            actorIndex: node.getAttribute('data-actor-index'),
        }))
    }

    #applyTheme(elements: HTMLElement[], theme?: string | readonly string[]): void {
        elements.forEach((element, i) => {
            const value = typeof theme === 'string' ? theme : theme?.[i]
            if (value?.trim()) element.classList.add(...value.trim().split(/\s+/))
        })
    }

    #prepare(actors: HTMLElement[], count: number): HTMLElement[] {
        const duplicate = (actor: HTMLElement) => {
            const clone = actor.cloneNode(true) as HTMLElement
            clone.removeAttribute('id')
            for (const child of clone.querySelectorAll('[id]')) child.removeAttribute('id')
            clone.setAttribute('aria-hidden', 'true')
            clone.inert = true
            this.#clones.push(clone)
            return clone
        }
        const first = duplicate(actors.at(-1)!)
        const tail = [duplicate(actors[0]!)]
        if (count === 3) tail.push(duplicate(actors[1] ?? actors[0]!))
        actors[0]!.before(first)
        actors.at(-1)!.after(...tail)
        return [first, ...actors, ...tail]
    }

    #normalize(index: number): number {
        return this.actorsNum && Number.isFinite(index)
            ? (Math.trunc(index) % this.actorsNum + this.actorsNum) % this.actorsNum : 0
    }

    get curr(): number { return this.#view?.curr ?? 0 }
    set curr(index: number) { this.#view.curr = this.#normalize(index) }

    anchorStatus(current = this.curr): void {
        this.anchors.forEach((anchor, i) => {
            const index = anchor.dataset.actorIndex === undefined ? i : Number(anchor.dataset.actorIndex)
            anchor.classList.toggle('active', index === current)
        })
    }

    play(index = this.curr): this {
        if (!this.actorsNum || !Number.isFinite(index) || this.#events.signal.aborted) return this
        this.stop()
        const target = this.loop ? this.#normalize(index) : Math.max(0, Math.min(this.actorsNum - 1, Math.trunc(index)))
        const win = this.Element.ownerDocument.defaultView!
        win.clearTimeout(this.#after)
        this.options.before?.call(this, target)
        if (this.#events.signal.aborted) return this
        this.#preset.cut.call(this, target, this.curr, index)
        if (this.#events.signal.aborted) return this
        this.curr = target
        this.#after = this.options.after ? win.setTimeout(() => this.options.after?.call(this, target), this.duration) : undefined
        this.#schedule()
        return this
    }

    playNx(): this {
        if (!this.loop && this.curr >= this.actorsNum - 1) return this.stop()
        return this.play(this.curr + 1)
    }

    playPr(): this {
        if (!this.loop && this.curr <= 0) return this.stop()
        return this.play(this.curr - 1)
    }

    #schedule(): void {
        if (!this.autoplay || this.#hover || this.actorsNum < 2 || this.#events.signal.aborted) return
        const win = this.Element.ownerDocument.defaultView!
        const advance = () => this.positive ? this.playNx() : this.playPr()
        const onprogress = this.options.onprogress
        if (!onprogress) {
            this.#timer = win.setTimeout(advance, this.speed)
            return
        }
        let progress = 0
        onprogress.call(this, progress)
        if (!this.autoplay || this.#events.signal.aborted) return
        this.#timer = win.setInterval(() => {
            onprogress.call(this, ++progress)
            if (progress === 100) advance()
        }, this.speed / 100)
    }

    stop(): this {
        this.Element.ownerDocument.defaultView?.clearTimeout(this.#timer)
        this.#timer = undefined
        return this
    }

    pause(pause = true): this {
        this.stop()
        this.autoplay = !pause
        this.#schedule()
        return this
    }

    #bind(): void {
        const root = this.Element
        const signal = this.#events.signal
        const action = (navigate: () => void) => {
            if (this.options.pauseOnAction) this.pause()
            navigate()
        }
        root.addEventListener(this.options.switchActionType === 'hover' ? 'mouseover' : 'click', event => {
            const target = (event.target as Element | null)?.closest?.('.cutter.goto-prev, .cutter.goto-next, .slider-anchor')
            if (!target || !root.contains(target)) return
            if (target.matches('.goto-prev')) action(() => this.playPr())
            else if (target.matches('.goto-next')) action(() => this.playNx())
            else action(() => this.play(Number((target as HTMLElement).dataset.actorIndex ?? this.anchors.indexOf(target as HTMLElement))))
        }, { signal })
        if (this.options.touch ?? true) {
            root.addEventListener('touchstart', event => {
                const point = event.changedTouches[0]
                if (point && (event.target as Element | null)?.closest?.('.stage')) this.#touch = { x: point.clientX, y: point.clientY }
            }, { signal, passive: true })
            root.addEventListener('touchend', event => {
                const origin = this.#touch
                this.#touch = undefined
                const point = event.changedTouches[0]
                if (!origin || !point) return
                const dx = point.clientX - origin.x
                const dy = point.clientY - origin.y
                const delta = this.direction === 'top' ? dy : this.direction === 'bottom' ? -dy : this.direction === 'right' ? -dx : dx
                if (delta) action(() => delta > 0 ? this.playPr() : this.playNx())
            }, { signal, passive: true })
            root.addEventListener('touchcancel', () => { this.#touch = undefined }, { signal })
        }
        if (this.options.pauseOnHover ?? true) {
            root.addEventListener('mouseenter', () => { this.#hover = true; this.stop() }, { signal })
            root.addEventListener('mouseleave', () => { this.#hover = false; this.#schedule() }, { signal })
        }
        if (this.options.kbCtrlAble) root.ownerDocument.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') action(() => this.playPr())
            if (event.key === 'ArrowRight') action(() => this.playNx())
        }, { signal })
    }

    destroy(): void {
        if (this.#events.signal.aborted) return
        this.#events.abort()
        this.stop()
        this.Element.ownerDocument.defaultView?.clearTimeout(this.#after)
        this.#view.destroy()
        for (const clone of this.#clones) clone.remove()
        for (const { node, style, classes, actorIndex } of this.#snapshots) {
            for (const [attribute, value] of [['style', style], ['class', classes], ['data-actor-index', actorIndex]] as const) {
                if (value === null) node.removeAttribute(attribute)
                else node.setAttribute(attribute, value)
            }
        }
    }
}

export { Swiper as Slider }
