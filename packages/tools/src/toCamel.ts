// TangramJS str/str.js:73

/**
 * 将连字符及其后面的单词字符合并成驼峰写法。
 *
 * @param str - 使用连字符分隔的字符串。
 * @returns 将匹配到的连字符及其后字符转换为驼峰形式的字符串。
 */
export default function toCamel(str: string) {
    return str.replace(/(-\w)/, function(v) { return v.replace('-', '').toUpperCase() });
}
