/**
 * `@sugars/highlight` 的公开入口。
 *
 * 先登记内置语言，再公开分词、文本转 HTML 和 DOM 渲染入口。
 * `tokenize` 返回词法序列，`highlight` 输出 HTML，`render` 系列作用于 DOM。扩展入口为 `languages` 和 `hooks`。
 */

import './languages/index.js'

export { highlighter as default, highlight, render, renderAll, renderElement } from './core.js'
export { languages } from './grammar.js'
export { hooks } from './hooks.js'
export { Token, tokenize } from './tokenize.js'
export type { Grammar, Pattern, Rule, LanguageRegistry } from './grammar.js'
export type { RenderCallback } from './hooks.js'
export type { TokenContent, TokenStream } from './tokenize.js'
