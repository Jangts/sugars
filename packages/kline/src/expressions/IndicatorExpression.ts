/* 实现依赖历史行情的滚动与递推表达式，负责各节点的缓存与重置。 */

import type { DataProvider } from '../DataProvider.js'
import type { Expression } from './Expression.js'
import { DataExpression } from './DataExpression.js'
import { OperationExpression } from './OperationExpression.js'

interface WindowSample {
    resultA: number
    result: number
}

interface DeviationSample {
    resultMA: number
}

interface SarSample {
    longPos: boolean
    sar: number
    ep: number
    af: number
}

function bufferAt<T>(buffer: readonly T[], index: number): T {
    const value = buffer[index]
    if (value === undefined) throw new RangeError(`Indicator buffer has no sample at index ${index}`)
    return value
}

type WindowOperands = [Expression, Expression]

export class IndicatorExpression<Operands extends [Expression, Expression, ...Expression[]] = WindowOperands>
    extends OperationExpression<Operands> {
    range: number = -1
    buf: WindowSample[] = []
    data: DataExpression

    constructor(dataExpression: DataExpression, ...expressions: Operands) {
        super(...expressions)
        this.data = dataExpression
    }

    getRange(): number {
        return this.range
    }

    initRange(): void {
        this.range = this.expressions[1].execute(0)
    }

    execute(index: number): number {
        if (this.range < 0) {
            this.initRange()
        }
        const sample = bufferAt(this.buf, index)
        sample.resultA = this.expressions[0].execute(index)
        sample.result = this.calcResult(index, sample.resultA)
        return sample.result
    }

    reserve(rid: number, count: number): void {
        if (this.rid < rid) {
            for (let c = count; c > 0; c--) {
                this.buf.push({ resultA: NaN, result: NaN })
            }
        }
        super.reserve(rid, count)
    }

    clear(): void {
        super.clear()
        this.range = -1
        this.buf = []
    }

    calcResult(_index: number, _resultA: number): number { return 0 }
}

export class HhvExpression extends IndicatorExpression {
    calcResult(index: number, resultA: number): number {
        if (this.range === 0) {
            return NaN
        }
        const first = this.data.provider.firstIndex
        if (first < 0) {
            return resultA
        }
        if (index > first) {
            let n = this.range
            let result = resultA
            const start = index - n + 1
            let i = Math.max(first, start)
            for (; i < index; i++) {
                const p = bufferAt(this.buf, i)
                if (result < p.resultA) {
                    result = p.resultA
                }
            }
            return result
        } else {
            return resultA
        }
    }
}

export class LlvExpression extends IndicatorExpression {
    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            let n = this.range
            let result = resultA
            const start = index - n + 1
            let i = Math.max(first, start)
            for (; i < index; i++) {
                const p = bufferAt(this.buf, i)
                if (result > p.resultA)
                    result = p.resultA
            }
            return result
        } else {
            return resultA
        }
    }
}

export class CountExpression extends IndicatorExpression {
    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        const first = this.data.provider.firstIndex
        if (first < 0)
            return 0
        if (index >= first) {
            let n = this.range - 1
            if (n > index - first)
                n = index - first
            let count = 0
            for (; n >= 0; n--) {
                if (bufferAt(this.buf, index - n).resultA !== 0.0)
                    count++
            }
            return count
        } else {
            return 0
        }
    }
}

export class SumExpression extends IndicatorExpression {
    calcResult(index: number, resultA: number): number {
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            let n = this.range
            if (n === 0 || n >= index + 1 - first) {
                return bufferAt(this.buf, index - 1).result + resultA
            }
            return bufferAt(this.buf, index - 1).result + resultA - bufferAt(this.buf, index - n).resultA
        } else {
            return resultA
        }
    }
}

export class StdExpression extends IndicatorExpression {
    stdBuf: DeviationSample[] = []

    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        let stdData = bufferAt(this.stdBuf, index)
        const first = this.data.provider.firstIndex
        if (first < 0) {
            stdData.resultMA = resultA
            return 0.0
        }
        if (index > first) {
            let n = this.range
            if (n >= index + 1 - first) {
                n = index + 1 - first
                stdData.resultMA = bufferAt(this.stdBuf, index - 1).resultMA * (1.0 - 1.0 / n) + (resultA / n)
            } else {
                stdData.resultMA = bufferAt(this.stdBuf, index - 1).resultMA + (resultA - bufferAt(this.buf, index - n).resultA) / n
            }
            let sum = 0
            for (let i = index - n + 1; i <= index; i++)
                sum += Math.pow(bufferAt(this.buf, i).resultA - stdData.resultMA, 2)
            return Math.sqrt(sum / n)
        }
        stdData.resultMA = resultA
        return 0.0
    }

    reserve(rid: number, count: number): void {
        if (this.rid < rid) {
            for (let c = count; c > 0; c--)
                this.stdBuf.push({ resultMA: NaN })
        }
        super.reserve(rid, count)
    }

    clear(): void {
        super.clear()
        this.stdBuf = []
    }
}

