/**
 * `@sugars/highlight` 内置的 `julia` 词法。
 *
 * 识别 Julia 关键字、数值及多种引号内的字符串。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.julia = {
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true
    },
    // 用不同候选区分普通字符串和多引号边界，避免开头的引号被过早闭合。
    'string': /"""[\s\S]+?"""|'''[\s\S]+?'''|("|')(\\?.)*?\1/,
    'keyword': /\b(abstract|baremodule|begin|bitstype|break|catch|ccall|const|continue|do|else|elseif|end|export|finally|for|function|global|if|immutable|import|importall|let|local|macro|module|print|println|quote|return|try|type|typealias|using|while)\b/,
    'boolean': /\b(true|false)\b/,
    'number': /\b-?(0[box])?(?:[\da-f]+\.?\d*|\.\d+)(?:[efp][+-]?\d+)?j?\b/i,
    'operator': /\+=?|-=?|\*=?|\/[\/=]?|\\=?|\^=?|%=?|÷=?|!=?=?|&=?|\|[=>]?|\$=?|<(?:<=?|[=:])?|>(?:=|>>?=?)?|==?=?|[~≠≤≥]/,
    'punctuation': /[{}[\];(),.:]/
};
