import type { DataProvider } from '../DataProvider.js'
import type { Expression } from '../expressions/Expression.js'

export interface IndicatorSeries {
    readonly name: string
    readonly expression: Expression
    readonly histogram?: boolean
}

export interface IndicatorValues {
    readonly name: string
    readonly values: number[]
    readonly histogram?: boolean
}

export class Indicator {
    constructor(readonly outputs: readonly IndicatorSeries[]) {}

    calculate(provider: DataProvider): IndicatorValues[] {
        const count = provider.storage.length
        const outputs = this.outputs.map(({ name, histogram, expression }) => ({
            expression,
            series: { name, histogram, values: new Array<number>(count) },
        }))
        // A graph can share moving windows between outputs. Reserve each node once.
        for (const { expression } of outputs) expression.reserve(1, count)
        for (let index = 0; index < count; index++) {
            for (const { expression, series } of outputs) series.values[index] = expression.execute(index)
        }
        return outputs.map(({ series }) => series)
    }
}
