// TangramJS util/type.js:110
import IntExpr from './internal/intExpr.js'

/**
 * 通过统一的整数文本模式检查输入，保留正则原生的值转换规则。
 *
 * @param string - 按正则规则转换成文本的输入。
 * @returns 是否只含可选符号和数字。
 */
export default function isIntStr(string: unknown) {
    return IntExpr.test(string as string)
}
