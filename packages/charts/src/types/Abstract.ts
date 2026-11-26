/*! Ported from TangramJS painter/Charts/types/Abstract.js. */

/* 系列渲染基类持有所属图表、图层上下文和绘制元素，具体系列实现数据更新和命中。 */

import type { Charts } from '../index.js'
import type { ChartElement } from '../components/Abstract.js'
import type { Paint } from '../types.js'

export type ResolvedSeries<T> = T & {
    index: number
    name: string
    itemStyle: { normal: Paint; emphasis: Paint }
}

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

    initialize(_options: object): void {}
    draw(_ease?: number): void {}
    update(_data: any, _datasetIndex?: number): void {}
    getSegmentsAtEvent(_event: MouseEvent | TouchEvent, _charts?: SeriesRenderer[]): ChartElement[] {
        return []
    }
}
