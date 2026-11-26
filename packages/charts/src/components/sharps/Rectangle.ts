/*! Ported from TangramJS painter/Charts/components/sharps/Rectangle.js. */

/* 绘制沿横轴或纵轴伸展的柱体，将普通柱与区间柱的起点、终点用于绘制与命中。 */

import { ChartElement } from '../Abstract.js'
import { isFinite } from 'lodash-es'

export class Rectangle extends ChartElement {
    declare type: any
    declare ctx: CanvasRenderingContext2D
    declare radius: any
    declare x1: any
    declare y1: any
    declare x2: any
    declare y2: any
    draw() {
            switch (this.type) {
                case 0:
                case 2:
                    this.drawVertical();
                    break;
                case 1:
                case 3:
                    this.drawHorizontal();
                    break;
            }
        }
    drawVertical() {
            var ctx = this.ctx,
                halfWidth = this.radius,
                leftX = this.x1 - halfWidth,
                rightX = this.x2 + halfWidth,
                startY = this.y1,
                endY = this.y2,
                halfStroke = this.strokeWidth / 2;

            // Canvas 以路径为中心描边。启用描边时收窄可用边界，让描边落在柱宽内。
            if (this.showStroke) {
                leftX += halfStroke;
                rightX -= halfStroke;
                endY = (endY < startY) ? endY + halfStroke : endY - halfStroke;
                if (this.type === 2) {
                    startY = (endY < startY) ? startY - halfStroke : startY + halfStroke;
                }
            }

            //console.log(this.x1, this.y1, this.x2, this.y2);

            ctx.beginPath();

            ctx.fillStyle = this.fillColor;
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            // 旧实现按柱体方向指定哪些边需要描边。
            ctx.moveTo(leftX, startY);
            ctx.lineTo(leftX, endY);
            ctx.lineTo(rightX, endY);
            ctx.lineTo(rightX, startY);
            if (this.type === 2) {
                ctx.lineTo(leftX, startY);
            }
            ctx.fill();
            if (this.showStroke) {
                ctx.stroke();
            }
        }
    drawHorizontal() {
            var ctx = this.ctx,
                halfHeight = this.radius,
                startX = this.x1,
                endX = this.x2,
                topY = this.y1 - halfHeight,
                bottomY = this.y2 + halfHeight,
                halfStroke = this.strokeWidth / 2;

            // Canvas 以路径为中心描边。启用描边时收窄可用边界，让描边落在柱宽内。
            if (this.showStroke) {
                topY += halfStroke;
                bottomY -= halfStroke;
                endX = (endX > startX) ? endX - halfStroke : endX + halfStroke;
                if (this.type === 4) {
                    startX = (endX > startX) ? startX + halfStroke : startX - halfStroke;
                }
            }

            ctx.beginPath();

            ctx.fillStyle = this.fillColor;
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            // 旧实现按柱体方向指定哪些边需要描边。
            ctx.moveTo(startX, topY);
            ctx.lineTo(endX, topY);
            ctx.lineTo(endX, bottomY);
            ctx.lineTo(startX, bottomY);
            if (this.type === 2) {
                ctx.lineTo(startX, topY);
            }
            ctx.fill();
            if (this.showStroke) {
                ctx.stroke();
            }
        }
    hasValue() {
            return isFinite(this.value2);
        }
    inRange(X: number, Y: number) {
            switch (this.type) {
                case 0:
                case 2:
                    return ((X >= (this.x1 - this.radius / 2)) && (X <= (this.x1 + this.radius / 2))) && ((Y >= this.y1 && Y <= this.y2) || (Y <= this.y1 && Y >= this.y2));
                    break;
                case 1:
                case 3:
                    return ((Y >= (this.y1 - this.radius / 2)) && (Y <= (this.y1 + this.radius / 2))) && ((X >= this.x1 && X <= this.x2) || (X <= this.x1 && X >= this.x2));
                    break;
            }


        }
}

Object.assign(Rectangle.prototype, {
    type: 0,
    ctx: undefined,
    radius: 0,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0
})
