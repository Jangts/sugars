// TangramJS util/type.js:110
import IntExpr from './internal/intExpr.js'

export default function isIntStr(string) {
    return IntExpr.test(string)
}
