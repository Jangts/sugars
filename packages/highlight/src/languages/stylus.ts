/**
 * `@sugars/highlight` 内置的 `stylus` 词法。
 *
 * 识别 Stylus 的属性值、函数、颜色和插值。
 */

import { highlighter as highlight } from '../core.js'
import type { Grammar } from '../grammar.js'
import { cloneGrammar } from '../grammar.js'

const inside: Grammar = {
    // URL 写法可能包含样式规则的特殊字符，优先保住它的边界再处理插值或属性。
    'url': /url\((["']?).*?\1\)/i,
    'string': /("|')(?:[^\\\r\n]|\\(?:\r\n|[\s\S]))*?\1/,
    'interpolation': null, // 规则在下方补入。
    'func': null, // 规则在下方补入。
    'important': /\B!(?:important|optional)\b/i,
    'keyword': {
        pattern: /(^|\s+)(?:(?:if|else|for|return|unless)(?=\s+|$)|@[\w-]+)/,
        lookbehind: true
    },
    'hexcode': /#[\da-f]{3,6}/i,
    'number': /\b\d+(?:\.\d+)?%?/,
    'boolean': /\b(?:true|false)\b/,
    'operator': [
        // 要求减号两侧为非单词字符，避免把属性名中的连字符误判为运算符。
        /~|[+!\/%<>?=]=?|[-:]=|\*[*=]?|\.+|&&|\|\||\B-\B|\b(?:and|in|is(?: a| defined| not|nt)?|not|or)\b/
    ],
    'punctuation': /[{}()\[\];:,]/
};

inside['interpolation'] = {
    pattern: /\{[^\r\n}:]+\}/,
    alias: 'variable',
    inside: cloneGrammar(inside)
};
inside['func'] = {
    pattern: /[\w-]+\([^)]*\).*/,
    inside: {
        'function': /^[^(]+/,
        rest: cloneGrammar(inside)
    }
};

highlight.languages.stylus = {
    'comment': {
        pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*)/,
        lookbehind: true
    },
    'atrule-declaration': {
        pattern: /(^\s*)@.+/m,
        lookbehind: true,
        inside: {
            'atrule': /^@[\w-]+/,
            rest: inside
        }
    },
    'variable-declaration': {
        pattern: /(^[ \t]*)[\w$-]+\s*.?=[ \t]*(?:(?:\{[^}]*\}|.+)|$)/m,
        lookbehind: true,
        inside: {
            'variable': /^\S+/,
            rest: inside
        }
    },

    'statement': {
        pattern: /(^[ \t]*)(?:if|else|for|return|unless)[ \t]+.+/m,
        lookbehind: true,
        inside: {
            keyword: /^\S+/,
            rest: inside
        }
    },

    // 属性和值不能以逗号或花括号结尾。
    // 只有以分号结束时才允许随后出现缩进内容。
    'property-declaration': {
        pattern: /((?:^|\{)([ \t]*))(?:[\w-]|\{[^}\r\n]+\})+(?:\s*:\s*|[ \t]+)[^{\r\n]*(?:;|[^{\r\n,](?=$)(?!(\r?\n|\r)(?:\{|\2[ \t]+)))/m,
        lookbehind: true,
        inside: {
            'property': {
                pattern: /^[^\s:]+/,
                inside: {
                    'interpolation': inside.interpolation
                }
            },
            rest: inside
        }
    },



    // 选择器仅在伪元素中允许括号，可以跨行。
    // 选择器以逗号或花括号结束，或后接缩进内容。
    'selector': {
        pattern: /(^[ \t]*)(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)(?:(?:\r?\n|\r)(?:\1(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)))*(?:,$|\{|(?=(?:\r?\n|\r)(?:\{|\1[ \t]+)))/m,
        lookbehind: true,
        inside: {
            'interpolation': inside.interpolation,
            'punctuation': /[{},]/
        }
    },

    'func': inside.func,
    'string': inside.string,
    'interpolation': inside.interpolation,
    'punctuation': /[{}()\[\];:.]/
};
