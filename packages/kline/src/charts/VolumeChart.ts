import { Chart } from './Chart.js'

export class VolumeChart extends Chart {
    readonly kind = 'volume'
    get name(): string {
        return 'Volume'
    }
}
