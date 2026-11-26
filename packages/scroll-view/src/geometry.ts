/* 用纯数值计算滚动范围、滑块尺寸和行程，并提供滑块坐标到滚动位置的逆换算。 */

export interface ScrollGeometry {
    /** 可见部分在当前轴的尺寸，单位为 CSS 像素。 */
    viewportSize: number
    /** 包含不可见区域的总内容尺寸。 */
    contentSize: number
    /** 从轨道内容区读出的轴向长度。 */
    trackSize: number
    /** 由使用方统一为从视觉起点递增的滚动距离。 */
    scrollOffset: number
    /** 滑块长度下限。计算后仍不超过轨道长度。 */
    minThumbSize?: number
}

export interface ScrollMetrics {
    /** 内容尺寸减视口尺寸，最小为 0。 */
    scrollRange: number
    /** 限制在 scrollRange 以内的视口偏移。 */
    scrollOffset: number
    /** 将内容与视口比例映射到轨道后的滑块长度。 */
    thumbSize: number
    /** 去掉滑块长度后可移动的距离。 */
    thumbTravel: number
    /** 滑块前端距轨道起点的距离。 */
    thumbOffset: number
}

function within(value: number, max: number): number {
    return Math.min(max, Math.max(0, value))
}

/**
 * 把视口偏移映射到滑块位置。最小滑块尺寸可以缩短行程，滚动范围由内容与视口尺寸决定。
 *
 * @param geometry - 已统一坐标方向的尺寸和偏移。
 * @returns 轨道、内容与滑块之间的换算参数，全部距离使用同一单位。
 */
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

/**
 * 将滑块位置换回原生视口应采用的滚动距离。
 * @param thumbOffset - 从轨道起点量起的候选滑块位置。
 * @param metrics - 前一次由当前几何计算的行程和滚动范围。
 * @returns 限制到视口范围的偏移，滑块无可用行程时为 0。
 */
export function scrollOffsetFromThumb(thumbOffset: number, { thumbTravel, scrollRange }: ScrollMetrics): number {
    return thumbTravel > 0 ? scrollRange * within(thumbOffset, thumbTravel) / thumbTravel : 0
}
