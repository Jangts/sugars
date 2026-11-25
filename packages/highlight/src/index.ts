import './languages/index.js'

export { highlighter as default, highlight, render, renderAll, renderElement } from './core.js'
export { languages } from './grammar.js'
export { hooks } from './hooks.js'
export { Token, tokenize } from './tokenize.js'
export type { Grammar, Pattern, Rule, LanguageRegistry } from './grammar.js'
export type { RenderCallback } from './hooks.js'
export type { TokenContent, TokenStream } from './tokenize.js'
