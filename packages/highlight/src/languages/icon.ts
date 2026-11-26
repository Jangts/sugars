/**
 * `@sugars/highlight` 内置的 `icon` 词法。
 *
 * 区分 Icon 语言的预处理指令、内置名称、函数和生成式中使用的运算符。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.icon = highlight.languages.bcon = {
    'comment': /#.*/,
    'string': /(["'])(?:(?!\1)[^\\\r\n]|\\.|_(?:\r?\n|\r))*\1/,
    'number': /\b(?:\d+r[a-z\d]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b|\.\d+\b/i,
    'builtin-keyword': {
        pattern: /&(?:allocated|ascii|clock|collections|cset|current|date|dateline|digits|dump|e|error(?:number|text|value)?|errout|fail|features|file|host|input|lcase|letters|level|line|main|null|output|phi|pi|pos|progname|random|regions|source|storage|subject|time|trace|ucase|version)\b/,
        alias: 'variable'
    },
    // 预处理指令依赖行边界，放在普通关键字之外，保留指令参数的专用写法。
    'directive': {
        pattern: /\$\w+/,
        alias: 'builtin'
    },
    'keyword': /\b(?:break|by|case|create|default|do|else|end|every|fail|global|if|initial|invocable|link|local|next|not|of|procedure|record|repeat|return|static|suspend|then|to|until|while)\b/,
    'function': /(?!\d)\w+(?=\s*[({]|\s*!\s*\[)/,
    'operator': /[+-]:(?!=)|(?:[\/?@^%&]|\+\+?|--?|==?=?|~==?=?|\*\*?|\|\|\|?|<(?:->?|<?=?)|>>?=?)(?::=)?|:(?:=:?)?|[!.\\|~]/,
    'punctuation': /[\[\](){},;]/
};
