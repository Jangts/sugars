/**
 * `@sugars/highlight` 内置的 `dart` 词法。
 *
 * 识别 Dart 的关键字、注解与多种引号形式，包括带 r 前缀的原始字符串。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.dart = highlight.languages.extend('clike', {
    'string': [/r?("""|''')[\s\S]*?\1/, /r?("|')(\\?.)*?\1/],
    'keyword': [/\b(?:async|sync|yield)\*/, /\b(?:abstract|assert|async|await|break|case|catch|class|const|continue|default|deferred|do|dynamic|else|enum|export|external|extends|factory|final|finally|for|get|if|implements|import|in|library|new|null|operator|part|rethrow|return|set|static|super|switch|this|throw|try|typedef|var|void|while|with|yield)\b/],
    'operator': /\bis!|\b(?:as|is)\b|\+\+|--|&&|\|\||<<=?|>>=?|~(?:\/=?)?|[+\-*\/%&^|=!<>]=?|\?/
});

highlight.languages.insertBefore('dart', 'function', {
    // 注解有独立标记，可保留注解名称和普通关键字之间的区别。
    'metadata': {
        pattern: /@\w+/,
        alias: 'symbol'
    }
});
