/*! Ported from TangramJS painter/Charts/util/events.js. */
import type { Charts } from '../index.js'

export function getRelativePosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const rectangle = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const point = ('touches' in event ? event.touches[0] : event)
  return point ? { x: point.clientX - rectangle.left, y: point.clientY - rectangle.top } : { x: NaN, y: NaN }
}

export function bindHover(chart: Charts, handler: (this: Charts, event: MouseEvent | TouchEvent) => void): void {
  chart.addHoverHandler(handler)
}
