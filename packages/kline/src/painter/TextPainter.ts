import type { Canvas } from '../Canvas.js'

interface ImageFill {
    url: string
    repeat?: string
    after?: (width: number, height: number) => void
}

export function fontString(pixelSize: number, fontStyle: string, fontFamily: string): string {
    return `${fontStyle} ${pixelSize}px ${fontFamily}`
}

export function longestText(ctx: CanvasRenderingContext2D, font: string, texts: readonly string[]): number {
    ctx.font = font
    let longest = 0
    for (const text of texts) longest = Math.max(longest, ctx.measureText(text).width)
    return longest
}

export class TextPainter {
    ctx: CanvasRenderingContext2D

    constructor(public canvas: Canvas) {
        this.ctx = canvas.ctx
    }

    css(property: string | object, value?: unknown): this {
        if (!property) return this
        if (typeof property !== 'string') {
            for (const [key, style] of Object.entries(property as Record<string, unknown>)) this.css(key, style)
            return this
        }

        switch (property) {
            case 'backgroud':
                if (typeof value === 'string' && value) this.ctx.fillStyle = value
                else if (Array.isArray(value)) {
                    for (const style of value) this.css(property, style)
                } else if (value instanceof CanvasGradient || value instanceof CanvasPattern) {
                    this.ctx.fillStyle = value
                } else if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
                    this.loadImageFill(value as ImageFill)
                }
                break
            case 'bgColor':
            case 'backgroudColor':
            case 'backgroud-color':
                if (typeof value === 'string' && value) this.ctx.fillStyle = value
                break
            case 'bgImage':
            case 'backgroudImage':
            case 'backgroud-image':
                if (value && typeof value === 'object') this.ctx.fillStyle = value as CanvasGradient | CanvasPattern
                break
            case 'border':
                if (Array.isArray(value)) {
                    for (const style of value) this.css(property, style)
                } else if (typeof value === 'number') this.css('border-width', value)
                else if (typeof value === 'string') this.css('border-color', value)
                break
            case 'borderWidth':
            case 'border-width':
                if (typeof value === 'number') this.ctx.lineWidth = value
                break
            case 'color':
            case 'borderColor':
            case 'border-color':
                if (typeof value === 'string' && value) this.ctx.strokeStyle = value
                break
            case 'opacity':
                if (typeof value === 'number') this.ctx.globalAlpha = value
                break
        }
        return this
    }

    write(text: string, x = 0, y = 0, maxWidth?: number): this {
        if (maxWidth === undefined) this.ctx.fillText(text, x, y)
        else this.ctx.fillText(text, x, y, maxWidth)
        return this
    }

    private loadImageFill(fill: ImageFill): void {
        const image = new Image()
        image.onload = () => {
            const pattern = this.ctx.createPattern(image, fill.repeat || 'no-repeat')
            if (pattern) this.ctx.fillStyle = pattern
            if (typeof fill.after === 'function') fill.after(image.width, image.height)
        }
        image.src = fill.url
    }
}
