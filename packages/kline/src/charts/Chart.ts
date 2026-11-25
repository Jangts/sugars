import type { KLine } from '../index.js'
import type { Canvas } from '../Canvas.js'
import type { Indicator, IndicatorValues } from '../indicators/Indicator.js'
import type { DataProvider } from '../DataProvider.js'
import type { Size } from '../types.js'
import { brushes } from '../brushes/index.js'

type ChartKind = 'price' | 'volume' | 'indicator'
export type PanelPosition = readonly [top: number, height: number]

export abstract class Chart {
    abstract readonly name: string
    abstract readonly kind: ChartKind
    readonly indicator?: new (provider: DataProvider) => Indicator
    readonly posi: [top: number, left: number]
    readonly size: [width: number, height: number]
    top = 0
    left = 0
    width = 0
    height = 0
    series: IndicatorValues[] = []
    private revision = -1
    private minValue = 0
    private maxValue = 1

    constructor([top, height]: PanelPosition, readonly kline: KLine) {
        this.posi = [top, 0]
        this.size = [1, height]
    }

    setStyle(size: Size): void {
        const [topRatio, leftRatio] = this.posi
        const [widthRatio, heightRatio] = this.size
        this.top = Math.ceil(size.height * topRatio)
        this.left = Math.ceil(size.width * leftRatio)
        this.width = Math.floor(size.width * widthRatio)
        this.height = Math.max(0, Math.round(size.height * (topRatio + heightRatio)) - this.top)
    }

    get intraday(): boolean {
        const { storage } = this.kline.dataProvider
        const last = storage.at(-1)
        const previous = storage.at(-2)
        return !!last && !!previous && last.t - previous.t < 86400000
    }

    containsY(y: number): boolean {
        return y >= this.top && y < this.top + this.height
    }

    yAt(value: number): number {
        return this.top + (this.maxValue - value) / (this.maxValue - this.minValue) * this.height
    }

    valueAt(y: number): number {
        return this.maxValue - (y - this.top) / this.height * (this.maxValue - this.minValue)
    }

    seriesColor(index: number): string {
        const theme = this.kline.theme
        const colors = [theme.Indicator0, theme.Indicator1, theme.Indicator2, theme.Indicator3, theme.Indicator4, theme.Indicator5]
        return colors[index % colors.length] ?? theme.Indicator0
    }

    draw(canvas: Canvas): void {
        if (!this.width || !this.height) return

        if (canvas.name === 'overlay') {
            if (this.kind === 'price') new brushes.CandlestickPrices(canvas, this).draw()
            new brushes.Selection(canvas, this).draw()
            new brushes.Legend(canvas, this).draw()
            if (this === this.kline.layout.charts.at(-1)) new brushes.TimeAxis(canvas, this).draw()
            new brushes.PriceAndTime(canvas, this).draw()
            return
        }

        const { layout, dataProvider } = this.kline
        if (dataProvider.revision !== this.revision) {
            this.series = this.indicator ? new this.indicator(dataProvider).calculate(dataProvider) : []
            this.revision = dataProvider.revision
        }
        if (layout.start >= layout.end) return
        this.updateRange()
        new brushes.Grid(canvas, this).draw()

        const { ctx } = canvas
        ctx.save()
        ctx.beginPath()
        ctx.rect(this.left, this.top, this.width, this.height)
        ctx.clip()
        if (this.kind === 'price') new brushes.Candlestick(canvas, this).draw()
        if (this.kind === 'volume') new brushes.VolBars(canvas, this).draw()
        if (this.kind === 'indicator') new brushes.SubBars(canvas, this).draw()
        if (this.series.length) new brushes.TrendLine(canvas, this).draw()
        ctx.restore()
    }

    private updateRange(): void {
        const { layout, dataProvider } = this.kline
        let min = Infinity
        let max = -Infinity
        const include = (low: number | undefined, high: number | undefined) => {
            if (low !== undefined && high !== undefined && Number.isFinite(low) && Number.isFinite(high)) {
                min = Math.min(min, low)
                max = Math.max(max, high)
            }
        }
        if (this.kind === 'volume' || this.series.some(item => item.histogram)) include(0, 0)
        for (let i = layout.start; i < layout.end; i++) {
            const bar = dataProvider.getDataAt(i)
            if (!bar) continue
            if (this.kind === 'price') include(bar.l, bar.h)
            if (this.kind === 'volume') include(bar.v, bar.v)
            for (const { values } of this.series) include(values[i], values[i])
        }
        if (min === Infinity) {
            min = 0
            max = 1
        }
        const pad = max === min ? (Math.abs(max) * .01 || 1) : (max - min) * .08
        this.minValue = this.kind === 'volume' ? 0 : min - pad
        this.maxValue = max + pad
    }
}
