/**
 * `@sugars/highlight` 内置的 `html` 词法。
 *
 * 让 HTML 入口复用通用标记语言的词法表。
 */

import { highlighter as highlight } from '../core.js'

// 直接登记同一个词法对象。后续为标记语言注入的脚本与样式规则也会通过 HTML 入口可见。
highlight.languages.html = highlight.languages.markup;
