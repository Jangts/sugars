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
