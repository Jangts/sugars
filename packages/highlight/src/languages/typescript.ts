/**
 * `@sugars/highlight` 内置的 `typescript` 词法。
 *
 * 从 JavaScript 词法扩展 TypeScript 的类型和声明关键字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.typescript = highlight.languages.extend('javascript', {
    // 扩展 JavaScript 词法时只替换 TypeScript 的关键字集合，模板字符串仍沿用 JavaScript 规则。
    'keyword': /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|get|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|module|declare|constructor|string|Function|any|number|boolean|Array|enum)\b/
});
