/* 在给定行情索引读取原始数据字段，为指标的组合表达式提供输入。 */

import type { DataProvider } from '../DataProvider.js'
import { Expression } from './Expression.js'

export class DataExpression extends Expression {
    provider: DataProvider
    constructor(dataProvider: DataProvider) {
        super()
        this.provider = dataProvider
    }
}

export class OpenExpression extends DataExpression {
    execute(index: number): number {
        return this.provider.getDataAt(index)?.o ?? NaN
    }
}

export class HighExpression extends DataExpression {
    execute(index: number): number {
        return this.provider.getDataAt(index)?.h ?? NaN
    }
}

export class LowExpression extends DataExpression {
    execute(index: number): number {
        return this.provider.getDataAt(index)?.l ?? NaN
    }
}

export class NewExpression extends DataExpression {
    execute(index: number): number {
        return this.provider.getDataAt(index)?.n ?? NaN
    }
}

export class VolumeExpression extends DataExpression {
    execute(index: number): number {
        return this.provider.getDataAt(index)?.v ?? NaN
    }
}
