/**
 * `@sugars/highlight` 内置的 `markdown` 词法。
 *
 * 在标记词法基础上识别标题、代码、链接和强调，嵌套强调使用可递归规则。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, insideGrammar } from '../grammar.js'

highlight.languages.markdown = highlight.languages.extend('markup', {});
highlight.languages.insertBefore('markdown', 'prolog', {
    'blockquote': {
        // > ...
        pattern: /^>(?:[\t ]*>)*/m,
        alias: 'punctuation'
    },
    // 代码区域应先从普通正文中切出，避免强调符号和链接写法在代码内被误识别。
    'code': [{
            // 以四个空格或一个制表符缩进。
            pattern: /^(?: {4}|\t).+/m,
            alias: 'keyword'
        },
        {
            // `code`
            // ``code``
            pattern: /``.+?``|`[^`\n]+`/,
            alias: 'keyword'
        }
    ],
    'title': [{
            // 一级标题。
            // =======
            // 二级标题。
            // -------
            pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
            alias: 'important',
            inside: {
                punctuation: /==+$|--+$/
            }
        },
        {
            // # title 1
            // ###### title 6
            pattern: /(^\s*)#+.+/m,
            lookbehind: true,
            alias: 'important',
            inside: {
                punctuation: /^#+|#+$/
            }
        }
    ],
    'hr': {
        // ***
        // ---
        // * * *
        // -----------
        pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
        lookbehind: true,
        alias: 'punctuation'
    },
    'list': {
        // * item
        // + item
        // - item
        // 1. item
        pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
        lookbehind: true,
        alias: 'punctuation'
    },
    'url-reference': {
        // [id]: http://example.com "Optional title"
        // [id]: http://example.com 'Optional title'
        // [id]: http://example.com (Optional title)
        // [id]: <http://example.com> "Optional title"
        pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
        inside: {
            'variable': {
                pattern: /^(!?\[)[^\]]+/,
                lookbehind: true
            },
            'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
            'punctuation': /^[\[\]!:]|[<>]/
        },
        alias: 'url'
    },
    'bold': {
        // **strong**
        // __strong__
        // 最多允许一个换行。
        pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: {
            'punctuation': /^\*\*|^__|\*\*$|__$/
        }
    },
    'italic': {
        // *em*
        // _em_
        // 最多允许一个换行。
        pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: {
            'punctuation': /^[*_]|[*_]$/
        }
    },
    'url': {
        // [example](http://example.com "Optional title")
        // [example] [id]
        pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
        inside: {
            'variable': {
                pattern: /(!?\[)[^\]]+(?=\]$)/,
                lookbehind: true
            },
            'string': {
                pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
            }
        }
    }
});

insideGrammar(highlight.languages.markdown!['bold'])['url'] = cloneGrammar(highlight.languages.markdown['url']);
insideGrammar(highlight.languages.markdown!['italic'])['url'] = cloneGrammar(highlight.languages.markdown['url']);
insideGrammar(highlight.languages.markdown!['bold'])['italic'] = cloneGrammar(highlight.languages.markdown['italic']);
insideGrammar(highlight.languages.markdown!['italic'])['bold'] = cloneGrammar(highlight.languages.markdown['bold']);
