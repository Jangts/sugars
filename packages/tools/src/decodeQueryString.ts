// TangramJS obj/obj.js:130
import writeValue from './internal/writeValue.js'

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
