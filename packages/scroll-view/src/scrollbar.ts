/* 同步单轴视口与外部轨道，处理滑块拖动和轨道点击，并恢复绑定前的 DOM 属性。 */

import { pointerOffset, readAxis, trackSize } from './axis.js'
import type { Axis } from './axis.js'
import { getScrollMetrics, scrollOffsetFromThumb } from './geometry.js'

export interface ScrollbarElements {
    /** 调用方提供的轨道。滑块可为子节点或独立定位的兄弟节点。 */
    track: HTMLElement
    /** 调用方提供的滑块，实例以 CSS 自定义属性同步尺寸和偏移。 */
    thumb: HTMLElement
    /** 轴向最小长度，使用 CSS 像素。 */
    minThumbSize?: number
}

interface Drag {
    id: number
    origin: number
    thumbOffset: number
}

const sizeProperty = '--scrollview-thumb-size'
const offsetProperty = '--scrollview-thumb-offset'
const overflowAttribute = 'data-scrollview-overflow'

export class ScrollbarBinding {
    readonly track: HTMLElement
    private readonly thumb: HTMLElement
    private readonly minThumbSize: number
    private readonly restore: () => void
    private drag: Drag | undefined

    constructor(private readonly viewport: HTMLElement, private readonly axis: Axis, elements: ScrollbarElements, signal: AbortSignal) {
        const { track, thumb, minThumbSize = 0 } = elements
        this.track = track
        this.thumb = thumb
        this.minThumbSize = minThumbSize
        const overflow = track.getAttribute(overflowAttribute)
        const properties = [sizeProperty, offsetProperty].map(name => ({
            name, value: thumb.style.getPropertyValue(name), priority: thumb.style.getPropertyPriority(name),
        }))
        this.restore = () => {
            if (overflow === null) track.removeAttribute(overflowAttribute)
            else track.setAttribute(overflowAttribute, overflow)
            for (const { name, value, priority } of properties) thumb.style.setProperty(name, value, priority)
        }

        track.addEventListener('pointerdown', this.onTrackDown, { signal })
        thumb.addEventListener('pointerdown', this.onThumbDown, { signal })
        thumb.addEventListener('pointermove', this.onThumbMove, { signal })
        thumb.addEventListener('pointerup', this.onThumbEnd, { signal })
        thumb.addEventListener('pointercancel', this.onThumbEnd, { signal })
        thumb.addEventListener('lostpointercapture', this.onThumbEnd, { signal })
    }

    sync(): void {
        const { metrics } = this.measure()
        this.track.setAttribute(overflowAttribute, String(metrics.scrollRange > 0))
        this.thumb.style.setProperty(sizeProperty, `${metrics.thumbSize}px`)
        this.thumb.style.setProperty(offsetProperty, `${metrics.thumbOffset}px`)
    }

    destroy(): void {
        this.releaseDrag()
        this.restore()
    }

    private measure() {
        const scroll = readAxis(this.viewport, this.axis)
        const metrics = getScrollMetrics({ ...scroll, trackSize: trackSize(this.track, this.axis), minThumbSize: this.minThumbSize })
        return { scroll, metrics }
    }

    /** 轨道点击使用整条轨道的比例。滑块拖动使用扣除滑块长度后的可移动行程。 */
    private onTrackDown = (event: PointerEvent): void => {
        if (!event.isPrimary || event.button !== 0 || event.composedPath().includes(this.thumb)) return
        const { scroll, metrics } = this.measure()
        const length = trackSize(this.track, this.axis)
        if (!metrics.scrollRange || !length) return
        event.preventDefault()
        const fraction = Math.max(0, Math.min(1, pointerOffset(this.track, this.axis, event) / length))
        scroll.scrollTo(metrics.scrollRange * fraction, 'instant')
    }

    /** 捕获当前指针，拖过轨道边缘时仍能继续。一旦指针取消或释放就清除拖动状态。 */
    private onThumbDown = (event: PointerEvent): void => {
        if (!event.isPrimary || event.button !== 0 || this.drag) return
        const { metrics } = this.measure()
        if (!metrics.thumbTravel || !metrics.scrollRange) return
        event.preventDefault()
        this.thumb.setPointerCapture(event.pointerId)
        this.drag = { id: event.pointerId, origin: pointerOffset(this.track, this.axis, event), thumbOffset: metrics.thumbOffset }
    }

    private onThumbMove = (event: PointerEvent): void => {
        const drag = this.drag
        if (drag?.id !== event.pointerId) return
        const { scroll, metrics } = this.measure()
        if (!metrics.thumbTravel || !metrics.scrollRange) return
        const delta = pointerOffset(this.track, this.axis, event) - drag.origin
        scroll.scrollTo(scrollOffsetFromThumb(drag.thumbOffset + delta, metrics), 'instant')
    }

    private onThumbEnd = (event: PointerEvent): void => {
        if (this.drag?.id === event.pointerId) this.releaseDrag()
    }

    private releaseDrag(): void {
        if (!this.drag) return
        const { id } = this.drag
        this.drag = undefined
        if (this.thumb.hasPointerCapture(id)) this.thumb.releasePointerCapture(id)
    }
}