export class MaExpression extends IndicatorExpression {
    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            let n = this.range
            if (n >= index + 1 - first) {
                n = index + 1 - first
                return bufferAt(this.buf, index - 1).result * (1.0 - 1.0 / n) + (resultA / n)
            }
            return bufferAt(this.buf, index - 1).result + (resultA - bufferAt(this.buf, index - n).resultA) / n
        } else {
            return resultA
        }
    }
}

export class EmaExpression extends IndicatorExpression {
    alpha = NaN

    initRange(): void {
        super.initRange()
        this.alpha = 2.0 / (this.range + 1)
    }

    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            const prev = bufferAt(this.buf, index - 1)
            return this.alpha * (resultA - prev.result) + prev.result
        }
        return resultA
    }
}

export class ExpmemaExpression extends EmaExpression {
    calcResult(index: number, resultA: number): number {
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            let n = this.range
            const prev = bufferAt(this.buf, index - 1)
            if (n >= index + 1 - first) {
                n = index + 1 - first
                return prev.result * (1.0 - 1.0 / n) + (resultA / n)
            }
            return this.alpha * (resultA - prev.result) + prev.result
        }
        return resultA
    }
}

export class SmaExpression extends IndicatorExpression<[Expression, Expression, Expression]> {
    mul: number = 0

    initRange(): void {
        super.initRange()
        this.mul = this.expressions[2].execute(0)
    }

    calcResult(index: number, resultA: number): number {
        if (this.range === 0)
            return NaN
        const first = this.data.provider.firstIndex
        if (first < 0)
            return resultA
        if (index > first) {
            let n = this.range
            if (n > index + 1 - first)
                n = index + 1 - first
            return ((n - 1) * bufferAt(this.buf, index - 1).result + resultA * this.mul) / n
        }
        return resultA
    }
}

type SarOperands = [Expression, Expression, Expression, Expression]

export class SarExpression extends OperationExpression<SarOperands> {
    buf: SarSample[] = []
    range: number = -1
    min: number = 0
    step: number = 0
    max: number = 0
    data: DataExpression

    constructor(dataExpression: DataExpression, ...expressions: SarOperands) {
        super(...expressions)
        this.data = dataExpression
    }

    execute(index: number): number {
        if (this.range < 0) {
            this.range = this.expressions[0].execute(0)
            this.min = this.expressions[1].execute(0) / 100.0
            this.step = this.expressions[2].execute(0) / 100.0
            this.max = this.expressions[3].execute(0) / 100.0
        }
        const data = bufferAt(this.buf, index)
        const provider = this.data.provider
        const first = provider.firstIndex

        const bar = provider.getDataAt(index)
        if (!bar) return NaN

        if (index <= first) {
            data.longPos = true
            data.sar = bar.l
            data.ep = bar.h
            data.af = 0.02
        } else {
            let high = bar.h
            let low = bar.l
            const prev = bufferAt(this.buf, index - 1)
            data.sar = prev.sar + prev.af * (prev.ep - prev.sar)
            if (prev.longPos) {
                data.longPos = true
                if (high > prev.ep) {
                    data.ep = high
                    data.af = Math.min(prev.af + this.step, this.max)
                } else {
                    data.ep = prev.ep
                    data.af = prev.af
                }
                if (data.sar > low) {
                    data.longPos = false
                    let i = index - this.range + 1
                    for (i = Math.max(i, first); i < index; i++) {
                        let h = provider.getDataAt(i)?.h ?? high
                        if (high < h) high = h
                    }
                    data.sar = high
                    data.ep = low
                    data.af = 0.02
                }
            } else {
                data.longPos = false
                if (low < prev.ep) {
                    data.ep = low
                    data.af = Math.min(prev.af + this.step, this.max)
                } else {
                    data.ep = prev.ep
                    data.af = prev.af
                }
                if (data.sar < high) {
                    data.longPos = true
                    let i = index - this.range + 1
                    for (i = Math.max(i, first); i < index; i++) {
                        let l = provider.getDataAt(i)?.l ?? low
                        if (low > l) low = l
                    }
                    data.sar = low
                    data.ep = high
                    data.af = 0.02
                }
            }
        }
        return data.sar
    }

    reserve(rid: number, count: number): void {
        if (this.rid < rid) {
            for (let c = count; c > 0; c--)
                this.buf.push({ longPos: true, sar: NaN, ep: NaN, af: NaN })
        }
        super.reserve(rid, count)
    }

    clear(): void {
        super.clear()
        this.range = -1
    }
}
