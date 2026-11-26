// TangramJS str/str.js:123
import base64Alphabet from './internal/base64Alphabet.js'
import utf8Decode from './internal/utf8Decode.js'

/**
 * 先按 Base64 字母表还原字节，再按历史 UTF-8 编码规则还原字符串。
 *
 * @param input - 待解码文本。非字符串按空字符串处理，其他字符按旧算法过滤。
 * @returns 使用历史字节编码还原出的文本。
 */
export default function base64Decode(input: unknown) {
    let text = typeof input === 'string' ? input : '';
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    text = text.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < text.length) {
        enc1 = base64Alphabet.indexOf(text.charAt(i++));
        enc2 = base64Alphabet.indexOf(text.charAt(i++));
        enc3 = base64Alphabet.indexOf(text.charAt(i++));
        enc4 = base64Alphabet.indexOf(text.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
    }
    output = utf8Decode(output);
    return output;
}
