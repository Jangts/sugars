/* 以表达式节点实现比较和条件选取，运算和取样都沿用当前行情索引。 */

import { OperationExpression } from './OperationExpression.js'
import type { BinaryOperands } from './OperationExpression.js'

export class GtExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) > this.expressions[1].execute(index) ? 1 : 0
    }
}

export class GeExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) >= this.expressions[1].execute(index) ? 1 : 0
    }
}

export class LtExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) < this.expressions[1].execute(index) ? 1 : 0
    }
}

export class LeExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) <= this.expressions[1].execute(index) ? 1 : 0
    }
}

export class EqExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return this.expressions[0].execute(index) === this.expressions[1].execute(index) ? 1 : 0
    }
}

export class AndExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return (this.expressions[0].execute(index) !== 0) && (this.expressions[1].execute(index) !== 0) ? 1 : 0
    }
}

export class OrExpression extends OperationExpression<BinaryOperands> {
    execute(index: number): number {
        return (this.expressions[0].execute(index) !== 0) || (this.expressions[1].execute(index) !== 0) ? 1 : 0
    }
}
