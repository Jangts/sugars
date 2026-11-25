import { MAIndicator, SMAIndicator, EMAIndicator, BOLLIndicator } from '../indicators/index.js'
import { Chart } from './Chart.js'

export class MAChart extends Chart {
    readonly kind = 'price'
    readonly indicator = MAIndicator
    get name(): string {
        return 'MA'
    }
}

export class SMAChart extends Chart {
    readonly kind = 'price'
    readonly indicator = SMAIndicator
    get name(): string {
        return 'SMA'
    }
}

export class EMAChart extends Chart {
    readonly kind = 'price'
    readonly indicator = EMAIndicator
    get name(): string {
        return 'EMA'
    }
}

export class BOLLChart extends Chart {
    readonly kind = 'price'
    readonly indicator = BOLLIndicator
    get name(): string {
        return 'BOLL'
    }
}
