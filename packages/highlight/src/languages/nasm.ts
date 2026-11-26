/**
 * `@sugars/highlight` 内置的 `nasm` 词法。
 *
 * 识别 NASM 寄存器、标号、指令和数字进制格式。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.nasm = {
    'comment': /;.*$/m,
    'string': /("|'|`)(\\?.)*?\1/m,
    'label': {
        pattern: /(^\s*)[A-Za-z._?$][\w.?$@~#]*:/m,
        lookbehind: true,
        alias: 'function'
    },
    'keyword': [
        /\[?BITS (16|32|64)\]?/m, {
            pattern: /(^\s*)section\s*[a-zA-Z\.]+:?/im,
            lookbehind: true
        },
        /(?:extern|global)[^;\r\n]*/im,
        /(?:CPU|FLOAT|DEFAULT).*$/m
    ],
    // 寄存器专用名称与指令关键字分开匹配，像寄存器名的普通子串仍由边界判断排除。
    'register': {
        pattern: /\b(?:st\d|[xyz]mm\d\d?|[cdt]r\d|r\d\d?[bwd]?|[er]?[abcd]x|[abcd][hl]|[er]?(bp|sp|si|di)|[cdefgs]s)\b/i,
        alias: 'variable'
    },
    'number': /(\b|-|(?=\$))(0[hx][\da-f]*\.?[\da-f]+(p[+-]?\d+)?|\d[\da-f]+[hx]|\$\d[\da-f]*|0[oq][0-7]+|[0-7]+[oq]|0[by][01]+|[01]+[by]|0[dt]\d+|\d*\.?\d+(\.?e[+-]?\d+)?[dt]?)\b/i,
    'operator': /[\[\]*+\-\/%<>=&|$!]/
};
