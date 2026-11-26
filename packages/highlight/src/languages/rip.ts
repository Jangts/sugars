/**
 * `@sugars/highlight` 内置的 `rip` 词法。
 *
 * 区分 Rip 的日期时间、字符、正则与普通数据字面量。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.rip = {
    'comment': /#.*/,

    'keyword': /(?:=>|->)|\b(?:class|if|else|switch|case|return|exit|try|catch|finally|raise)\b/,

    'builtin': /@|\bSystem\b/,

    'boolean': /\b(?:true|false)\b/,

    'date': /\b\d{4}-\d{2}-\d{2}\b/,
    'time': /\b\d{2}:\d{2}:\d{2}\b/,
    // 日期与时间类型使用独立候选，避免一般数字规则先拆掉时间字面量。
    'datetime': /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\b/,

    'character': /\B`[^\s`'",.:;#\/\\()<>\[\]{}]\b/,

    'regex': {
        pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/(?=\s*($|[\r\n,.;})]))/,
        lookbehind: true
    },

    'symbol': /:[^\d\s`'",.:;#\/\\()<>\[\]{}][^\s`'",.:;#\/\\()<>\[\]{}]*/,
    'string': /("|')(\\?.)*?\1/,
    'number': /[+-]?(?:(?:\d+\.\d+)|(?:\d+))/,

    'punctuation': /(?:\.{2,3})|[`,.:;=\/\\()<>\[\]{}]/,

    'reference': /[^\d\s`'",.:;#\/\\()<>\[\]{}][^\s`'",.:;#\/\\()<>\[\]{}]*/
};
