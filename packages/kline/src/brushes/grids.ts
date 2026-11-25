import { timeAxisHeight } from '../Layout.js'
import { Brush } from './Brush.js'

const numberLabels = new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 })

export function formatValue(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return '—'
    if (value === 0) return '0'
    const magnitude = Math.abs(value)
    if (magnitude >= 1e7 || magnitude < 1e-5) return value.toExponential(2)
    return numberLabels.format(Number(value.toPrecision(6)))
}

export function formatTime(time: number, intraday: boolean): string {
    const text = new Date(time).toISOString()
    return intraday ? text.slice(11, 16) : text.slice(0, 10)
}

export class Grid extends Brush {
    draw(): void {
        const { chart } = this
        const { ctx, painter } = this.canvas
        const { layout } = chart.kline
        const ticks = Math.max(1, Math.min(4, Math.floor(chart.height / 24)))
        ctx.strokeStyle = this.theme.GridY
        ctx.fillStyle = this.theme.GridTextY
        ctx.font = this.theme.FontY
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.beginPath()
        for (let tick = 0; tick <= ticks; tick++) {
            const y = chart.top + chart.height * tick / ticks
            ctx.moveTo(0, y)
            ctx.lineTo(layout.plotWidth, y)
            const inset = Math.min(8, chart.height / 2)
            const labelY = Math.max(chart.top + inset, Math.min(chart.top + chart.height - inset, y))
            if (chart.height >= 16) painter.write(formatValue(chart.valueAt(y)), layout.plotWidth + 4, labelY, Math.max(1, layout.axisWidth - 6))
        }
        if (layout.start < layout.end) {
            const step = Math.max(1, Math.ceil(100 / layout.itemWidth))
            for (let i = layout.end - 1; i >= layout.start; i -= step) {
                const x = layout.xAt(i)
                ctx.moveTo(x, chart.top)
                ctx.lineTo(x, chart.top + chart.height)
            }
        }
        ctx.stroke()
    }
}

export class TimeAxis extends Brush {
    draw(): void {
        const { ctx, painter } = this.canvas
        const { chart } = this
        const { layout, dataProvider, selection } = chart.kline
        if (layout.start >= layout.end) return
        ctx.fillStyle = this.theme.GridTextX
        ctx.font = this.theme.FontX
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        const step = Math.max(1, Math.ceil(100 / layout.itemWidth))
        const selectedX = selection ? layout.xAt(selection.index) : Infinity
        const intraday = chart.intraday
        let previousX = Infinity
        const lastBar = dataProvider.getDataAt(layout.end - 1)
        if (!lastBar) return
        let previousDay = Math.floor(lastBar.t / 86400000)
        for (let i = layout.end - 1; i >= layout.start; i -= step) {
            const bar = dataProvider.getDataAt(i)
            if (!bar) continue
            const time = bar.t
            const day = Math.floor(time / 86400000)
            const label = formatTime(time, intraday && day === previousDay)
            previousDay = day
            const half = ctx.measureText(label).width / 2 + 4
            const x = Math.max(half, Math.min(layout.plotWidth - half, layout.xAt(i)))
            if (Math.abs(x - selectedX) < half + (intraday ? 48 : 38) || previousX - x < half * 2) continue
            painter.write(label, x, layout.height - timeAxisHeight / 2, Math.max(1, layout.plotWidth))
            previousX = x
        }
    }
}
