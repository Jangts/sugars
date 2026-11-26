/**
 * `@sugars/highlight` 内置的 `oz` 词法。
 *
 * 区分 Oz 原子、变量、记录属性和内置语句。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.oz = {
    'comment': /\/\*[\s\S]*?\*\/|%.*/,
    'string': /"(?:[^"\\]|\\[\s\S])*"/,
    'atom': {
        pattern: /'(?:[^'\\]|\\.)*'/,
        alias: 'builtin'
    },
    'keyword': /[$_]|\[\]|\b(?:at|attr|case|catch|choice|class|cond|declare|define|dis|else(?:case|if)?|end|export|fail|false|feat|finally|from|fun|functor|if|import|in|local|lock|meth|nil|not|of|or|prepare|proc|prop|raise|require|self|skip|then|thread|true|try|unit)\b/,
    'function': [
        /[a-z][A-Za-z\d]*(?=\()/, {
            pattern: /(\{)[A-Z][A-Za-z\d]*/,
            lookbehind: true
        }
    ],
    'number': /\b(?:0[bx][\da-f]+|\d+\.?\d*(?:e~?\d+)?\b)|&(?:[^\\]|\\(?:\d{3}|.))/i,
    'variable': /\b[A-Z][A-Za-z\d]*|`(?:[^`\\]|\\.)+`/,
    // 记录属性通过后续分隔位置识别，属性值仍按各自的普通词法处理。
    'attr-name': /\w+(?=:)/,
    'operator': /:(?:=|::?)|<[-:=]?|=(?:=|<?:?)|>=?:?|\\=:?|!!?|[|#+\-*\/,~^@]|\b(?:andthen|div|mod|orelse)\b/,
    'punctuation': /[\[\](){}.:;?]/
};
