/**
 * `@sugars/highlight` 内置的 `mathml` 词法。
 *
 * 让 MathML 入口复用通用标记语言的词法表。
 */

import { highlighter as highlight } from '../core.js'

// MathML 与标记入口共用词法对象，规则更新由公共入口处理。
highlight.languages.mathml = highlight.languages.markup;
