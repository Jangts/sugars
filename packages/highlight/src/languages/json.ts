/**
 * `@sugars/highlight` 内置的 `json` 词法。
 *
 * 按后续冒号区分 JSON 的字符串键与普通字符串值。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.json = {
    // 用后方的冒号判断字符串是否为键。这一步必须先于通用字符串规则。
    'property': /".*?"(?=\s*:)/ig,
    'string': /"(?!:)(\\?[^"])*?"(?!:)/g,
    'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/g,
    'punctuation': /[{}[\]);,]/g,
    'operator': /:/g,
    'boolean': /\b(true|false)\b/gi,
    'null': /\bnull\b/gi,
};
