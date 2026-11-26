/**
 * `@sugars/highlight` 内置的 `ocaml` 词法。
 *
 * 识别 OCaml 的类型变量、指令、关键字与多种字面量。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.ocaml = {
    'comment': /\(\*[\s\S]*?\*\)/,
    'string': [
        /"(?:\\.|[^\\\r\n"])*"/,
        /(['`])(?:\\(?:\d+|x[\da-f]+|.)|(?!\1)[^\\\r\n])\1/i
    ],
    'number': /\b-?(?:0x[\da-f][\da-f_]+|(?:0[bo])?\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)/i,
    // 类型变量的单引号前缀需要与字符字面量区分，真正的字符字面量由较早的字符串规则处理。
    'type': {
        pattern: /\B['`][a-z\d_]*/i,
        alias: 'variable'
    },
    'directive': {
        pattern: /\B#[a-z\d_]+/i,
        alias: 'function'
    },
    'keyword': /\b(?:as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|match|method|module|mutable|new|object|of|open|prefix|private|rec|then|sig|struct|to|try|type|val|value|virtual|where|while|with)\b/,
    'boolean': /\b(?:false|true)\b/,
    // 支持自定义运算符。
    'operator': /:=|[=<>@^|&+\-*\/$%!?~][!$%&\*+\-.\/:<=>?@^|~]*|\b(?:and|asr|land|lor|lxor|lsl|lsr|mod|nor|or)\b/,
    'punctuation': /[(){}\[\]|_.,:;]/
};
