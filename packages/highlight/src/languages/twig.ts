/**
 * `@sugars/highlight` 内置的 `twig` 词法。
 *
 * 标记 Twig 的模板指令、插值和注释，并复用外围标记词法。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.twig = {
    'comment': /\{#[\s\S]*?#\}/,
    'tag': {
        pattern: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/,
        inside: {
            'ld': {
                pattern: /^(?:\{\{\-?|\{%\-?\s*\w+)/,
                inside: {
                    'punctuation': /^(?:\{\{|\{%)\-?/,
                    'keyword': /\w+/
                }
            },
            'rd': {
                pattern: /\-?(?:%\}|\}\})$/,
                inside: {
                    'punctuation': /.*/
                }
            },
            'string': {
                pattern: /("|')(?:\\?.)*?\1/,
                inside: {
                    'punctuation': /^['"]|['"]$/
                }
            },
            'keyword': /\b(?:even|if|odd)\b/,
            'boolean': /\b(?:true|false|null)\b/,
            'number': /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+([Ee][-+]?\d+)?)\b/,
            'operator': [{
                    pattern: /(\s)(?:and|b\-and|b\-xor|b\-or|ends with|in|is|matches|not|or|same as|starts with)(?=\s)/,
                    lookbehind: true
                },
                /[=<>]=?|!=|\*\*?|\/\/?|\?:?|[-+~%|]/
            ],
            'property': /\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
            'punctuation': /[()\[\]{}:.,]/
        }
    },

    // 其余内容交给 HTML 词法。
    // 先标记模板标签和注释，余下非空白文本才进入标记词法。
    'other': {
        // 排除空白匹配。
        pattern: /\S(?:[\s\S]*\S)?/,
        inside: highlight.languages.markup
    }
};
