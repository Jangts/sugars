// TangramJS util/type.js:151

/**
 * 直接提取原生对象标签中的类型名称。
 *
 * @param obj - 待识别的值。
 * @returns 原生对象标签去掉 object 前缀和方括号后的文本。
 */
export default function fasttype(obj: unknown) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '');
}
