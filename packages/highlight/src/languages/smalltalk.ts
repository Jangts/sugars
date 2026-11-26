/**
 * `@sugars/highlight` 内置的 `smalltalk` 词法。
 *
 * 识别 Smalltalk 符号、块参数、临时变量和运算符。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.smalltalk = {
    'comment': /"(?:""|[^"])+"/,
    'string': /'(?:''|[^'])+'/,
    'symbol': /#[\da-z]+|#(?:-|([+\/\\*~<>=@%|&?!])\1?)|#(?=\()/i,
    // 块参数依赖冒号等引入记号，与块体中的消息发送词法分开。
    'block-arguments': {
        pattern: /(\[\s*):[^\[|]*?\|/,
        lookbehind: true,
        inside: {
            'variable': /:[\da-z]+/i,
            'punctuation': /\|/
        }
    },
    'temporary-variables': {
        pattern: /\|[^|]+\|/,
        inside: {
            'variable': /[\da-z]+/i,
            'punctuation': /\|/
        }
    },
    'keyword': /\b(?:nil|true|false|self|super|new)\b/,
    'character': {
        pattern: /\$./,
        alias: 'string'
    },
    'number': [
        /\d+r-?[\dA-Z]+(?:\.[\dA-Z]+)?(?:e-?\d+)?/,
        /(?:\B-|\b)\d+(?:\.\d+)?(?:e-?\d+)?/
    ],
    'operator': /[<=]=?|:=|~[~=]|\/\/?|\\\\|>[>=]?|[!^+\-*&|,@]/,
    'punctuation': /[.;:?\[\](){}]/
};
