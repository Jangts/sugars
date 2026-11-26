import { readAxis } from './axis.js'
import type { Axis } from './axis.js'
import { ScrollbarBinding } from './scrollbar.js'
import type { ScrollbarElements } from './scrollbar.js'

export { getScrollMetrics, scrollOffsetFromThumb } from './geometry.js'
export type { ScrollGeometry, ScrollMetrics } from './geometry.js'
export type { ScrollbarElements } from './scrollbar.js'

export interface ScrollViewOptions {
    vertical?: ScrollbarElements
    horizontal?: ScrollbarElements
    /** Observe changes in a caller-owned content wrapper as well as the viewport. */
    content?: Element
}

export class ScrollView {
    private readonly view: Window & typeof globalThis
    private readonly events: AbortController
    private readonly bars: ScrollbarBinding[] = []
    private readonly resizeObserver: ResizeObserver | undefined
    private frame: number | undefined

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

    refresh(): this {
        if (!this.events.signal.aborted) for (const bar of this.bars) bar.sync()
        return this
    }

    toTop(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('vertical', false, behavior)
    }

    toBottom(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('vertical', true, behavior)
    }

    toLeft(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('horizontal', false, behavior)
    }

    toRight(behavior: ScrollBehavior = 'auto'): this {
        return this.toEdge('horizontal', true, behavior)
    }

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

    private scheduleRefresh = (): void => {
        if (this.events.signal.aborted || this.frame !== undefined) return
        this.frame = this.view.requestAnimationFrame(() => {
            this.frame = undefined
            this.refresh()
        })
    }
}
