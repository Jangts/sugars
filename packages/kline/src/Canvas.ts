import type { KLine } from './index.js'
import { Painter } from './painter/Painter.js'
import type { Size } from './types.js'

export type CanvasName = 'temp' | 'main' | 'overlay'

export class Canvas {
    readonly element: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D
    readonly painter: Painter
    width = 0
    height = 0

    constructor(readonly name: CanvasName, readonly kline: KLine) {
        this.element = kline.element.ownerDocument.createElement('canvas')
        this.element.className = name + '-canvas'
        this.element.setAttribute('aria-hidden', 'true')
        Object.assign(this.element.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' })

        const ctx = this.element.getContext('2d')
        if (!ctx) throw new Error('KLine requires a Canvas 2D context')
        this.ctx = ctx
        this.painter = new Painter(this)
        kline.surface.append(this.element)
    }

    setSize({ width, height }: Size): void {
        this.width = width
        this.height = height
        const ratio = this.kline.options.useRetinaScale ? this.element.ownerDocument.defaultView?.devicePixelRatio || 1 : 1
        const pixelWidth = Math.round(width * ratio)
        const pixelHeight = Math.round(height * ratio)
        this.element.style.width = width + 'px'
        this.element.style.height = height + 'px'
        if (this.element.width !== pixelWidth) this.element.width = pixelWidth
        if (this.element.height !== pixelHeight) this.element.height = pixelHeight
        this.ctx.setTransform(width ? pixelWidth / width : 1, 0, 0, height ? pixelHeight / height : 1, 0, 0)
    }

    draw(): void {
        this.clear()
        if (this.name === 'temp' || !this.width || !this.height) return
        if (this.name === 'main') {
            this.painter.fillRect(0, 0, this.width, this.height, 0, this.kline.theme.Background)
        }
        for (const chart of this.kline.layout.charts) chart.draw(this)
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height)
    }
}
