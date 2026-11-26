/**
 * `@sugars/highlight` 内置的 `svg` 词法。
 *
 * 让 SVG 入口复用通用标记语言的词法表。
 */

import { highlighter as highlight } from '../core.js'

// SVG 直接复用标记词法对象，使跨语言的标签与实体处理保持一致。
highlight.languages.svg = highlight.languages.markup;
