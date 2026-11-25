import type { Canvas } from '../Canvas.js'
import type { Chart } from '../charts/Chart.js'

export abstract class Brush {
    constructor(readonly canvas: Canvas, readonly chart: Chart) {}

    get theme() {
        return this.canvas.kline.theme
    }

    abstract draw(): void
}
