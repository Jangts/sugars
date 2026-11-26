/**
 * `@sugars/highlight` 内置的 `lua` 词法。
 *
 * 区分 Lua 的长括号文本、注释、关键字和数字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.lua = {
    'comment': /^#!.+|--(?:\[(=*)\[[\s\S]*?\]\1\]|.*)/m,
    // \z may be used to skip the following space
    // 长括号的起止标记允许等号，配对规则保留内容里的普通方括号。
    'string': /(["'])(?:(?!\1)[^\\\r\n]|\\z(?:\r\n|\s)|\\(?:\r\n|[\s\S]))*\1|\[(=*)\[[\s\S]*?\]\2\]/,
    'number': /\b0x[a-f\d]+\.?[a-f\d]*(?:p[+-]?\d+)?\b|\b\d+(?:\.\B|\.?\d*(?:e[+-]?\d+)?\b)|\B\.\d+(?:e[+-]?\d+)?\b/i,
    'keyword': /\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
    'function': /(?!\d)\w+(?=\s*(?:[({]))/,
    'operator': [
        /[-+*%^&|#]|\/\/?|<[<=]?|>[>=]?|[=~]=?/, {
            // 匹配 ..，同时保留三个点的标记。
            pattern: /(^|[^.])\.\.(?!\.)/,
            lookbehind: true
        }
    ],
    'punctuation': /[\[\](){},;]|\.+|:+/
};
