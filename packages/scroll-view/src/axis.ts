/* 将横纵轴的原生尺寸、滚动值和指针坐标统一成滑块控制器使用的量，横轴兼顾 RTL。 */

const axes = {
    vertical: { size: 'clientHeight', extent: 'scrollHeight', offset: 'scrollTop', coordinate: 'clientY', edge: 'top', border: 'clientTop' },
    horizontal: { size: 'clientWidth', extent: 'scrollWidth', offset: 'scrollLeft', coordinate: 'clientX', edge: 'left', border: 'clientLeft' },
} as const

export type Axis = keyof typeof axes

/** 统一返回从视觉起点递增的偏移。横向 RTL 的原生负 scrollLeft 在此换算。 */
export function readAxis(viewport: HTMLElement, axis: Axis) {
    const dimensions = axes[axis]
    const viewportSize = viewport[dimensions.size]
    const contentSize = viewport[dimensions.extent]
    const range = Math.max(0, contentSize - viewportSize)
    const rtl = axis === 'horizontal' && viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction === 'rtl'
    return {
        viewportSize,
        contentSize,
        range,
        scrollOffset: viewport[dimensions.offset] + (rtl ? range : 0),
        scrollTo(offset: number, behavior: ScrollBehavior) {
            viewport.scrollTo({ [dimensions.edge]: offset - (rtl ? range : 0), behavior })
        },
    }
}

export function trackSize(track: HTMLElement, axis: Axis): number {
    return track[axes[axis].size]
}

export function pointerOffset(track: HTMLElement, axis: Axis, event: PointerEvent): number {
    const { coordinate, edge, border } = axes[axis]
    return event[coordinate] - track.getBoundingClientRect()[edge] - track[border]
}
