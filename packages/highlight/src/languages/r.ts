/**
 * `@sugars/highlight` 内置的 `r` 词法。
 *
 * 标记 R 的百分号运算符、特殊常量与数字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.r = {
    'comment': /#.*/,
    'string': /(['"])(?:\\?.)*?\1/,
    // 用一对百分号识别用户操作符。它独立于普通二元运算符，保留完整的运算符名。
    'percent-operator': {
        // 包含用户自定义运算符。
        // 也覆盖 %%、%*%、%/%、%in%、%o% 和 %x%。
        pattern: /%[^%\s]*%/,
        alias: 'operator'
    },
    'boolean': /\b(?:TRUE|FALSE)\b/,
    'ellipsis': /\.\.(?:\.|\d+)/,
    'number': [
        /\b(?:NaN|Inf)\b/,
        /\b(?:0x[\dA-Fa-f]+(?:\.\d*)?|\d*\.?\d+)(?:[EePp][+-]?\d+)?[iL]?\b/
    ],
    'keyword': /\b(?:if|else|repeat|while|function|for|in|next|break|NULL|NA|NA_integer_|NA_real_|NA_complex_|NA_character_)\b/,
    'operator': /->?>?|<(?:=|<?-)?|[>=!]=?|::?|&&?|\|\|?|[+*\/^$@~]/,
    'punctuation': /[(){}\[\],;]/
};
