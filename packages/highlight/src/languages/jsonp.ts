/**
 * `@sugars/highlight` 内置的 `jsonp` 词法。
 *
 * 沿用 JSON 的词法表作为 JSONP 入口。
 */

import { highlighter as highlight } from '../core.js'

// JSONP 入口与 JSON 共用同一词法对象，回调包装仍按未匹配的普通文本保留。
highlight.languages.jsonp = highlight.languages.json;
