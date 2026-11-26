/**
 * `@sugars/highlight` 内置的 `bison` 词法。
 *
 * 在 C 词法基础上识别 Bison 的声明区和产生式，把语义动作交给 C 规则。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.bison = highlight.languages.extend('c', {});
// 规则区里的花括号代码要按 C 处理。提前识别 Bison 区块，避免继承来的 C 注释先切开其边界。
highlight.languages.insertBefore('bison', 'comment', {
    'bison': {
        // 从文件起始覆盖序言、Bison 声明和语法规则。
        pattern: /^[\s\S]*?%%[\s\S]*?%%/,
        inside: {
            'c': {
                // 允许一层嵌套花括号。
                pattern: /%\{[\s\S]*?%\}|\{(?:\{[^}]*\}|[^{}])*\}/,
                inside: {
                    'delimiter': {
                        pattern: /^%?\{|%?\}$/,
                        alias: 'punctuation'
                    },
                    'bison-variable': {
                        pattern: /[$@](?:<[^\s>]+>)?[\w$]+/,
                        alias: 'variable',
                        inside: {
                            'punctuation': /<|>/
                        }
                    },
                    rest: highlight.languages.c
                }
            },
            'comment': highlight.languages.c!.comment,
            'string': highlight.languages.c!.string,
            'property': /\S+(?=:)/,
            'keyword': /%\w+/,
            'number': {
                pattern: /(^|[^@])\b(?:0x[\da-f]+|\d+)/i,
                lookbehind: true
            },
            'punctuation': /%[%?]|[|:;\[\]<>]/
        }
    }
});
