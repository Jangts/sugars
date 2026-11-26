/*! Ported from GrandAPP K Line Mobile. See THIRD-PARTY-NOTICES.md. */

/**
 * `@sugars/kline` 的公开入口。
 *
 * K 线实例组装行情、布局、图表和交互，统一管理刷新、尺寸响应和释放。
 * `KLine` 接入宿主并管理主图、指标和输入。公开 `Data`、`Theme`、预设主题以及相关输入类型。
 */

import { Canvas } from './Canvas.js'
import type { CanvasName } from './Canvas.js'
import { DataProvider } from './DataProvider.js'
import type { KLineBar } from './DataProvider.js'
import { Layout, timeAxisHeight } from './Layout.js'
import type { Painter } from './painter/Painter.js'
import { Theme, classicDark } from './Theme.js'
import type { ChartName } from './charts/index.js'
import { registerInteraction } from './interaction.js'
import type { KLineOptions, ThemeInterface } from './types.js'

export { Data } from './DataProvider.js'
export type { KLineBar, KLineServerBar, KLineTuple } from './DataProvider.js'
export type { ChartName } from './charts/index.js'
export { Theme, classicDark, classicLight, reverseDark, reverseLight } from './Theme.js'
export type { KLineOptions, ThemeInterface } from './types.js'

interface Selection {
    index: number
    y: number
}

const defaultLayout: readonly ChartName[] = ['MA', 'Volume', 'MACD']

export class KLine {
    readonly options: KLineOptions & { useRetinaScale: boolean; layoutConf: readonly ChartName[] }
    readonly element: HTMLElement
    readonly surface: HTMLDivElement
    readonly canvases: Canvas[] & Record<CanvasName, Canvas>
    layout: Layout
    theme: Theme
    readonly dataProvider: DataProvider
    selection?: Selection
    private readonly listener: AbortController
    private readonly observer?: ResizeObserver

    /**
     * @param options - 宿主、行情、布局和主题配置。
     * @throws {TypeError} 宿主不存在或行情字段无效。
     */
    constructor(options: KLineOptions) {
        const element = typeof options.element === 'string' ? globalThis.document?.getElementById(options.element) : options.element
        const view = element?.ownerDocument?.defaultView
        if (!view || !(element instanceof view.HTMLElement)) {
            throw new TypeError('KLine element must be an HTMLElement or an existing element ID')
        }
        this.element = element
        this.options = {
            ...options,
            layoutConf: [...(options.layoutConf ?? defaultLayout)],
            useRetinaScale: options.useRetinaScale ?? true,
        }
        this.theme = options.theme instanceof Theme
            ? new Theme(options.theme, options.theme.isDark)
            : new Theme(options.theme ?? classicDark)
        this.dataProvider = new DataProvider(this, options.data ?? [])
        this.layout = new Layout(this.options.layoutConf, this)
        this.layout.setDataLength(this.dataProvider.storage.length)

        const surface = this.surface = element.ownerDocument.createElement('div')
        surface.className = 'my-k-line'
        surface.tabIndex = 0
        surface.setAttribute('role', 'region')
        surface.setAttribute('aria-label', 'K-line chart')
        Object.assign(surface.style, {
            position: 'relative', overflow: 'hidden', touchAction: 'none', userSelect: 'none',
        })
        const temp = new Canvas('temp', this)
        const main = new Canvas('main', this)
        const overlay = new Canvas('overlay', this)
        this.canvases = Object.assign([temp, main, overlay], { temp, main, overlay })
        this.listener = new view.AbortController()
        element.append(surface)
        this.setSize(options.width, options.height)
        registerInteraction(this, this.listener.signal)
        view.addEventListener('resize', this.measure, { signal: this.listener.signal })
        if (view.ResizeObserver) {
            this.observer = new view.ResizeObserver(this.measure)
            this.observer.observe(surface)
        }
    }

    /**
     * @param width - CSS 长度或像素值，undefined 保留已有宽度，null 使用 100%。
     * @param height - CSS 长度或像素值，undefined 保留已有高度，null 使用 100%。
     */
    setSize(width?: string | number | null, height?: string | number | null): void {
        const style = this.surface.style
        if (typeof width === 'number') style.width = Math.max(0, width) + 'px'
        else if (width !== undefined || !style.width) style.width = width ?? '100%'
        if (typeof height === 'number') style.height = Math.max(0, height) + 'px'
        else if (height !== undefined || !style.height) style.height = height ?? '100%'
        this.measure()
    }

