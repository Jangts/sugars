/*! Ported from TangramJS painter/Charts/Charts.js. */
import { defaults } from './defaults.js'
import { mergeOptions } from './series-data.js'
import { buildGrid } from './modules/grid.js'
import { buildPolar } from './modules/polar.js'
import { buildRadar } from './modules/radar.js'
import { showTooltip } from './modules/tooltip.js'
import { bar } from './types/Bar.js'
import { line } from './types/Line.js'
import { scatter } from './types/Scatter.js'
import { radar } from './types/Radar.js'
import { pie } from './types/Pie.js'
import type { Grid } from './components/scales/Grid.js'
import type { Polar } from './components/scales/Polar.js'
import type { ChartElement } from './components/Abstract.js'
import type { SeriesRenderer } from './types/Abstract.js'
import type { ChartOptions, Series } from './types.js'

export type * from './types.js'

const seriesBuilders = { bar, line, scatter, radar, pie } satisfies Record<Series['type'], (this: Charts) => void>
type HoverHandler = (this: Charts, event: MouseEvent | TouchEvent) => void
type ResolvedOptions = Omit<typeof defaults, 'animationEasing'> & ChartOptions

let chartCount = 0

export class Charts {
    static readonly theme: Record<string, ChartOptions> = Object.create(null)

    readonly id = String(++chartCount)
    readonly Element: HTMLElement
    width = 0
    height = 0
    ratio = 1
    options: ResolvedOptions
    series: Partial<Record<Series['type'], Series[]>> = {}
    grid: Grid | null = null
    polar: Polar | null = null
    radarpolar: Polar | null = null
    historyCharts: Record<string, SeriesRenderer> = Object.create(null)
    activedCharts: SeriesRenderer[] = []
    actived = 0
    activeElements: ChartElement[] = []
    readonly showTooltip = showTooltip
    readonly buildGrid = buildGrid
    readonly buildPolar = buildPolar
    readonly buildRadar = buildRadar
    readonly bar = bar
    readonly line = line
    readonly scatter = scatter
    readonly radar = radar
    readonly pie = pie

    private readonly window: Window & typeof globalThis
    private readonly layers = new Map<number, HTMLCanvasElement>()
    private readonly hoverHandlers: HoverHandler[] = []
    private readonly previousPosition: string
    private readonly previousCursor: string
    private readonly previousBackground: string
    private listeners: AbortController
    private observer?: ResizeObserver
    private animationFrame?: number
    private names: Record<string, number> = Object.create(null)
    private destroyed = false

    constructor(element: HTMLElement, theme?: string | null, options?: ChartOptions)
    constructor(element: HTMLElement, options?: ChartOptions)
    constructor(element: HTMLElement, theme?: string | ChartOptions | null, options?: ChartOptions) {
        const window = element.ownerDocument.defaultView
        if (!window) throw new Error('Charts needs a document attached to a window')
        this.window = window
        this.Element = element
        this.listeners = new window.AbortController()
        this.previousPosition = element.style.position
        this.previousCursor = element.style.cursor
        this.previousBackground = element.style.backgroundColor
        element.setAttribute('data-chart-id', this.id)
        if (window.getComputedStyle(element).position === 'static') element.style.position = 'relative'
        this.options = mergeOptions(defaults, typeof theme === 'string' ? Charts.theme[theme] ?? {} : {}) as ResolvedOptions
        this.measure()
        if (!this.height && this.width) this.height = this.width / 2
        if (this.height && this.width) this.ratio = this.width / this.height
        const initial = options ?? (typeof theme === 'object' && theme ? theme : undefined)
        if (initial) this.setOption(initial)
    }

    setOption(options: ChartOptions = {}): this {
        this.assertActive()
        this.options = mergeOptions(this.options, options)
        this.Element.style.backgroundColor = this.options.backgroundColor ?? this.previousBackground
        this.series = {}
        for (const item of this.options.series ?? []) {
            if (!Object.hasOwn(seriesBuilders, item.type)) throw new TypeError(`Unknown chart type: ${item.type}`)
            ;(this.series[item.type] ??= []).push(item)
        }
        this.watchSize()
        return this.build()
    }

    build(animaless = false): this {
        this.assertActive()
        this.stop()
        this.activeElements = []
        this.activedCharts = []
        this.names = Object.create(null)
        this.historyCharts = Object.create(null)
        this.hoverHandlers.length = 0
        this.grid = this.polar = this.radarpolar = null
        if (this.series.bar || this.series.line || this.series.scatter ) {
            this.buildGrid()
        }
        if (this.options.polar.show && this.options.angleAxis.data?.length) this.buildPolar()
        if (this.series.radar) this.buildRadar()
        for (const type of Object.keys(seriesBuilders) as Series['type'][]) {
            if (this.series[type]?.length) seriesBuilders[type].call(this)
        }
        this.bindHover()
        return animaless ? this.draw() : this.render()
    }

    getChartName(prefix = ''): string {
        const index = this.names[prefix] ?? 0
        this.names[prefix] = index + 1
        return `${prefix}${index}`
    }

