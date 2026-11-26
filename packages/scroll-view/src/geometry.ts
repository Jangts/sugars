export interface ScrollGeometry {
    viewportSize: number
    contentSize: number
    trackSize: number
    scrollOffset: number
    minThumbSize?: number
}

export interface ScrollMetrics {
    scrollRange: number
    scrollOffset: number
    thumbSize: number
    thumbTravel: number
    thumbOffset: number
}

function within(value: number, max: number): number {
    return Math.min(max, Math.max(0, value))
}

export function getScrollMetrics({ viewportSize, contentSize, trackSize, scrollOffset, minThumbSize = 0 }: ScrollGeometry): ScrollMetrics {
    const scrollRange = Math.max(0, contentSize - viewportSize)
    scrollOffset = within(scrollOffset, scrollRange)
    const thumbSize = scrollRange === 0
        ? trackSize
        : within(Math.max(minThumbSize, trackSize * viewportSize / contentSize), trackSize)
    const thumbTravel = trackSize - thumbSize
    const thumbOffset = scrollRange > 0 ? thumbTravel * scrollOffset / scrollRange : 0
    return { scrollRange, scrollOffset, thumbSize, thumbTravel, thumbOffset }
}

export function scrollOffsetFromThumb(thumbOffset: number, { thumbTravel, scrollRange }: ScrollMetrics): number {
    return thumbTravel > 0 ? scrollRange * within(thumbOffset, thumbTravel) / thumbTravel : 0
}
