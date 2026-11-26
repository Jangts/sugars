/* 将成交量作为独立区域绘制，按当前可见的数据计算成交量刻度。 */

import { Chart } from './Chart.js'

export class VolumeChart extends Chart {
    readonly kind = 'volume'
    get name(): string {
        return 'Volume'
    }
}
