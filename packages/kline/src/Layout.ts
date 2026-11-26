/* 根据画布尺寸与行情数量计算视图起止位置、柱宽和分区几何，供渲染与交互共用。 */

import type { KLine } from './index.js'
import type { Chart, PanelPosition } from './charts/Chart.js'
import { charts } from './charts/index.js'
import type { ChartName } from './charts/index.js'
import type { Size } from './types.js'

// 原布局按旧高度的 95% 安排区域。缩放后图表区域的底部与时间轴相接。
const panelExtent = .95
const panels: readonly (readonly PanelPosition[])[] = [
    [[.05, .9]],
    [[.05, .7], [.75, .2]],
    [[.05, .5], [.55, .2], [.75, .2]],
]
export const timeAxisHeight = 22

export class Layout {
    width = 0
    height = 0
    plotWidth = 0
    axisWidth = 0
    readonly charts: Chart[]
    lineWidth = 1
    barWidthFactor = 3
    itemWidth = 7
    itemNumberMax = 1
    private offset = 0
    private count = 0

    constructor(layoutConf: readonly ChartName[], kline: KLine) {
        const positions = panels[layoutConf.length - 1]
        if (!positions) throw new TypeError('KLine layout requires one to three supported chart names')
        this.charts = positions.map((position, index) => {
            const name = layoutConf[index]
            if (!name || !Object.hasOwn(charts, name)) {
                throw new TypeError('KLine layout requires one to three supported chart names')
            }
            return new charts[name](position, kline)
        })
    }

    get start(): number {
        return Math.max(0, this.end - this.itemNumberMax)
    }

    get end(): number {
        return Math.max(0, this.count - Math.round(this.offset))
    }

    get barWidth(): number {
        return Math.max(1, this.itemWidth - this.lineWidth * 2)
    }

    get following(): boolean {
        return this.offset === 0
    }

    setSize(size: Size): void {
        this.width = size.width
        this.height = size.height
        this.axisWidth = Math.min(70, Math.round(this.width * .25))
        this.plotWidth = Math.max(0, this.width - this.axisWidth)
        this.lineWidth = Math.max(1, Math.round(this.width / 375))
        this.setBarWidthFactor(this.barWidthFactor)
        const plot = {
            width: this.plotWidth,
            height: Math.max(0, this.height - timeAxisHeight) / panelExtent,
        }
        for (const chart of this.charts) chart.setStyle(plot)
    }

    setDataLength(count: number, visibleEnd?: number): void {
        this.count = count
        this.offset = this.boundOffset(visibleEnd === undefined ? 0 : count - visibleEnd)
    }

    /** @param delta - 要滚动的行情柱数，符号决定方向。 */
    pan(delta: number): void {
        this.offset = this.boundOffset(this.offset + delta / this.itemWidth)
    }

    /**
     * 缩放时尽量让指针下的行情索引继续出现在指针位置。
     * @param factor - 当前柱宽乘以的缩放系数。
     * @param x - 锚点相对绘图区的横坐标。
     */
    zoom(factor: number, x: number): void {
        const right = this.plotWidth - Math.max(0, Math.min(this.plotWidth, x))
        const position = this.offset + right / this.itemWidth
        this.setBarWidthFactor(this.barWidthFactor * factor)
        this.offset = this.boundOffset(position - right / this.itemWidth)
    }

    reset(): void {
        this.setBarWidthFactor(3)
        this.offset = 0
    }

    indexAt(x: number): number | undefined {
        if (x < 0 || x >= this.plotWidth) return undefined
        const index = this.end - 1 - Math.floor((this.plotWidth - x) / this.itemWidth)
        return index >= this.start && index < this.end ? index : undefined
    }

    xAt(index: number): number {
        return this.plotWidth - (this.end - index - .5) * this.itemWidth
    }

    private setBarWidthFactor(factor: number): void {
        this.barWidthFactor = Math.max(1, Math.min(10, factor))
        this.itemWidth = (this.barWidthFactor * 2 + 1) * this.lineWidth
        this.itemNumberMax = Math.max(1, Math.ceil(this.plotWidth / this.itemWidth))
        this.offset = this.boundOffset(this.offset)
    }

    private boundOffset(bars: number): number {
        return Math.max(0, Math.min(Math.max(0, this.count - this.itemNumberMax), bars))
    }
}
