// TangramJS util/bool.js:91

/**
 * 检查带百分号的有符号整数或小数文本。
 *
 * @param str - 待验证的文本。
 * @returns 输入为符合旧格式的百分数字符串时为 true。
 */
export default function isPercent(str: unknown) {
    return (typeof str === 'string') && (/^[-\+]{0,1}(\d+(\.\d+){0,1}|\.\d+)\%$/.test(str));
}
