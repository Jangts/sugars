/*! Ported from TangramJS painter/Charts/components/Abstract.js. */

/* 管理绘图元素的属性快照。直接更新保留前值供过渡使用，动画按保存值和目标值计算当帧状态。 */

import { eachEntry } from '../series-data.js'
import { clone, isFinite } from 'lodash-es'

export class ChartElement {
    [property: string]: any
    constructor(configuration: object = {}) { this.initializeElement(configuration) }
    protected initializeElement(configuration: object): void {
            Object.assign(this, configuration);
            this.initialize(configuration);
            this.save();
        }
    initialize(_configuration?: object) {}
    restore(props?: readonly string[]) {
            if (!props) {
                Object.assign(this, this._saved);
            } else {
                eachEntry(props, function(index, key) {
                        this[key] = this._saved[key];
                    },
                    this);
            }
            return this;
        }
    save() {
            this._saved = clone(this);
            delete this._saved._saved;
            return this;
        }
    update(newProps: object) {
            eachEntry(newProps, function(key, value) {
                this._saved[key] = this[key];
                this[key] = value;
            }, this);
            return this;
        }
    transition(props: Record<string, number>, ease: number) {
            eachEntry(props, function(key, value) {
                this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
            }, this);
            return this;
        }
    tooltipPosition() {
            return {
                x: this.x,
                y: this.y
            };
        }
    hasValue() {
            return isFinite(this.value);
        }
}

export function shapeWith<T extends ChartElement>(Shape: new (options: object) => T, defaults: object) {
    return class ConfiguredShape extends (Shape as new (options: object) => ChartElement) {
        constructor(configuration: object) {
            super({ ...defaults, ...configuration })
        }
    } as unknown as new (configuration: object) => T
}
