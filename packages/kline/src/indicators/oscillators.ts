import type { DataProvider } from '../DataProvider.js'
import { HighExpression, LowExpression, NewExpression } from '../expressions/DataExpression.js'
import { ConstExpression, Expression } from '../expressions/Expression.js'
import { EmaExpression, HhvExpression, LlvExpression, SmaExpression } from '../expressions/IndicatorExpression.js'
import { AbsExpression, MaxExpression, MulExpression, SubExpression } from '../expressions/math.js'
import { OperationExpression } from '../expressions/OperationExpression.js'
import type { BinaryOperands } from '../expressions/OperationExpression.js'
import { Indicator } from './Indicator.js'
import { CachedExpression } from './price.js'

class PercentExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        const numerator = this.expressions[0].execute(index)
        const denominator = this.expressions[1].execute(index)
        return denominator === 0 ? 0 : 100 * numerator / denominator
    }
}

export class MACDIndicator extends Indicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        const dif = new CachedExpression(provider, 'DIF', new SubExpression(
            new EmaExpression(price, price, new ConstExpression(12)),
            new EmaExpression(price, price, new ConstExpression(26)),
        ))
        const dea = new CachedExpression(provider, 'DEA', new EmaExpression(price, dif, new ConstExpression(9)))
        super([
            { name: 'DIF', expression: dif },
            { name: 'DEA', expression: dea },
            { name: 'MACD', expression: new MulExpression(new ConstExpression(2), new SubExpression(dif, dea)), histogram: true },
        ])
    }
}

export class KDJIndicator extends Indicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        const high = new HighExpression(provider)
        const low = new LowExpression(provider)
        const window = new ConstExpression(9)
        const hhv = new CachedExpression(provider, 'HHV', new HhvExpression(high, high, window))
        const llv = new CachedExpression(provider, 'LLV', new LlvExpression(low, low, window))
        const rsv = new PercentExpression(new SubExpression(price, llv), new SubExpression(hhv, llv))
        const period = new ConstExpression(3)
        const mult = new ConstExpression(1)
        const k = new CachedExpression(provider, 'K', new SmaExpression(price, rsv, period, mult))
        const d = new CachedExpression(provider, 'D', new SmaExpression(price, k, period, mult))
        super([
            { name: 'K', expression: k },
            { name: 'D', expression: d },
            { name: 'J', expression: new SubExpression(new MulExpression(new ConstExpression(3), k), new MulExpression(new ConstExpression(2), d)) },
        ])
    }
}

class PriceChange extends Expression {
    constructor(private readonly close: NewExpression) {
        super()
    }

    execute(index: number): number {
        return index === 0 ? 0 : this.close.execute(index) - this.close.execute(index - 1)
    }
}

export class RSIIndicator extends Indicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        const change = new PriceChange(price)
        super([6, 12, 24].map(n => ({
            name: 'RSI' + n,
            expression: new PercentExpression(
                new SmaExpression(price, new MaxExpression(change, new ConstExpression(0)), new ConstExpression(n), new ConstExpression(1)),
                new SmaExpression(price, new AbsExpression(change), new ConstExpression(n), new ConstExpression(1)),
            ),
        })))
    }
}

export class WRIndicator extends Indicator {
    constructor(provider: DataProvider) {
        const price = new NewExpression(provider)
        const high = new HighExpression(provider)
        const low = new LowExpression(provider)
        super([10, 6].map(n => {
            const window = new ConstExpression(n)
            const hhv = new CachedExpression(provider, 'HHV', new HhvExpression(high, high, window))
            const llv = new LlvExpression(low, low, window)
            return {
                name: 'WR' + n,
                expression: new PercentExpression(new SubExpression(hhv, price), new SubExpression(hhv, llv)),
            }
        }))
    }
}
