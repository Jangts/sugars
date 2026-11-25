import type { DataProvider } from '../DataProvider.js'
import { Expression } from './Expression.js'
import type { IndicatorExpression } from './IndicatorExpression.js'

interface DrawStyle {
    None: number
    Line: number
    VolumeStick: number
    MACDStick: number
    SARPoint: number
}

export type UnaryOperands = [Expression]
export type BinaryOperands = [Expression, Expression]
type TernaryOperands = [Expression, Expression, Expression]

export class OperationExpression<Operands extends Expression[] = Expression[]> extends Expression {
    expressions: Operands

    constructor(...expressions: Operands) {
        super()
        this.expressions = expressions
    }

    reserve(rid: number, count: number): void {
        if (this.rid < rid) {
            this.rid = rid
            this.expressions.forEach(expression => expression.reserve(rid, count))
        }
    }

    clear(): void {
        this.expressions.forEach(expression => expression.clear())
    }
}

export class RefExpression extends OperationExpression<BinaryOperands> {
    offset?: number

    execute(index: number): number {
        if (this.offset === undefined || this.offset < 0) {
            this.offset = this.expressions[1].execute(index)
            if (this.offset < 0) {
                throw new RangeError('offset < 0')
            }
        }
        index -= this.offset
        if (index < 0) {
            throw new RangeError('index < 0')
        }
        const result = this.expressions[0].execute(index)
        if (isNaN(result)) {
            throw new Error('NaN')
        }
        return result
    }
}

export class IfExpression extends OperationExpression<TernaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) !== 0 ? this.expressions[1].execute(index) : this.expressions[2].execute(index)
    }
}

export class AssignExpression<Value extends Expression = Expression> extends OperationExpression<[Value]> {
    buf: number[] = []
    dataProvider: DataProvider
    name: string

    constructor(dataProvider: DataProvider, name: string, expression: Value) {
        super(expression)
        this.dataProvider = dataProvider
        this.name = name
    }

    getName(): string {
        return this.name
    }

    execute(index: number): number {
        return this.buf[index] ?? NaN
    }

    assign(index: number): void {
        const value = this.expressions[0].execute(index)
        this.buf[index] = value
        const previousValue = this.buf[index - 1] ?? NaN
        if (this.dataProvider.firstIndex >= 0 && Number.isNaN(value) && !Number.isNaN(previousValue)) {
            throw new Error(`${this.name}.assign(${index}): NaN`)
        }
    }

    reserve(rid: number, count: number): void {
        if (this.rid < rid) {
            for (let c = count; c > 0; c--) {
                this.buf.push(NaN)
            }
        }
        super.reserve(rid, count)
    }

    clear(): void {
        super.clear()
        this.buf = []
    }
}

export class GraphExpression<Value extends Expression = Expression> extends AssignExpression<Value> {

    static drawStyle: DrawStyle = {
        None: 0,
        Line: 1,
        VolumeStick: 2,
        MACDStick: 3,
        SARPoint: 4
    }

    style: number
    color: string | undefined

    constructor(dataProvider: DataProvider, name: string, expression: Value, style?: number, color?: string) {
        super(dataProvider, name, expression)
        this.style = (style === undefined) ? GraphExpression.drawStyle.Line : style
        this.color = color
    }

    getStyle(): number {
        return this.style
    }

    getColor(): string | undefined {
        return this.color
    }
}

export class IndicatorGraphExpression extends GraphExpression<IndicatorExpression> {
    getName(): string {
        return this.name + this.expressions[0].getRange()
    }
}
