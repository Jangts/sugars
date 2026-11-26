// TangramJS util/type.js:110
import IntExpr from './internal/intExpr.js'

export default function isIntStr(string: unknown) {
    return IntExpr.test(string as string)
}
