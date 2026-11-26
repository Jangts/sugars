/**
 * `@sugars/highlight` 内置的 `brainfuck` 词法。
 *
 * 把 Brainfuck 的指针移动、增减及分支指令分成不同标记。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.brainfuck = {
    'pointer': {
        pattern: /<|>/,
        alias: 'keyword'
    },
    'increment': {
        pattern: /\+/,
        alias: 'inserted'
    },
    'decrement': {
        pattern: /-/,
        alias: 'deleted'
    },
    'branching': {
        pattern: /\[|\]/,
        alias: 'important'
    },
    'operator': /[.,]/,
    // 当前词法把非指令字符归入注释。连续运算符由前面的指令类别分开，便于主题着色。
    'comment': /\S+/
};
