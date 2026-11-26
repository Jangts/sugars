/**
 * `@sugars/highlight` 内置的 `eiffel` 词法。
 *
 * 区分 Eiffel 关键字、字符串、字符和数字格式。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.eiffel = {
    // 逐字字符串的对齐和定界方式与单行字符串不同，使用各自的候选以保留多行内容。
    'string': [
        // 对齐的逐字字符串。
        /"([^[]*)\[[\s\S]+?\]\1"/,
        // 非对齐的逐字字符串。
        /"([^{]*)\{[\s\S]+?\}\1"/,
        // 单行字符串。
        /"(?:%\s+%|%"|.)*?"/
    ],
    // (comments including quoted strings not supported)
    'comment': /--.*/,
    // 普通字符、特殊字符或字符码。
    'char': /'(?:%'|.)+?'/,
    'keyword': /\b(?:across|agent|alias|all|and|attached|as|assign|attribute|check|class|convert|create|Current|debug|deferred|detachable|do|else|elseif|end|ensure|expanded|export|external|feature|from|frozen|if|implies|inherit|inspect|invariant|like|local|loop|not|note|obsolete|old|once|or|Precursor|redefine|rename|require|rescue|Result|retry|select|separate|some|then|undefine|until|variant|Void|when|xor)\b/i,
    'boolean': /\b(?:True|False)\b/i,
    'number': [
        // 十六、八、二进制。
        /\b0[xcb][\da-f](?:_*[\da-f])*\b/i,
        // 十进制。
        /(?:\d(?:_*\d)*)?\.(?:(?:\d(?:_*\d)*)?[eE][+-]?)?\d(?:_*\d)*|\d(?:_*\d)*\.?/
    ],
    'punctuation': /:=|<<|>>|\(\||\|\)|->|\.(?=\w)|[{}[\];(),:?]/,
    'operator': /\\\\|\|\.\.\||\.\.|\/[~\/=]?|[><]=?|[-+*^=~]/
};
