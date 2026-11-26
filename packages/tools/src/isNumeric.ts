// TangramJS util/bool.js:107
import isIntStr from './isIntStr.js'
import isFloatStr from './isFloatStr.js'

/**
 * 接受数字类型及通过旧整数、小数文本检查的字符串。
 *
 * @param num - 数字值或待按旧数值文本规则检查的输入。
 * @returns 数字值或符合所支持文本模式时为 true。
 */
export default function isNumeric(num: unknown) {
    return typeof num === 'number' || isIntStr(num) || isFloatStr(num);
}
