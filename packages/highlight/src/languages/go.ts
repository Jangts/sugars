/**
 * `@sugars/highlight` 内置的 `go` 词法。
 *
 * 基于通用 C 风格词法区分 Go 关键字、内置标识符和字符串。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.go = highlight.languages.extend('clike', {
    'keyword': /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
    // 内置名与关键字使用不同类别，主题可以分别给内置函数和语言语句设样式。
    'builtin': /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
    'boolean': /\b(_|iota|nil|true|false)\b/,
    'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
    'number': /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
    'string': /("|'|`)(\\?.|\r|\n)*?\1/
});
delete highlight.languages.go['class-name'];