    /**
     * @param width - 与 setSize 相同的宽度。
     * @param height - 与 setSize 相同的高度。
     */
    resize(width?: string | number | null, height?: string | number | null): void {
        this.setSize(width, height)
    }

    /**
     * 应用新主题并重绘。
     * @param theme - 主题实例或需要补齐缺省值的配置。
     * @param isDark - 为局部配置指定暗色基准。
     */
    setTheme(theme: Theme | Partial<ThemeInterface>, isDark = true): void {
        this.theme = theme instanceof Theme ? theme : new Theme(theme, isDark)
        this.draw()
    }

    /**
     * @param canvasName - temp、main 或 overlay。
     * @returns 所选图层使用的画笔。
     * @throws {TypeError} 图层名称未知。
     */
    getPainter(canvasName: CanvasName): Painter {
        const canvas = this.canvases[canvasName]
        if (!canvas) throw new TypeError('Unknown KLine canvas: ' + canvasName)
        return canvas.painter
    }

    /** @param layoutConf - 按展示顺序排列的图表名。更新后清除旧选区并重新测量。 */
    setLayout(layoutConf: readonly ChartName[]): void {
        const layout = new Layout(layoutConf, this)
        layout.setDataLength(this.dataProvider.storage.length)
        this.options.layoutConf = [...layoutConf]
        this.layout = layout
        this.selection = undefined
        this.measure()
    }

    /**
     * 替换并规范化整段行情，更新视图长度并清空当前选中位置。
     *
     * @param data - 允许无序或重复时间戳的行情记录。
     * @throws {TypeError} 单条行情缺字段或价格关系无效。
     */
    setData(data: readonly KLineBar[]): void {
        this.dataProvider.reset(data)
        this.layout.setDataLength(this.dataProvider.storage.length)
        this.selection = undefined
        this.draw()
    }

    /**
     * 补入一条行情。回看历史时用时间戳保住右侧锚点，避免早期数据补入后发生索引漂移。
     *
     * @param data - 一条行情，相同时间戳会替换原记录。
     * @throws {TypeError} 行情校验失败。
     */
    appendData(data: KLineBar): void {
        const { dataProvider, layout } = this
        // 当前视图在尾端时继续跟随新增行情。回看历史时保持右侧的时间锚点，以免早期数据插入后画面平移。
        const anchor = layout.following ? undefined : dataProvider.getDataAt(layout.end - 1)?.t
        const selected = this.selection && dataProvider.getDataAt(this.selection.index)?.t
        dataProvider.append(data)
        layout.setDataLength(dataProvider.storage.length, anchor === undefined ? undefined : dataProvider.indexAtOrAfter(anchor) + 1)
        if (this.selection && selected !== undefined) this.selection.index = dataProvider.indexAtOrAfter(selected)
        this.draw()
    }

    resetView(): void {
        this.layout.reset()
        this.selection = undefined
        this.draw()
    }

    /**
     * 根据图表区域内的逻辑像素坐标选中行情。省略坐标可清除十字光标。
     *
     * @param x - 相对图表表面的横坐标，缺省清除选中项。
     * @param y - 相对图表表面的纵坐标，需落在行情区内。
     * @param redraw - 是否立即重绘覆盖层。
     */
    select(x?: number, y?: number, redraw = true): void {
        if (this.listener.signal.aborted) return
        const index = x === undefined ? undefined : this.layout.indexAt(x)
        const selection = index !== undefined && y !== undefined && y >= 0 && y < this.layout.height - timeAxisHeight
            ? { index, y }
            : undefined
        if (selection?.index === this.selection?.index && selection?.y === this.selection?.y) return
        this.selection = selection
        if (redraw) this.canvases.overlay.draw()
    }

    draw(): void {
        if (this.listener.signal.aborted) return
        if (this.selection && (this.selection.index < this.layout.start || this.selection.index >= this.layout.end)) {
            this.selection = undefined
        }
        this.canvases.main.draw()
        this.canvases.overlay.draw()
    }

    clear(): void {
        this.selection = undefined
        this.canvases.forEach(canvas => canvas.clear())
    }

    /** 移除实例创建的表面，释放输入和尺寸监听。 */
    destroy(): void {
        if (this.listener.signal.aborted) return
        this.listener.abort()
        this.observer?.disconnect()
        this.surface.remove()
    }

    private readonly measure = (): void => {
        if (this.listener.signal.aborted) return
        const size = { width: this.surface.clientWidth, height: this.surface.clientHeight }
        for (const canvas of this.canvases) canvas.setSize(size)
        this.layout.setSize(size)
        this.draw()
    }
}
