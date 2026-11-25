import { formatValue } from './grids.js'
import { Brush } from './Brush.js'

export class TrendLine extends Brush {
    draw(): void {
        const { ctx } = this.canvas
        const { chart } = this
        const { layout } = chart.kline
        chart.series.forEach(({ values, histogram }, series) => {
            if (histogram) return
            ctx.strokeStyle = chart.seriesColor(series)
            ctx.beginPath()
            let next = true
            for (let i = layout.start; i < layout.end; i++) {
                const value = values[i]
                if (value === undefined || !Number.isFinite(value)) {
                    next = true
                    continue
                }
                const x = layout.xAt(i)
                const y = chart.yAt(value)
                if (next) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
                next = false
            }
            ctx.stroke()
        })
    }
}

export class VolBars extends Brush {
    draw(): void {
        const { ctx } = this.canvas
        const { chart } = this
        const { layout, dataProvider } = chart.kline
        const baseline = chart.yAt(0)
        for (let i = layout.start; i < layout.end; i++) {
            const bar = dataProvider.getDataAt(i)
            if (!bar?.v) continue
            ctx.fillStyle = bar.n >= bar.o ? this.theme.Positive : this.theme.Negative
            const y = chart.yAt(bar.v)
            ctx.fillRect(layout.xAt(i) - layout.barWidth / 2, y, layout.barWidth, Math.max(1, baseline - y))
        }
    }
}

export class SubBars extends Brush {
    draw(): void {
        const { ctx } = this.canvas
        const { chart } = this
        const { layout } = chart.kline
        const baseline = chart.yAt(0)
        for (const { values, histogram } of chart.series) {
            if (!histogram) continue
            for (let i = layout.start; i < layout.end; i++) {
                const value = values[i]
                if (!value || !Number.isFinite(value)) continue
                ctx.fillStyle = value > 0 ? this.theme.Positive : this.theme.Negative
                const y = chart.yAt(value)
                ctx.fillRect(layout.xAt(i) - layout.barWidth / 2, Math.min(y, baseline), layout.barWidth, Math.max(1, Math.abs(y - baseline)))
            }
        }
    }
}

export class Candlestick extends Brush {
    draw(): void {
        const { ctx } = this.canvas
        const { chart } = this
        const { layout, dataProvider } = chart.kline
        for (let i = layout.start; i < layout.end; i++) {
            const bar = dataProvider.getDataAt(i)
            if (!bar) continue
            const x = layout.xAt(i)
            const color = bar.n === bar.o ? this.theme.GridTextY : bar.n > bar.o ? this.theme.Positive : this.theme.Negative
            ctx.fillStyle = ctx.strokeStyle = color
            ctx.beginPath()
            const open = chart.yAt(bar.o)
            const close = chart.yAt(bar.n)
            const top = Math.min(open, close)
            const bottom = Math.max(open, close)
            ctx.moveTo(x, chart.yAt(bar.h))
            ctx.lineTo(x, top)
            ctx.moveTo(x, bottom)
            ctx.lineTo(x, chart.yAt(bar.l))
            ctx.stroke()
            const left = x - layout.barWidth / 2
            const height = Math.max(1, bottom - top)
            if (chart.kline.options.drawPseudoUpDown && this.theme.isDark && bar.n > bar.o && height > 1 && layout.barWidth > 1) {
                ctx.strokeRect(left + .5, top + .5, layout.barWidth - 1, height - 1)
            } else {
                ctx.fillRect(left, top, layout.barWidth, height)
            }
        }
    }
}

export class CandlestickPrices extends Brush {
    draw(): void {
        const { chart } = this
        const { layout, dataProvider, selection } = chart.kline
        const bar = dataProvider.getDataAt(layout.end - 1)
        if (!bar || chart.containsY(selection?.y ?? -1)) return

        const { ctx } = this.canvas
        const y = chart.yAt(bar.n)
        ctx.fillStyle = this.theme.Background
        ctx.fillRect(layout.plotWidth + 1, y - 8, Math.max(0, layout.axisWidth - 1), 16)
        ctx.font = this.theme.FontP
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        ctx.fillStyle = bar.n >= bar.o ? this.theme.Positive : this.theme.Negative
        ctx.fillText(formatValue(bar.n), layout.plotWidth + 4, y, Math.max(1, layout.axisWidth - 6))
    }
}
