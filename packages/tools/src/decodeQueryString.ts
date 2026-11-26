// TangramJS obj/obj.js:130
import writeValue from './internal/writeValue.js'

/**
 * 按旧规则剥掉开头的问号或井号并拆分键值，百分号转义保留在结果里。
 *
 * @param str - 可带单个前导问号或井号的查询字符串。
 * @returns 按 & 和等号拆出的字段，同名字段保留最后一项，值不做百分号解码。
 */
export default function decodeQueryString(str: string) {
    str = str.replace(/^(#|\?)/, '');
    var data = {};
    var fields = str.split('&');
    var i = 0,
        filed;
    for (i; i < fields.length; i++) {
        filed = fields[i]!.split('=');
        writeValue(data, filed[0]!, filed[1]);
    }
    return data;
}
