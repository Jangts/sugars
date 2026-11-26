/**
 * `@sugars/swiper` 的公开入口。
 *
 * 轮播实例管理逻辑索引、计时和输入事件，布局及切换交给预设，并在销毁时恢复已有节点。
 * `Swiper` 管理播放状态和输入，布局与过渡由 `Swiper.presets` 中的预设承接。
 */

import { ViewModel } from '@sugars/simple-mvvm/view-model'
import type { ViewModelState } from '@sugars/simple-mvvm/view-model'
import { presets } from './presets.js'
import type { PresetName } from './presets.js'

export type { PresetName } from './presets.js'

export interface SwiperOptions {
    /** 用于选择已登记布局的名称，未知名称回退到 slide。 */
    preset?: PresetName | string
    /** 供自定义布局和回调读取的调用方数据。 */
    data?: unknown
    /** 正向播放时的起始逻辑索引，默认 0。反向播放从最后一项开始。 */
    curr?: number
    /** 自动切换间隔，单位为毫秒，默认 5000。 */
    speed?: number
    /** 单次切换及 after 回调的等待时长，单位为毫秒，默认 600。 */
    duration?: number
    /** CSS easing 或能够映射到 CSS 的旧缓动名，默认 linear。 */
    easing?: string
    /** 布局的视觉移动方向，按预设坐标轴缺省为 left 或 top。 */
    direction?: 'left' | 'right' | 'top' | 'bottom'
    /** 自动播放是否往更大的逻辑索引推进。 */
    positive?: boolean
    /** 是否自动安排下一次切换，默认开启。 */
    autoplay?: boolean
    /** 是否在末端回绕，默认开启。 */
    loop?: boolean
    /** 指针停留时是否暂停自动播放，默认开启。 */
    pauseOnHover?: boolean
    /** 锚点切换后是否暂停自动播放。 */
    pauseOnAction?: boolean
    /** 启用键盘方向键控制。 */
    kbCtrlAble?: boolean
    /** 启用指针拖动切换，默认开启。 */
    touch?: boolean
    /** 触发锚点切换的行为。 */
    switchActionType?: 'click' | 'hover'
    /** 加到 stage 节点的 CSS 类名。 */
    stageTheme?: string | readonly string[]
    /** 加到 panel 节点的 CSS 类名，缺省沿用 stageTheme。 */
    panelTheme?: string | readonly string[]
    /** 由实例为现有锚点分配逻辑索引。 */
    renderPanel?: boolean
    /** 调用方已插入无缝播放的边界副本，由预设计数而无需再次复制。 */
    preparedActors?: boolean
    /** 布局和事件就绪后、首次切换前调用，接收初始索引。 */
    start?(this: Swiper, index: number): void
    /** 执行 cut 前同步调用，接收目标索引。 */
    before?(this: Swiper, index: number): void
    /** 等待配置的切换时长后调用，接收目标索引。 */
    after?(this: Swiper, index: number): void
    /** 反馈自动播放间隔的进度，单位为百分比。 */
    onprogress?(this: Swiper, percent: number): void
}

/** 定义轨道布局及一次切换。切换可同时取得归一化后的目标、上个索引和未经归一化的请求位置。 */
export interface SwiperPreset extends SwiperOptions {
    name?: string
    axis?: 'horizontal' | 'vertical'
    /** 无缝预设使用的边界副本总数。 */
    clones?: number
    counter?(this: Swiper, count: number): number
    /** 旧拼写的结构准备钩子，在读取 troupe 元素前调用。 */
    bluider?(this: Swiper): void
    /** 根据预设组织轨道和原始项的样式。 */
    layout(this: Swiper): void
    /**
     * 用原始请求值判断是否跨越首尾边界。
     * @param target - 已归一化的目标逻辑索引。
     * @param from - 前一项的逻辑索引。
     * @param requested - 尚未归一化的请求索引。
     */
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

    /**
     * @param element - 含 .troupe 和 .actor 的容器或元素 ID。
     * @param preset - 预设名、包含预设字段的选项或自定义布局。
     * @param options - 覆盖预设与前一参数的配置。
     * @throws {TypeError} 缺少容器或 .troupe。
     */
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
        // 逻辑索引排除边界副本。副本只为视觉切换服务，锚点和回调继续使用原始图片的编号。
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

    /** 索引始终指向原始项，首尾用于衔接的副本由预设管理。 */
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

    /**
     * 切换到指定项并重新安排自动播放，由预设执行具体的空间或透明度变化。
     *
     * @param index - 目标逻辑索引，无缝预设可接收越出首尾的请求。
     * @returns 完成本次切换调度的实例。
     */
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

    /** 自动播放由一个定时器推进，手动切换会重新计算下一次触发时间。 */
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

    /**
     * @param pause - true 暂停自动播放，false 重新启动调度。
     * @returns 当前实例。
     */
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

    /** 解除计时和监听，移除内部副本并还原原始节点的类名与样式。 */
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
