/**
 * `@sugars/highlight` 内置的 `roboconf` 词法。
 *
 * 区分 Roboconf 部署描述中的组件、属性、可选项与通配符。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.roboconf = {
    'comment': /#.*/,
    'keyword': {
        'pattern': /(^|\s)(?:(?:facet|instance of)(?=[ \t]+[\w-]+[ \t]*\{)|(?:external|import)\b)/,
        lookbehind: true
    },
    'component': {
        pattern: /[\w-]+(?=[ \t]*\{)/,
        alias: 'variable'
    },
    'property': /[\w.-]+(?=[ \t]*:)/,
    'value': {
        pattern: /(=[ \t]*)[^,;]+/,
        lookbehind: true,
        alias: 'attr-value'
    },
    // 可选项和通配符分别着色，让部署描述中的可选依赖与通配选择保持可辨。
    'optional': {
        pattern: /\(optional\)/,
        alias: 'builtin'
    },
    'wildcard': {
        pattern: /(\.)\*/,
        lookbehind: true,
        alias: 'operator'
    },
    'punctuation': /[{},.;:=]/
};
