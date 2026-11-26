/* 汇总数据读取、算术、条件和滚动计算节点，供指标组合使用。 */

import * as base from './Expression.js'
import * as data from './DataExpression.js'
import * as op from './OperationExpression.js'
import * as math from './math.js'
import * as logical from './logical.js'
import * as indicators from './IndicatorExpression.js'

export const expressions = {
    ...base,
    ...data,
    ...op,
    ...math,
    ...logical,
    ...indicators
}
