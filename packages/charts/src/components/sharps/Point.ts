/*! Ported from TangramJS painter/Charts/components/sharps/Point.js. */
import { ChartElement } from '../Abstract.js'

export class Point extends ChartElement {
    declare display: any
    declare strictHover: any
    declare type: any
    declare radius: any
    declare globalAlpha: any
    draw() {
            if (this.display) {
                var ctx = this.ctx;
                ctx.beginPath();

                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.closePath();

                ctx.globalAlpha = this.globalAlpha;
                ctx.fillStyle = this.fillColor;
                ctx.fill();
                ctx.globalAlpha = 1;

                if (this.strokeWidth > 0) {
                    ctx.strokeStyle = this.strokeColor;
                    ctx.lineWidth = this.strokeWidth;
                    ctx.stroke();
                }
            }
        }
    inRange(X, Y, strictHover) {
            if (strictHover) {
                var hitDetectionRange = this.hitDetectionRadius + this.radius;
                return ((Math.pow(X - this.x, 2) + Math.pow(Y - this.y, 2)) < Math.pow(hitDetectionRange, 2));
            } else {
                switch (this.type) {
                    case 0:
                        var hitDetectionRange = this.hitDetectionRadius + this.radius;
                        return (Math.pow(X - this.x, 2) < Math.pow(hitDetectionRange, 2));
                        break;
                    case 1:
                        var hitDetectionRange = this.hitDetectionRadius + this.radius;
                        return (Math.pow(Y - this.y, 2) < Math.pow(hitDetectionRange, 2));
                        break;
                    default:
                        var hitDetectionRange = this.hitDetectionRadius + this.radius;
                        return ((Math.pow(X - this.x, 2) + Math.pow(Y - this.y, 2)) < Math.pow(hitDetectionRange, 2));
                }
            }
        }
}

Object.assign(Point.prototype, {
    display: true,
    strictHover: false,
    type: 0,
    radius: 5,
    globalAlpha: 1
})
