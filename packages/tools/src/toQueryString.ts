// TangramJS obj/obj.js:111

/**
 * 枚举对象字段拼接查询字符串，编码字段值并保留原字段名写法。
 *
 *
 * @param obj - 按 for…in 枚举的来源，缺省按空对象处理。
 * @returns 仅转义值的查询字符串。
 * @throws {URIError} 字符串值含无法进行 URI 编码的代理项。
 */
export default function toQueryString(obj?: object | null) {
    obj = obj || {};
    var fields = []
    for (var i in obj) {
        fields.push(i + "=" + encodeURIComponent((obj as Record<string, string>)[i]!));
    }
    return fields.join("&");
}
