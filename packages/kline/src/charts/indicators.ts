import { MACDIndicator, KDJIndicator, RSIIndicator, WRIndicator } from '../indicators/index.js'
import { Chart } from './Chart.js'

export class MACDChart extends Chart {
    readonly kind = 'indicator'
    readonly indicator = MACDIndicator
    get name(): string {
        return 'MACD'
    }
}

export class KDJChart extends Chart {
    readonly kind = 'indicator'
    readonly indicator = KDJIndicator
    get name(): string {
        return 'KDJ'
    }
}

export class RSIChart extends Chart {
    readonly kind = 'indicator'
    readonly indicator = RSIIndicator
    get name(): string {
        return 'RSI'
    }
}

export class WRChart extends Chart {
    readonly kind = 'indicator'
    readonly indicator = WRIndicator
    get name(): string {
        return 'WR'
    }
}
