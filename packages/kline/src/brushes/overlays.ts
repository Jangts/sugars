/* 绘制跟随交互的覆盖层，如十字光标和当前数据提示。 */

import { timeAxisHeight } from '../Layout.js'
import { Brush } from './Brush.js'
import { formatTime, formatValue } from './grids.js'

export class Selection extends Brush {
    draw(): void {
        const { ctx } = this.canvas
        const { chart } = this
        const { layout, selection } = chart.kline
        if (!selection) return
        const x = layout.xAt(selection.index)
        ctx.save()
        ctx.strokeStyle = this.theme.SelectedL
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(x, chart.top)
        ctx.lineTo(x, chart.top + chart.height)
        if (chart.containsY(selection.y)) {
            ctx.moveTo(0, selection.y)
            ctx.lineTo(layout.plotWidth, selection.y)
        }
        ctx.stroke()
        ctx.restore()
    }
}

export class Legend extends Brush {
    draw(): void {
        const { ctx, painter } = this.canvas
        const { chart } = this
        const { layout, selection, dataProvider } = chart.kline
        const i = selection?.index ?? layout.end - 1
        const bar = dataProvider.getDataAt(i)
        ctx.font = this.theme.FontI
        ctx.textBaseline = 'top'
        ctx.textAlign = 'left'
        let x = 5
        const labels = [{ text: chart.name, color: this.theme.GridTextY }]
        if (bar && chart.kind === 'price') {
            labels.push({ text: `O ${formatValue(bar.o)}  H ${formatValue(bar.h)}  L ${formatValue(bar.l)}  C ${formatValue(bar.n)}`, color: this.theme.SelectedTI })
        }
        if (bar && chart.kind === 'volume') labels.push({ text: formatValue(bar.v), color: this.theme.SelectedTI })
        chart.series.forEach((series, index) => {
            if (bar) labels.push({ text: `${series.name} ${formatValue(series.values[i])}`, color: chart.seriesColor(index) })
        })
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, chart.top, layout.plotWidth, chart.height)
        ctx.clip()
        const fontHeight = (Number.parseFloat(this.theme.FontI) || 14) + 2
        let y = chart.top + 3
        for (const { text, color } of labels) {
            const width = ctx.measureText(text).width
            if (x > 5 && x + width > layout.plotWidth) {
                x = 5
                y += fontHeight
            }
            ctx.fillStyle = color
            painter.write(text, x, y, Math.max(1, layout.plotWidth - x - 3))
            x += width + 8
        }
        ctx.restore()
    }
}

export class PriceAndTime extends Brush {
    draw(): void {
        const { ctx, painter } = this.canvas
        const { chart } = this
        const { layout, dataProvider, selection } = chart.kline
        if (!selection) return
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        if (chart.containsY(selection.y)) {
            const y = selection.y
            ctx.fillStyle = this.theme.SelectedBGY
            ctx.fillRect(layout.plotWidth + 1, y - 9, Math.max(0, layout.axisWidth - 1), 18)
            ctx.fillStyle = this.theme.SelectedTY
            ctx.font = this.theme.FontY
            painter.write(formatValue(chart.valueAt(y)), layout.plotWidth + layout.axisWidth / 2, y, Math.max(1, layout.axisWidth - 4))
        }
        if (chart !== layout.charts[layout.charts.length - 1]) return
        const bar = dataProvider.getDataAt(selection.index)
        if (!bar) return
        const text = chart.intraday
            ? formatTime(bar.t, false).slice(5) + ' ' + formatTime(bar.t, true)
            : formatTime(bar.t, false)
        ctx.font = this.theme.FontX
        const width = Math.min(layout.plotWidth, ctx.measureText(text).width + 12)
        const left = Math.max(0, Math.min(layout.plotWidth - width, layout.xAt(selection.index) - width / 2))
        const top = layout.height - timeAxisHeight
        ctx.fillStyle = this.theme.SelectedBGX
        ctx.fillRect(left, top, width, timeAxisHeight)
        ctx.fillStyle = this.theme.SelectedTX
        painter.write(text, left + width / 2, top + timeAxisHeight / 2, Math.max(1, width - 4))
    }
}
