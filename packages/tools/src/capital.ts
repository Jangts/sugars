// TangramJS str/str.js:70

/**
 * 将第一个匹配正则单词字符的字母大写，保留其余内容。
 *
 * @param str - 待处理文本。
 * @returns 第一个匹配位置已执行大写转换的文本。
 */
export default function capital(str: string) {
    return str.replace(/(\w)/, function(v) { return v.toUpperCase() });
}
