import type { DataProvider } from '../DataProvider.js'
import { NewExpression } from '../expressions/DataExpression.js'
import { ConstExpression } from '../expressions/Expression.js'
import { EmaExpression, MaExpression, SmaExpression, StdExpression } from '../expressions/IndicatorExpression.js'
import { AddExpression, MulExpression, SubExpression } from '../expressions/math.js'
import { AssignExpression } from '../expressions/OperationExpression.js'
import { CandlestickIndicator } from './base.js'

export class MAIndicator extends CandlestickIndicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        super([7, 30].map(n => ({ name: 'MA' + n, expression: new MaExpression(price, price, new ConstExpression(n)) })))
    }
}

export class SMAIndicator extends CandlestickIndicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        super([7, 30].map(n => ({ name: 'SMA' + n, expression: new SmaExpression(price, price, new ConstExpression(n), new ConstExpression(1)) })))
    }
}

export class EMAIndicator extends CandlestickIndicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        super([7, 30].map(n => ({ name: 'EMA' + n, expression: new EmaExpression(price, price, new ConstExpression(n)) })))
    }
}

export class BOLLIndicator extends CandlestickIndicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        const period = new ConstExpression(20)
        const mid = new CachedExpression(provider, 'BOLL', new MaExpression(price, price, period))
        const width = new CachedExpression(provider, 'WIDTH', new MulExpression(
            new ConstExpression(2), new StdExpression(price, price, period),
        ))
        super([
            { name: 'BOLL', expression: mid },
            { name: 'UB', expression: new AddExpression(mid, width) },
            { name: 'LB', expression: new SubExpression(mid, width) },
        ])
    }
}

// Preserve the old assign/output buffering so a shared expression updates once per bar.
export class CachedExpression extends AssignExpression {
    private assigned = -1

    execute(index: number): number {
        if (index !== this.assigned) {
            this.assign(index)
            this.assigned = index
        }
        return super.execute(index)
    }
}
