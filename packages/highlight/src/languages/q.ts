/**
 * `@sugars/highlight` 内置的 `q` 词法。
 *
 * 区分 q 的时间字面量、符号、动词与副词。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.q = {
    'string': /"(?:\\.|[^"\\\r\n])*"/,
    'comment': [
        // 注释边界参照 http://code.kx.com/wiki/Reference/Slash
        // 斜线紧跟空格或右括号时，从它开始到行尾都是注释。
        {

            pattern: /([\t )\]}])\/.*/,
            lookbehind: true
        },
        // 注释边界参照 http://code.kx.com/wiki/Reference/Slash
        // 斜线在行首且后面有其他非空白字符时，整行作为注释。
        // 单独成行的斜线开始多行注释，下一条独占一行的反斜线结束注释。
        // 找不到结束反斜线时，注释延续到文件末尾。
        // 斜线和反斜线必须在行首，后面可以有空白。
        {
            pattern: /(^|\r?\n|\r)\/[\t ]*(?:(?:\r?\n|\r)(?:.*(?:\r?\n|\r))*?(?:\\(?=[\t ]*(?:\r?\n|\r))|$)|\S.*)/,
            lookbehind: true
        },
        // 注释边界参照 http://code.kx.com/wiki/Reference/Slash
        // 单独成行的反斜线没有对应的起始斜线时，余下文本视为注释。
        /^\\[\t ]*(?:\r?\n|\r)[\s\S]+/m,

        /^#!.+/m
    ],
    'symbol': /`(?::\S+|[\w.]*)/,
    // 日期和时间先于普通数字匹配，否则独立字段会被拆成数字或运算符。
    'datetime': {
        pattern: /0N[mdzuvt]|0W[dtz]|\d{4}\.\d\d(?:m|\.\d\d(?:T(?:\d\d(?::\d\d(?::\d\d(?:[.:]\d\d\d)?)?)?)?)?[dz]?)|\d\d:\d\d(?::\d\d(?:[.:]\d\d\d)?)?[uvt]?/,
        alias: 'number'
    },
    // 否定前瞻用于保留完整的动词写法。
    // 同样保留 0: 和 1: 动词的整体匹配。
    'number': /\b-?(?![01]:)(?:0[wn]|0W[hj]?|0N[hje]?|0x[\da-fA-F]+|\d+\.?\d*(?:e[+-]?\d+)?[hjfeb]?)/,
    'keyword': /\\\w+\b|\b(?:abs|acos|aj0?|all|and|any|asc|asin|asof|atan|attr|avgs?|binr?|by|ceiling|cols|cor|cos|count|cov|cross|csv|cut|delete|deltas|desc|dev|differ|distinct|div|do|dsave|ej|enlist|eval|except|exec|exit|exp|fby|fills|first|fkeys|flip|floor|from|get|getenv|group|gtime|hclose|hcount|hdel|hopen|hsym|iasc|identity|idesc|if|ij|in|insert|inter|inv|keys?|last|like|list|ljf?|load|log|lower|lsq|ltime|ltrim|mavg|maxs?|mcount|md5|mdev|med|meta|mins?|mmax|mmin|mmu|mod|msum|neg|next|not|null|or|over|parse|peach|pj|plist|prds?|prev|prior|rand|rank|ratios|raze|read0|read1|reciprocal|reval|reverse|rload|rotate|rsave|rtrim|save|scan|scov|sdev|select|set|setenv|show|signum|sin|sqrt|ssr?|string|sublist|sums?|sv|svar|system|tables|tan|til|trim|txf|type|uj|ungroup|union|update|upper|upsert|value|var|views?|vs|wavg|where|while|within|wj1?|wsum|ww|xasc|xbar|xcols?|xdesc|xexp|xgroup|xkey|xlog|xprev|xrank)\b/,
    'adverb': {
        pattern: /['\/\\]:?|\beach\b/,
        alias: 'function'
    },
    'verb': {
        pattern: /(?:\B\.\B|\b[01]:|<[=>]?|>=?|[:+\-*%,!?_~=|$&#@^]):?/,
        alias: 'operator'
    },
    'punctuation': /[(){}\[\];.]/
};
