// TangramJS obj/obj.js:127
import toQueryString from './toQueryString.js'

/**
 * 沿用 toQueryString 的编码规则，变量名和值之间用等号连接。
 *
 * @param data - 提供可枚举键值的对象，缺省时按空对象处理。
 * @returns 用 & 拼接的键值对字符串。
 */
export default function encodeQueryString(data?: object | null) {
    return toQueryString(data)
}
