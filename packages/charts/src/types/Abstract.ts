/*! Ported from TangramJS painter/Charts/types/Abstract.js. */
import type { Charts } from '../index.js'
import type { ChartElement } from '../components/Abstract.js'

export class SeriesRenderer {
    [property: string]: any
    readonly instance: Charts
    readonly ctx: CanvasRenderingContext2D
    declare segments: ChartElement[]

    constructor(options: object, charts: Charts, zIndex?: number) {
        this.instance = charts
        this.ctx = charts.getContext(zIndex)
        this.initialize(options)
    }

    initialize(_options: any): void {}
    draw(_ease?: number): void {}
    update(_data: any, _datasetIndex?: number): void {}
    getSegmentsAtEvent(_event: MouseEvent | TouchEvent, _charts?: SeriesRenderer[]): ChartElement[] {
        return []
    }
}
