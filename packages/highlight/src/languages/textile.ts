/**
 * `@sugars/highlight` 内置的 `textile` 词法。
 *
 * 处理 Textile 的块与内联标记，包括链接、图片、脚注和样式修饰。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern, insideGrammar } from '../grammar.js'

// 括号中排除竖线，以免吞掉表格分隔符，例如 |(. foo |). bar |。
var modifierRegex = '(?:\\([^|)]+\\)|\\[[^\\]]+\\]|\\{[^}]+\\})+';
var modifierTokens = {
    'css': {
        pattern: /\{[^}]+\}/,
        inside: {
            rest: highlight.languages.css
        }
    },
    'class-id': {
        pattern: /(\()[^)]+(?=\))/,
        lookbehind: true,
        alias: 'attr-value'
    },
    'lang': {
        pattern: /(\[)[^\]]+(?=\])/,
        lookbehind: true,
        alias: 'attr-value'
    },
    // 其余记号按标点处理，首条规则覆盖表格的跨行、跨列标记。
    'punctuation': /[\\\/]\d+|\S/
};


highlight.languages.textile = highlight.languages.extend('markup', {
    // 短语的定界符既可能是样式开关也可能是正文标点，保留前后边界可限制匹配范围。
    'phrase': {
        pattern: /(^|\r|\n)\S[\s\S]*?(?=$|\r?\n\r?\n|\r\r)/,
        lookbehind: true,
        inside: {

            // 一级标题，例如 h1. Header 1
            'block-tag': {
                pattern: RegExp('^[a-z]\\w*(?:' + modifierRegex + '|[<>=()])*\\.'),
                inside: {
                    'modifier': {
                        pattern: RegExp('(^[a-z]\\w*)(?:' + modifierRegex + '|[<>=()])+(?=\\.)'),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'tag': /^[a-z]\w*/,
                    'punctuation': /\.$/
                }
            },

            // # List item
            // * List item
            'list': {
                pattern: RegExp('^[*#]+(?:' + modifierRegex + ')?\\s+.+', 'm'),
                inside: {
                    'modifier': {
                        pattern: RegExp('(^[*#]+)' + modifierRegex),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'punctuation': /^[*#]+/
                }
            },

            // | cell | cell | cell |
            'table': {
                // 修饰可用于行，例如 {color:red}.|1|2|3|。
                // 也可用于单元格，例如 |{color:red}.1|2|3|。
                pattern: RegExp('^(?:(?:' + modifierRegex + '|[<>=()^~])+\\.\\s*)?(?:\\|(?:(?:' + modifierRegex + '|[<>=()^~_]|[\\\\/]\\d+)+\\.)?[^|]*)+\\|', 'm'),
                inside: {
                    'modifier': {
                        // 首行之后的行修饰前面是竖线与换行。
                        pattern: RegExp('(^|\\|(?:\\r?\\n|\\r)?)(?:' + modifierRegex + '|[<>=()^~_]|[\\\\/]\\d+)+(?=\\.)'),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'punctuation': /\||^\./
                }
            },

            'inline': {
                pattern: RegExp('(\\*\\*|__|\\?\\?|[*_%@+\\-^~])(?:' + modifierRegex + ')?.+?\\1'),
                inside: {
                    // 此处没有单独匹配上标和下标。

                    // *bold*, **bold**
                    'bold': {
                        pattern: RegExp('((^\\*\\*?)(?:' + modifierRegex + ')?).+?(?=\\2)'),
                        lookbehind: true
                    },

                    // _italic_, __italic__
                    'italic': {
                        pattern: RegExp('((^__?)(?:' + modifierRegex + ')?).+?(?=\\2)'),
                        lookbehind: true
                    },

                    // ??cite??
                    'cite': {
                        pattern: RegExp('(^\\?\\?(?:' + modifierRegex + ')?).+?(?=\\?\\?)'),
                        lookbehind: true,
                        alias: 'string'
                    },

                    // @code@
                    'code': {
                        pattern: RegExp('(^@(?:' + modifierRegex + ')?).+?(?=@)'),
                        lookbehind: true,
                        alias: 'keyword'
                    },

                    // +inserted+
                    'inserted': {
                        pattern: RegExp('(^\\+(?:' + modifierRegex + ')?).+?(?=\\+)'),
                        lookbehind: true
                    },

                    // -deleted-
                    'deleted': {
                        pattern: RegExp('(^-(?:' + modifierRegex + ')?).+?(?=-)'),
                        lookbehind: true
                    },

                    // %span%
                    'span': {
                        pattern: RegExp('(^%(?:' + modifierRegex + ')?).+?(?=%)'),
                        lookbehind: true
                    },

                    'modifier': {
                        pattern: RegExp('(^\\*\\*|__|\\?\\?|[*_%@+\\-^~])' + modifierRegex),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'punctuation': /[*_%?@+\-^~]+/
                }
            },

            // [alias]http://example.com
            'link-ref': {
                pattern: /^\[[^\]]+\]\S+$/m,
                inside: {
                    'string': {
                        pattern: /(\[)[^\]]+(?=\])/,
                        lookbehind: true
                    },
                    'url': {
                        pattern: /(\])\S+$/,
                        lookbehind: true
                    },
                    'punctuation': /[\[\]]/
                }
            },

            // "text":http://example.com
            // "text":link-ref
            'link': {
                pattern: RegExp('"(?:' + modifierRegex + ')?[^"]+":.+?(?=[^\\w/]?(?:\\s|$))'),
                inside: {
                    'text': {
                        pattern: RegExp('(^"(?:' + modifierRegex + ')?)[^"]+(?=")'),
                        lookbehind: true
                    },
                    'modifier': {
                        pattern: RegExp('(^")' + modifierRegex),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'url': {
                        pattern: /(:).+/,
                        lookbehind: true
                    },
                    'punctuation': /[":]/
                }
            },

            // !image.jpg!
            // !image.jpg(Title)!:http://example.com
            'image': {
                pattern: RegExp('!(?:' + modifierRegex + '|[<>=()])*[^!\\s()]+(?:\\([^)]+\\))?!(?::.+?(?=[^\\w/]?(?:\\s|$)))?'),
                inside: {
                    'source': {
                        pattern: RegExp('(^!(?:' + modifierRegex + '|[<>=()])*)[^!\\s()]+(?:\\([^)]+\\))?(?=!)'),
                        lookbehind: true,
                        alias: 'url'
                    },
                    'modifier': {
                        pattern: RegExp('(^!)(?:' + modifierRegex + '|[<>=()])+'),
                        lookbehind: true,
                        inside: cloneGrammar(modifierTokens)
                    },
                    'url': {
                        pattern: /(:).+/,
                        lookbehind: true
                    },
                    'punctuation': /[!:]/
                }
            },

            // 脚注引用，例如 Footnote[1]
            'footnote': {
                pattern: /\b\[\d+\]/,
                alias: 'comment',
                inside: {
                    'punctuation': /\[|\]/
                }
            },

            // 样式表名称或缩写。
            'acronym': {
                pattern: /\b[A-Z\d]+\([^)]+\)/,
                inside: {
                    'comment': {
                        pattern: /(\()[^)]+(?=\))/,
                        lookbehind: true
                    },
                    'punctuation': /[()]/
                }
            },

            // 括号中的语言名指定高亮词法，例如 highlight(C)。
            'mark': {
                pattern: /\b\((TM|R|C)\)/,
                alias: 'comment',
                inside: {
                    'punctuation': /[()]/
                }
            }
        }
    }
});

var nestedPatterns = {
    'inline': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline']),
    'link': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['link']),
    'image': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['image']),
    'footnote': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['footnote']),
    'acronym': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['acronym']),
    'mark': cloneGrammar(insideGrammar(highlight.languages.textile!['phrase'])['mark'])
};

// 支持有限嵌套。
grammarPattern(insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline'])['bold']).inside = nestedPatterns;
grammarPattern(insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline'])['italic']).inside = nestedPatterns;
grammarPattern(insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline'])['inserted']).inside = nestedPatterns;
grammarPattern(insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline'])['deleted']).inside = nestedPatterns;
grammarPattern(insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['inline'])['span']).inside = nestedPatterns;

// 单元格内容允许部分行内样式。
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['inline'] = nestedPatterns['inline'];
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['link'] = nestedPatterns['link'];
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['image'] = nestedPatterns['image'];
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['footnote'] = nestedPatterns['footnote'];
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['acronym'] = nestedPatterns['acronym'];
insideGrammar(insideGrammar(highlight.languages.textile!['phrase'])['table'])['mark'] = nestedPatterns['mark'];
