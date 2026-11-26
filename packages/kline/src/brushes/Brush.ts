/* 画笔基类连接绘制上下文和图表坐标，具体画笔实现各自图形和样式。 */

import type { Canvas } from '../Canvas.js'
import type { Chart } from '../charts/Chart.js'

export abstract class Brush {
    constructor(readonly canvas: Canvas, readonly chart: Chart) {}

    get theme() {
        return this.canvas.kline.theme
    }

    abstract draw(): void
}
