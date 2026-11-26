/* 保存原生画布上下文和通用绘图属性，为路径与文字绘制提供共同基础。 */

import type { Canvas } from '../Canvas.js'
import { TextPainter } from './TextPainter.js'

const registeredMethods: Record<string, unknown> = {}

export function regMethod(plugin: object): void {
    Object.assign(registeredMethods, plugin)
}

function clampX(canvas: Canvas, x: number): number {
    if (x < 0) return 0
    if (x > canvas.width) return canvas.width
    return x
}

function clampY(canvas: Canvas, y: number): number {
    if (y < 0) return 0
    if (y > canvas.height) return canvas.height
    return y
}

function drawEllipse(this: BasePainter, x: number, y: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number, step: number): void {
    this.start().to(x + radiusX * Math.cos(startAngle), y + radiusY * Math.sin(startAngle))
    for (let angle = startAngle; step > 0 ? angle <= endAngle : angle >= endAngle; angle += step) {
        this.to(x + radiusX * Math.cos(angle), y + radiusY * Math.sin(angle), 'line')
    }
}

type LineCallback = (to: BasePainter['to'], line: BasePainter['line']) => void

export class BasePainter extends TextPainter {
    static regMethod = regMethod

    constructor(canvas: Canvas) {
        super(canvas)
        Object.assign(this, registeredMethods)
    }

    start() {
        this.ctx.beginPath()
        return this
    }

    end() {
        this.ctx.closePath()
        return this
    }

    /** 清空画布，或按尺寸、中心点、左上角指定要清空的矩形。 */
    clear(...args: (number | string | undefined)[]): this {
        const integer = (value: number | string | undefined) => Number.parseInt(String(value))
        const [first, second, third, fourth] = args
        const { width, height } = this.canvas
        if (args.length < 3) {
            this.ctx.clearRect(0, 0, integer(first) || width, integer(second) || height)
        } else if (args.length === 3) {
            const halfLength = integer(third || 10)
            this.ctx.clearRect(
                clampX(this.canvas, (integer(first) || 0) - halfLength),
                clampY(this.canvas, (integer(second) || 0) - halfLength),
                halfLength * 2,
                halfLength * 2,
            )
        } else {
            this.ctx.clearRect(integer(first) || 0, integer(second) || 0, integer(third) || width, integer(fourth) || height)
        }
        return this
    }

    stroke(border?: number, color?: string) {
        this
            .css('border', [border, color])
            .ctx.stroke()

        return this
    }

    fill(bgColor?: string) {
        this
            .css({ bgColor })
            .ctx.fill()

        return this

    }

    to(x: number, y: number, smooth: boolean | number[] | string = false, method = 'move') {
        x = clampX(this.canvas, x)
        y = clampY(this.canvas, y)

        if (typeof smooth === 'string') {
            // 保留 .to(x, y, method) 的旧参数写法。
            method = smooth
            smooth = false
        }
        else if (typeof smooth === 'object' && smooth instanceof Array) {
            // 给出 Bézier 控制点时始终扩展当前路径。
            method = method === 'stroke' ? 'stroke' : 'line'
        }

        switch (method) {
            case 'stroke':
            case 'line':
                if (smooth && smooth instanceof Array) {
                    // 由数组长度判断控制点数量。
                    if (smooth.length > 3) {
                        this.ctx.bezierCurveTo(smooth[0]!, smooth[1]!, smooth[2]!, smooth[3]!, x, y)
                    } else if (smooth.length > 1) {
                        this.ctx.quadraticCurveTo(smooth[0]!, smooth[1]!, x, y)
                    }
                }
                else this.ctx.lineTo(x, y)

                if (method === 'stroke') this.stroke()
                break

            default:
                this.ctx.moveTo(x, y)
        }
        return this
    }

    line(x1: number, y1: number, x2: number, y2: number, smooth: boolean | number[] = false, stroke: boolean | LineCallback = false, beforeClose?: LineCallback) {
        x1 = clampX(this.canvas, x1)
        y1 = clampY(this.canvas, y1)
        x2 = clampX(this.canvas, x2)
        y2 = clampY(this.canvas, y2)

        // 端点之后的第三个实参为布尔值时，沿用旧接口的描边选项。
        if (smooth === true) {
            if (typeof stroke === 'function') beforeClose = stroke
            smooth = false
            stroke = true
        }

        this.start()
            .to(x1, y1)
            .to(x2, y2, smooth, stroke ? 'stroke' : 'line')
        if (typeof beforeClose === 'function') beforeClose(this.to, this.line)
        return this.end()
    }

    rect(x: number, y: number, width: number, height: number, borderRadius = 0, method = 'none') {
        this.start()
        if (borderRadius) {
            this.to(x + borderRadius, y)
                .to(x + width - borderRadius, y, 'line')
                .to(x + width, y + borderRadius, [x + width, y])
                .to(x + width, y + height - borderRadius, 'line')
                .to(x + width - borderRadius, y + height, [x + width, y + height])
                .to(x + borderRadius, y + height, 'line', 'line')
                .to(x, y + height - borderRadius, [x, y + height])
                .to(x, y + borderRadius, 'line')
                .to(x + borderRadius, y, [x, y])
        }
        else {
            this.ctx.rect(x, y, width, height)
        }
        switch (method) {
            case 'fill':
                this.ctx.fill()
                break

            case 'stroke':
                this.ctx.stroke()
                break

            case 'both':
                this.ctx.stroke()
                this.ctx.fill()
                break
        }
        return this.end()
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false) {
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
        return this
    }

    circle(x: number, y: number, radius = 10) {
        return this.arc(x, y, radius, 0, 2 * Math.PI)
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation = 0, startAngle = 0, endAngle = 2 * Math.PI, counterclockwise = false) {
        if (this.ctx.ellipse) {
            this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
        }
        else if (radiusX === radiusY) {
            this.arc(x, y, radiusX, startAngle + rotation, endAngle + rotation, counterclockwise)
        }
        else {
            // 沿较大的半径按约每像素一次取样，供缺少原生方法时近似绘制。
            const step = 1 / Math.max(radiusX, radiusY)

            const dAngle = endAngle - startAngle

            if (dAngle) {
                if (Math.abs(dAngle) >= 2 * Math.PI) {
                    // 如果角差大于2 * Math.PI(即360°), 则不用考虑实际起始位置, 和旋转方向,反正是一个完整的椭圆
                    drawEllipse.call(this, x, y, radiusX, radiusY, endAngle, endAngle + 2 * Math.PI, step)
                } else {
                    if (counterclockwise) {
                        // 逆时针, 需要终止角小于起始角
                        if (dAngle > 0) {
                            endAngle -= 2 * Math.PI
                        }
                        drawEllipse.call(this, x, y, radiusX, radiusY, startAngle, endAngle, -step)
                    }
                    else {
                        // 顺时针, 需要终止角大于起始角
                        if (dAngle < 0) {
                            endAngle += 2 * Math.PI
                        }
                        drawEllipse.call(this, x, y, radiusX, radiusY, startAngle, endAngle, step)
                    }
                }
            }
        }
        return this
    }

    square(x: number, y: number, radius = 10, borderRadius = 0) {
        this.rect(
            clampX(this.canvas, (x || 0) - radius || 10),
            clampX(this.canvas, (y || 0) - radius || 10),
            (radius || 10) * 2,
            (radius || 10) * 2,
            borderRadius
        )
    }
}
