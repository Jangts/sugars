// TangramJS str/str.js:76

/**
 * 按正则单词边界查找片段，片段里的正则元字符保留原语义。
 *
 * @param strs - 要搜索的文本。
 * @param str - 置于单词边界之间的模式片段。
 * @returns 是否存在该匹配。
 * @throws {SyntaxError} 模式片段导致正则语法错误。
 */
export default function hasString(strs: string, str: string) {
    return RegExp("\\b" + str + "\\b").test(strs);
}
