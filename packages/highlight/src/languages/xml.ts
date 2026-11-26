/**
 * `@sugars/highlight` 内置的 `xml` 词法。
 *
 * 让 XML 入口复用通用标记语言的词法表。
 */

import { highlighter as highlight } from '../core.js'

// XML 与公共标记词法共用对象，声明、实体和标签只有一套定义。
highlight.languages.xml = highlight.languages.markup;
