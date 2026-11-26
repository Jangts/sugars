import { pointerOffset, readAxis, trackSize } from './axis.js'
import type { Axis } from './axis.js'
import { getScrollMetrics, scrollOffsetFromThumb } from './geometry.js'

export interface ScrollbarElements {
    track: HTMLElement
    thumb: HTMLElement
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

    private onTrackDown = (event: PointerEvent): void => {
        if (!event.isPrimary || event.button !== 0 || event.composedPath().includes(this.thumb)) return
        const { scroll, metrics } = this.measure()
        const length = trackSize(this.track, this.axis)
        if (!metrics.scrollRange || !length) return
        event.preventDefault()
        const fraction = Math.max(0, Math.min(1, pointerOffset(this.track, this.axis, event) / length))
        scroll.scrollTo(metrics.scrollRange * fraction, 'instant')
    }

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
