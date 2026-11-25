import { BasePainter } from './BasePainter.js'

function lineLength(x: number, y: number): number {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

export class Painter extends BasePainter {
    point(x: number, y: number, radius = 10, bgColor?: string, opacity = 1) {
        return this
            .start()
            .css({ bgColor, opacity })
            .circle(x, y, radius)
            .end()
            .fill()
    }

    strokeTo(x: number, y: number, smooth: boolean | number[] | string = false, border?: number, color?: string, opacity = 1) {
        return this
            .css({ opacity })
            .to(x, y, smooth, 'line')
            .stroke(border, color)
    }

    fillRect(x: number, y: number, width: number, height: number, radius = 0, bgColor?: string, opacity = 1) {
        return this
            .css({ opacity, bgColor })
            .rect(x, y, width, height, radius, 'fill')
    }

    dashLine(x1: number, y1: number, x2: number, y2: number, dashLength: number | number[] = 5, opacity = 1) {
        const deltaX = x2 - x1
        const deltaY = y2 - y1
        const length = lineLength(deltaX, deltaY)
        let steps: number
        let lineX: number
        let lineY: number
        let groupX: number
        let groupY: number

        if (Array.isArray(dashLength)) {
            const [dash = NaN, gap = NaN] = dashLength
            steps = Math.floor(length / (dash + gap))
            const lineSteps = Math.floor(length / dash)
            lineX = deltaX / lineSteps
            lineY = deltaY / lineSteps
            groupX = deltaX / steps
            groupY = deltaY / steps
        } else {
            steps = Math.floor(length / dashLength / 2)
            groupX = deltaX / steps
            groupY = deltaY / steps
            lineX = groupX / 2
            lineY = groupY / 2
        }

        this.css({ opacity }).start()
        for (let i = 0; i < steps; i++) {
            this.to(x1 + groupX * i, y1 + groupY * i).to(x1 + groupX * i + lineX, y1 + groupY * i + lineY, 'line')
        }
        return this.stroke().end()
    }

    dashRect(x: number, y: number, width: number, height: number, step = 20, opacity = 1) {
        const halfPerimeter = width + height
        const halfStep = step / 2
        const horizontalStep = Math.round(halfStep * width / halfPerimeter)
        const verticalStep = Math.round(halfStep * height / halfPerimeter)

        return this
            .css({ opacity })
            .dashLine(x, y, x + width, y, width / horizontalStep)
            .dashLine(x + width, y, x + width, y + height, height / verticalStep)
            .dashLine(x + width, y + height, x, y + height, width / horizontalStep)
            .dashLine(x, y + height, x, y, height / verticalStep)
    }
}
