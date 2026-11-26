/**
 * `@sugars/highlight` 内置的 `erlang` 词法。
 *
 * 区分 Erlang 的原子、变量、函数、带引号名称和数字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.erlang = {
    'comment': /%.+/,
    'string': /"(?:\\?.)*?"/,
    // 有引号的名称通过后续调用位置区分函数和普通原子，所以函数候选优先于普通带引号原子。
    'quoted-function': {
        pattern: /'(?:\\.|[^'\\])+'(?=\()/,
        alias: 'function'
    },
    'quoted-atom': {
        pattern: /'(?:\\.|[^'\\])+'/,
        alias: 'atom'
    },
    'boolean': /\b(?:true|false)\b/,
    'keyword': /\b(?:fun|when|case|of|end|if|receive|after|try|catch)\b/,
    'number': [
        /\$\\?./,
        /\d+#[a-z0-9]+/i,
        /(?:\b|-)\d*\.?\d+([Ee][+-]?\d+)?\b/
    ],
    'function': /\b[a-z][\w@]*(?=\()/,
    'variable': {
        // 用后顾避免误匹配包含 @ 的原子。
        pattern: /(^|[^@])(?:\b|\?)[A-Z_][\w@]*/,
        lookbehind: true
    },
    'operator': [
        /[=\/<>:]=|=[:\/]=|\+\+?|--?|[=*\/!]|\b(?:bnot|div|rem|band|bor|bxor|bsl|bsr|not|and|or|xor|orelse|andalso)\b/, {
            // 跳过 << 运算符。
            pattern: /(^|[^<])<(?!<)/,
            lookbehind: true
        }, {
            // 跳过 >> 运算符。
            pattern: /(^|[^>])>(?!>)/,
            lookbehind: true
        }
    ],
    'atom': /\b[a-z][\w@]*/,
    'punctuation': /[()[\]{}:;,.#|]|<<|>>/

};
