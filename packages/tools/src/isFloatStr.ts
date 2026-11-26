// TangramJS util/type.js:114

/**
 * 按旧模式检查带小数点的数字文本，小数点后至少有一个字符。
 *
 * @param string - 待识别的小数文本。
 * @returns 是否符合历史的小数文本模式。
 * @throws {TypeError} 非字符串若通过正则的字符串转换，仍可能因缺少 split 报错。
 */
export default function isFloatStr(string: unknown) {
    if (/^[-\+]{0,1}[\d\.]+$/.test(string as string)) {
        const parts = (string as string).split('.');
        if (parts.length === 2 && parts[1] != '') {
            return true;
        }
    }
    return false;
}
