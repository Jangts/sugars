// TangramJS str/str.js:123
import base64Alphabet from './internal/base64Alphabet.js'
import utf8Decode from './internal/utf8Decode.js'

export default function base64Decode(input) {
    input = typeof input === 'string' ? input : '';
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
        enc1 = base64Alphabet.indexOf(input.charAt(i++));
        enc2 = base64Alphabet.indexOf(input.charAt(i++));
        enc3 = base64Alphabet.indexOf(input.charAt(i++));
        enc4 = base64Alphabet.indexOf(input.charAt(i++));
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
