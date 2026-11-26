/**
 * `@sugars/scroll-view` 的公开入口。
 *
 * 将调用方提供的轨道和滑块接到原生滚动视口，管理滚动、尺寸监听和销毁。
 * `ScrollView` 负责 DOM 绑定。`getScrollMetrics` 和 `scrollOffsetFromThumb` 可独立处理纯数值换算。
 */

import { readAxis } from './axis.js'
import type { Axis } from './axis.js'
import { ScrollbarBinding } from './scrollbar.js'
import type { ScrollbarElements } from './scrollbar.js'

export { getScrollMetrics, scrollOffsetFromThumb } from './geometry.js'
export type { ScrollGeometry, ScrollMetrics } from './geometry.js'
export type { ScrollbarElements } from './scrollbar.js'

export interface ScrollViewOptions {
    /** 纵向轨道和滑块，可独立于横向配置传入。 */
    vertical?: ScrollbarElements
    /** 横向轨道和滑块，请使用独立的 DOM 元素。 */
    horizontal?: ScrollbarElements
    /** 同时监听视口和调用方提供的内容容器的尺寸。 */
    content?: Element
}

/** 原生视口持有位置，外部滑块只反映该位置。拖动按相反方向将滑块位置换算给视口。 */
export class ScrollView {
    private readonly view: Window & typeof globalThis
    private readonly events: AbortController
    private readonly bars: ScrollbarBinding[] = []
    private readonly resizeObserver: ResizeObserver | undefined
    private frame: number | undefined

    /**
     * @param viewport - 持有原生滚动状态的元素。
     * @param options - 要接管的轨道、滑块和可选内容容器。
     * @throws {TypeError} 视口没有窗口、节点来自其他文档或元素被重复使用。
     * @throws {RangeError} 最小滑块长度为负数或非有限值。
     */
    constructor(readonly viewport: HTMLElement, options: ScrollViewOptions = {}) {
        const view = viewport.ownerDocument.defaultView
        if (!view) throw new TypeError('ScrollView requires a viewport in a document with a window')
        this.view = view
        this.events = new view.AbortController()
        const { signal } = this.events
        const bindings = [ ['vertical', options.vertical], ['horizontal', options.horizontal] ] as const
        const used = new Set<Element>()
        for (const [, elements] of bindings) {
            if (!elements) continue
            for (const node of [elements.track, elements.thumb]) {
                if (node.ownerDocument !== viewport.ownerDocument || used.has(node) || node === viewport) {
                    throw new TypeError('Each scrollbar track and thumb must have its own element in the viewport document')
                }
                used.add(node)
            }
            if (elements.minThumbSize !== undefined && (!Number.isFinite(elements.minThumbSize) || elements.minThumbSize < 0)) {
                throw new RangeError('minThumbSize must be non-negative and finite')
            }
        }
        if (options.content && options.content.ownerDocument !== viewport.ownerDocument) {
            throw new TypeError('ScrollView content must be in the viewport document')
        }
        for (const [axis, elements] of bindings) {
            if (elements) this.bars.push(new ScrollbarBinding(viewport, axis, elements, signal))
        }

        viewport.addEventListener('scroll', this.scheduleRefresh, { signal, passive: true })
        if (view.ResizeObserver) {
            this.resizeObserver = new view.ResizeObserver(this.scheduleRefresh)
            this.resizeObserver.observe(viewport)
            if (options.content) this.resizeObserver.observe(options.content)
            for (const bar of this.bars) this.resizeObserver.observe(bar.track)
        } else {
            view.addEventListener('resize', this.scheduleRefresh, { signal })
        }
        this.refresh()
    }

    /**
     * 同步读取当前滚动范围并更新滑块。内容变化后可显式调用。
     *
     * @returns 当前绑定。
     */
    refresh(): this {
        if (!this.events.signal.aborted) for (const bar of this.bars) bar.sync()
        return this
    }

    /**
     * @param behavior - 传给原生滚动的行为，默认为 auto。
     * @returns 滚向纵轴起点的当前绑定。
     */
    toTop(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('vertical', false, behavior)
    }

    /**
     * @param behavior - 传给原生滚动的行为，默认为 auto。
     * @returns 滚向纵轴末端的当前绑定。
     */
    toBottom(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('vertical', true, behavior)
    }

    /**
     * @param behavior - 传给原生滚动的行为，默认为 auto。
     * @returns 滚向视觉左端的当前绑定，适用 RTL。
     */
    toLeft(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('horizontal', false, behavior)
    }

    /**
     * @param behavior - 传给原生滚动的行为，默认为 auto。
     * @returns 滚向视觉右端的当前绑定，适用 RTL。
     */
    toRight(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('horizontal', true, behavior)
    }

    /** 解绑并恢复由实例修改的轨道属性与滑块样式，调用方继续拥有全部元素。 */
    destroy(): void {
        if (this.events.signal.aborted) return
        this.events.abort()
        this.resizeObserver?.disconnect()
        if (this.frame !== undefined) this.view.cancelAnimationFrame(this.frame)
        this.frame = undefined
        for (const bar of this.bars) bar.destroy()
    }

    private toEdge(axis: Axis, end: boolean, behavior: ScrollBehavior): this {
        if (!this.events.signal.aborted) {
            const scroll = readAxis(this.viewport, axis)
            scroll.scrollTo(end ? scroll.range : 0, behavior)
        }
        return this
    }

    /** 合并原生 scroll 与 ResizeObserver 的通知，每帧至多刷新一次。 */
    private scheduleRefresh = (): void => {
        if (this.events.signal.aborted || this.frame !== undefined) return
        this.frame = this.view.requestAnimationFrame(() => {
            this.frame = undefined
            this.refresh()
        })
    }
}