    getLayer(zIndex = 0): HTMLCanvasElement {
        let canvas = this.layers.get(zIndex)
        if (!canvas) {
            canvas = this.Element.ownerDocument.createElement('canvas')
            Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', zIndex: String(zIndex), pointerEvents: 'none' })
            this.Element.append(canvas)
            this.layers.set(zIndex, canvas)
            this.sizeLayer(canvas)
        }
        return canvas
    }

    getContext(zIndex = 0): CanvasRenderingContext2D {
        const context = this.getLayer(zIndex).getContext('2d')
        if (!context) throw new Error('A Canvas 2D context is unavailable')
        return context
    }

    retinaScale(): this {
        for (const canvas of this.layers.values()) this.sizeLayer(canvas)
        return this
    }

    clear(): this {
        for (const [zIndex, canvas] of this.layers) {
            const ctx = this.getContext(zIndex)
            ctx.save()
            ctx.resetTransform()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.restore()
        }
        return this
    }

    stop(): this {
        if (this.animationFrame !== undefined) {
            this.window.cancelAnimationFrame(this.animationFrame)
            this.animationFrame = undefined
        }
        return this
    }

    render(): this {
        this.stop()
        const options = this.options
        const duration = options.animationDuration
        if (!options.animation || !(duration > 0) || !Number.isFinite(duration) ||
            this.window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.draw()
            options.onAnimationComplete?.call(this)
            return this
        }
        const start = this.window.performance.now()
        const step = (now: number) => {
            this.animationFrame = undefined
            if (this.destroyed || this.options !== options) return
            const progress = Math.min(1, (now - start) / duration)
            const ease = typeof options.animationEasing === 'function' ? options.animationEasing(progress)
                : options.animationEasing === 'linear' ? progress : 1 - (1 - progress) ** 4
            this.draw(progress === 1 ? 1 : Math.max(0, Math.min(1, ease)))
            if (progress < 1) this.animationFrame = this.window.requestAnimationFrame(step)
            if (typeof options.onAnimationProgress === 'function') {
                ;(options.onAnimationProgress as (this: Charts, progress: number) => void).call(this, progress)
            }
            if (progress === 1 && !this.destroyed && this.options === options) options.onAnimationComplete?.call(this)
        }
        this.draw(0)
        this.animationFrame = this.window.requestAnimationFrame(step)
        return this
    }

    draw(ease = 1): this {
        this.clear()
        this.grid?.draw()
        this.radarpolar?.draw()
        this.polar?.draw()
        for (const chart of this.activedCharts) chart.draw(ease)
        return this
    }

    resize(): this {
        this.assertActive()
        const width = this.width
        const height = this.height
        this.measure()
        if (this.width === width && this.height === height) return this
        this.retinaScale()
        return this.build(true)
    }

    addHoverHandler(handler: HoverHandler): void {
        this.hoverHandlers.push(handler)
    }

    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true
        this.stop()
        this.listeners.abort()
        this.observer?.disconnect()
        for (const canvas of this.layers.values()) canvas.remove()
        this.layers.clear()
        this.hoverHandlers.length = 0
        this.Element.removeAttribute('data-chart-id')
        this.Element.style.position = this.previousPosition
        this.Element.style.cursor = this.previousCursor
        this.Element.style.backgroundColor = this.previousBackground
    }

    private bindHover(): void {
        this.listeners.abort()
        this.listeners = new this.window.AbortController()
        const { signal } = this.listeners
        const tooltip = this.options.tooltip
        for (const name of new Set(tooltip.triggerOn)) {
            this.Element.addEventListener(name, event => {
                this.actived = 0
                for (const handler of this.hoverHandlers) {
                    if (this.actived) break
                    handler.call(this, event as MouseEvent | TouchEvent)
                }
            }, { signal, passive: true })
        }
        for (const name of new Set(tooltip.triggerOff)) {
            this.Element.addEventListener(name, () => {
                this.actived = 0
                this.Element.style.cursor = this.previousCursor
                for (const chart of this.activedCharts) for (const segment of chart.segments) segment.restore()
                this.showTooltip([], true)
            }, { signal })
        }
    }

    private watchSize(): void {
        if (!this.options.responsive) {
            this.observer?.disconnect()
            this.observer = undefined
        } else if (!this.observer && this.window.ResizeObserver) {
            this.observer = new this.window.ResizeObserver(() => this.resize())
            this.observer.observe(this.Element)
        }
    }

    private measure(): void {
        const css = this.window.getComputedStyle(this.Element)
        const pixels = (value: string) => Number.parseFloat(value) || 0
        this.width = Math.max(0, this.Element.clientWidth - pixels(css.paddingLeft) - pixels(css.paddingRight))
        this.height = this.options.maintainAspectRatio && this.height ? this.width / this.ratio
            : Math.max(0, this.Element.clientHeight - pixels(css.paddingTop) - pixels(css.paddingBottom))
    }

    private sizeLayer(canvas: HTMLCanvasElement): void {
        const ratio = this.window.devicePixelRatio || 1
        canvas.style.width = `${this.width}px`
        canvas.style.height = `${this.height}px`
        canvas.width = Math.round(this.width * ratio)
        canvas.height = Math.round(this.height * ratio)
        canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    private assertActive(): void {
        if (this.destroyed) throw new Error('The chart has been destroyed')
    }
}

export function createChart(element: HTMLElement, options?: ChartOptions): Charts {
    return new Charts(element, options)
}
