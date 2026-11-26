/* 将基础算术组织为可组合的表达式节点，供指标公式复用。 */

import { OperationExpression } from './OperationExpression.js'
import type { BinaryOperands, UnaryOperands } from './OperationExpression.js'

export class NegExpression extends OperationExpression<UnaryOperands> {
    execute(index: number): number {
        return -(this.expressions[0].execute(index))
    }
}

export class AbsExpression extends OperationExpression<UnaryOperands> {
    execute(index: number): number {
        return Math.abs(this.expressions[0].execute(index))
    }
}

export class AddExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) + this.expressions[1].execute(index)
    }
}

export class SubExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) - this.expressions[1].execute(index)
    }
}

export class MulExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) * this.expressions[1].execute(index)
    }
}

export class DivExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        const a = this.expressions[0].execute(index)
        const b = this.expressions[1].execute(index)
        if (a === 0)
            return a
        if (b === 0)
            return (a > 0) ? 1000000 : -1000000
        return a / b
    }
}

export class MaxExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return Math.max(this.expressions[0].execute(index), this.expressions[1].execute(index))
    }
}
