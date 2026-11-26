/**
 * `@sugars/highlight` 内置的 `wiki` 词法。
 *
 * 识别维基文本中的表格、标题、内部链接和强调标记。
 */

import { highlighter as highlight } from '../core.js'
import { grammarPattern } from '../grammar.js'

highlight.languages.wiki = highlight.languages.extend('markup', {
    // 这些块应先隔离出来，避免其内部的表格或标题样式被 Wiki 正文规则重新匹配。
    'block-comment': {
        pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
        lookbehind: true,
        alias: 'comment'
    },
    'heading': {
        pattern: /^(=+).+?\1/m,
        inside: {
            'punctuation': /^=+|=+$/,
            'important': /.+/
        }
    },
    'emphasis': {
        // 多行形式待支持。
        pattern: /('{2,5}).+?\1/,
        inside: {
            'bold italic': {
                pattern: /(''''').+?(?=\1)/,
                lookbehind: true
            },
            'bold': {
                pattern: /(''')[^'](?:.*?[^'])?(?=\1)/,
                lookbehind: true
            },
            'italic': {
                pattern: /('')[^'](?:.*?[^'])?(?=\1)/,
                lookbehind: true
            },
            'punctuation': /^''+|''+$/
        }
    },
    'hr': {
        pattern: /^-{4,}/m,
        alias: 'punctuation'
    },
    'url': [/ISBN +(?:97[89][ -]?)?(?:\d[ -]?){9}[\dx]\b|(?:RFC|PMID) +\d+/i, /\[\[.+?\]\]|\[.+?\]/],
    'variable': [/__[A-Z]+__/,
        // 待补充嵌套结构处理。
        // {{formatnum:{{#expr:{{{3}}}}}}}
        /\{{3}.+?\}{3}/,
        /\{\{.+?}}/
    ],
    'symbol': [
        /^#redirect/im,
        /~{3,5}/
    ],
    // 匹配表格属性。
    // {|
    // ! style="text-align:left;"| Item
    // |}
    'table-tag': {
        pattern: /((?:^|[|!])[|!])[^|\r\n]+\|(?!\|)/m,
        lookbehind: true,
        inside: {
            'table-bar': {
                pattern: /\|$/,
                alias: 'punctuation'
            },
            rest: grammarPattern(highlight.languages.markup!['tag']).inside
        }
    },
    'punctuation': /^(?:\{\||\|\}|\|-|[*#:;!|])|\|\||!!/m
});

highlight.languages.insertBefore('wiki', 'tag', {
    // 跳过 nowiki、source 和 pre 标签内的维基词法。
    'nowiki': {
        pattern: /<(nowiki|pre|source)\b[\w\W]*?>[\w\W]*?<\/\1>/i,
        inside: {
            'tag': {
                pattern: /<(?:nowiki|pre|source)\b[\w\W]*?>|<\/(?:nowiki|pre|source)>/i,
                inside: grammarPattern(highlight.languages.markup!['tag']).inside
            }
        }
    }
});
