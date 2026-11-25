import type { KLine } from './index.js'

interface Point {
    x: number
    y: number
}

export function registerInteraction(chart: KLine, signal: AbortSignal): void {
    const target = chart.surface
    const pointers = new Map<number, Point>()
    let start: Point | undefined
    let moved = false
    let panX = 0
    let lastPointerType: string | undefined

    function local(event: MouseEvent): Point {
        const rect = target.getBoundingClientRect()
        return {
            x: (event.clientX - rect.left) * (rect.width ? target.clientWidth / rect.width : 1),
            y: (event.clientY - rect.top) * (rect.height ? target.clientHeight / rect.height : 1),
        }
    }

    function pinch(): { middle: number; distance: number } | undefined {
        const [a, b] = pointers.values()
        if (!a || !b) return
        return { middle: (a.x + b.x) / 2, distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) }
    }

    target.addEventListener('pointerdown', event => {
        if (event.button !== 0 || pointers.size >= 2) return
        lastPointerType = event.pointerType
        const point = local(event)
        pointers.set(event.pointerId, point)
        target.setPointerCapture(event.pointerId)
        if (pointers.size === 1) {
            start = point
            panX = point.x
            moved = false
        } else {
            moved = true
            chart.select()
        }
    }, { signal })

    target.addEventListener('pointermove', event => {
        const point = local(event)
        if (!pointers.has(event.pointerId)) {
            if (!pointers.size && event.pointerType === 'mouse') chart.select(point.x, point.y)
            return
        }
        const before = pointers.size === 2 ? pinch() : undefined
        pointers.set(event.pointerId, point)
        const after = before && pinch()
        if (before && after) {
            chart.layout.pan(after.middle - before.middle)
            chart.layout.zoom(after.distance / before.distance, after.middle)
            chart.draw()
            return
        }
        if (!moved && start && Math.hypot(point.x - start.x, point.y - start.y) < 4) return
        moved = true
        chart.select(undefined, undefined, false)
        chart.layout.pan(point.x - panX)
        panX = point.x
        chart.draw()
    }, { signal })

    function end(event: PointerEvent): void {
        if (!pointers.delete(event.pointerId)) return
        if (pointers.size) panX = pointers.values().next().value?.x ?? panX
        else if (!moved && event.type === 'pointerup') {
            const point = local(event)
            chart.select(point.x, point.y)
        }
    }

    target.addEventListener('pointerup', end, { signal })
    target.addEventListener('pointercancel', end, { signal })
    target.addEventListener('lostpointercapture', end, { signal })
    target.addEventListener('pointerleave', event => {
        if (!pointers.size && event.pointerType === 'mouse') chart.select()
    }, { signal })

    target.addEventListener('wheel', event => {
        const mode = event.deltaMode
        const delta = event.deltaY
        if (event.defaultPrevented || delta === 0) return
        const point = local(event)
        if (point.x < 0 || point.x >= chart.layout.plotWidth || !chart.dataProvider.storage.length) return
        event.preventDefault()
        const factor = mode === 0 ? delta / 120 : delta
        chart.layout.zoom(Math.exp(-Math.max(-2, Math.min(2, factor)) * .24), point.x)
        chart.select(point.x, point.y, false)
        chart.draw()
    }, { passive: false, signal })

    target.addEventListener('dblclick', () => {
        if (lastPointerType === 'mouse') chart.resetView()
    }, { signal })
    target.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
        const { layout } = chart
        switch (event.key) {
            case 'ArrowLeft':
                layout.pan(layout.itemWidth * 3)
                break
            case 'ArrowRight':
                layout.pan(-layout.itemWidth * 3)
                break
            case '+':
            case '=':
                layout.zoom(1.25, layout.plotWidth / 2)
                break
            case '-':
                layout.zoom(.8, layout.plotWidth / 2)
                break
            case 'Home':
                chart.resetView()
                event.preventDefault()
                return
            case 'Escape':
                chart.select()
                return
            default:
                return
        }
        event.preventDefault()
        chart.select(undefined, undefined, false)
        chart.draw()
    }, { signal })
}
