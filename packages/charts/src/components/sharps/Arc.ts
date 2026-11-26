/*! Ported from TangramJS painter/Charts/components/sharps/Arc.js. */

/* 管理饼图扇区的角度、内外半径和绘制状态，同一几何用于指针命中判断。 */

import { ChartElement } from '../Abstract.js'
import * as helpers from '../../util/helpers.js'

export class Arc extends ChartElement {
    declare x: number
    declare y: number
    inRange(chartX: number, chartY: number) {
            var pointRelativePosition = helpers.getAngleFromPoint(this, {
                x: chartX,
                y: chartY
            });

            // 将扇区角度归一到一周内。
            var pointRelativeAngle = pointRelativePosition.angle % (Math.PI * 2),
                startAngle = (Math.PI * 2 + this.startAngle) % (Math.PI * 2),
                endAngle = (Math.PI * 2 + this.endAngle) % (Math.PI * 2) || 360;

            // 检查指针角度是否落在扇区起止角之间。
            var betweenAngles = (endAngle < startAngle) ? pointRelativeAngle <= endAngle || pointRelativeAngle >= startAngle : pointRelativeAngle >= startAngle && pointRelativeAngle <= endAngle;

            // 跨过一周边界的扇区按首尾两个区间判断。
            var withinRadius = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

            return (betweenAngles && withinRadius);
            // 径向距离须介于内外半径之间。
        }
    tooltipPosition() {
            var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
                rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
            return {
                x: this.x + (Math.cos(centreAngle) * rangeFromCentre),
                y: this.y + (Math.sin(centreAngle) * rangeFromCentre)
            };
        }
    draw(animationPercent?: number) {
            var easingDecimal = animationPercent || 1;

            var ctx = this.ctx;

            ctx.beginPath();

            ctx.arc(this.x, this.y, this.outerRadius < 0 ? 0 : this.outerRadius, this.startAngle, this.endAngle);

            ctx.arc(this.x, this.y, this.innerRadius < 0 ? 0 : this.innerRadius, this.endAngle, this.startAngle, true);

            ctx.closePath();
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            ctx.fillStyle = this.fillColor;

            ctx.fill();
            ctx.lineJoin = 'bevel';

            if (this.showStroke) {
                ctx.stroke();
            }
        }
}
