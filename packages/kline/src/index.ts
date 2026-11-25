/*! Ported from GrandAPP K Line Mobile. See THIRD-PARTY-NOTICES.md. */
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

    setSize(width?: string | number | null, height?: string | number | null): void {
        const style = this.surface.style
        if (typeof width === 'number') style.width = Math.max(0, width) + 'px'
        else if (width !== undefined || !style.width) style.width = width ?? '100%'
        if (typeof height === 'number') style.height = Math.max(0, height) + 'px'
        else if (height !== undefined || !style.height) style.height = height ?? '100%'
        this.measure()
    }

    resize(width?: string | number | null, height?: string | number | null): void {
        this.setSize(width, height)
    }

    setTheme(theme: Theme | Partial<ThemeInterface>, isDark = true): void {
        this.theme = theme instanceof Theme ? theme : new Theme(theme, isDark)
        this.draw()
    }

    getPainter(canvasName: CanvasName): Painter {
        const canvas = this.canvases[canvasName]
        if (!canvas) throw new TypeError('Unknown KLine canvas: ' + canvasName)
        return canvas.painter
    }

    setLayout(layoutConf: readonly ChartName[]): void {
        const layout = new Layout(layoutConf, this)
        layout.setDataLength(this.dataProvider.storage.length)
        this.options.layoutConf = [...layoutConf]
        this.layout = layout
        this.selection = undefined
        this.measure()
    }

    setData(data: readonly KLineBar[]): void {
        this.dataProvider.reset(data)
        this.layout.setDataLength(this.dataProvider.storage.length)
        this.selection = undefined
        this.draw()
    }

    appendData(data: KLineBar): void {
        const { dataProvider, layout } = this
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
