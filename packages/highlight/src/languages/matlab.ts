/**
 * `@sugars/highlight` 内置的 `matlab` 词法。
 *
 * 识别 MATLAB 的控制结构、字符串、矩阵相关运算符和行注释。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.matlab = {
    // 字符串先于注释处理，避免把 printf 格式串中的 % 当注释。
    // 字符串先匹配，以保留格式字符串里的百分号，避免误触发行注释规则。
    'string': /\B'(?:''|[^'\n])*'/,
    'comment': [
        /%\{[\s\S]*?\}%/,
        /%.+/
    ],
    // 待完善虚数的整体匹配。
    'number': /\b-?(?:\d*\.?\d+(?:[eE][+-]?\d+)?(?:[ij])?|[ij])\b/,
    'keyword': /\b(?:break|case|catch|continue|else|elseif|end|for|function|if|inf|NaN|otherwise|parfor|pause|pi|return|switch|try|while)\b/,
    'function': /(?!\d)\w+(?=\s*\()/,
    'operator': /\.?[*^\/\\']|[+\-:@]|[<>=~]=?|&&?|\|\|?/,
    'punctuation': /\.{3}|[.,;\[\](){}!]/
};
