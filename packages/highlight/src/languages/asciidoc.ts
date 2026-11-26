/**
 * `@sugars/highlight` 内置的 `asciidoc` 词法。
 *
 * 识别 AsciiDoc 的块结构、属性和列表标记，并在相应内容中应用嵌套规则。
 */

import { highlighter as highlight } from '../core.js'
import { insideGrammar } from '../grammar.js'

// 括号中排除竖线，以免吞掉表格分隔符，例如 |(. foo |). bar |。
var attributes = {
    pattern: /(^[ \t]*)\[(?!\[)(?:(["'$`])(?:(?!\2)[^\\]|\\.)*\2|\[(?:[^\]\\]|\\.)*\]|[^\]\\]|\\.)*\]/m,
    lookbehind: true,
    inside: {
        'quoted': {
            pattern: /([$`])(?:(?!\1)[^\\]|\\.)*\1/,
            inside: {
                'punctuation': /^[$`]|[$`]$/
            }
        },
        'interpreted': {
            pattern: /'(?:[^'\\]|\\.)*'/,
            inside: {
                'punctuation': /^'|'$/
                    // 嵌套规则在下方补入。
            }
        },
        'string': /"(?:[^"\\]|\\.)*"/,
        'variable': /\w+(?==)/,
        'punctuation': /^\[|\]$|,/,
        'operator': /=/,
        // 否定前瞻排除空白匹配。
        'attr-value': /(?!^\s+$).+/
    }
};
highlight.languages.asciidoc = {
    'comment-block': {
        pattern: /^(\/{4,})(?:\r?\n|\r)(?:.*(?:\r?\n|\r))*?\1/m,
        alias: 'comment'
    },
    // 表格要先确定单元格的分隔位置，再把各单元格交给正文规则。属性里的竖线可能影响这一边界。
    'table': {
        pattern: /^\|={3,}(?:(?:\r?\n|\r).*)*?(?:\r?\n|\r)\|={3,}$/m,
        inside: {
            'specifiers': {
                pattern: /(?!\|)(?:(?:(?:\d+(?:\.\d+)?|\.\d+)[+*])?(?:[<^>](?:\.[<^>])?|\.[<^>])?[a-z]*)(?=\|)/,
                alias: 'attr-value'
            },
            'punctuation': {
                pattern: /(^|[^\\])[|!]=*/,
                lookbehind: true
            }
            // 嵌套规则在下方补入。
        }
    },

    'passthrough-block': {
        pattern: /^(\+{4,})(?:\r?\n|\r)(?:.*(?:\r?\n|\r))*?\1$/m,
        inside: {
            'punctuation': /^\++|\++$/
                // 嵌套规则在下方补入。
        }
    },
    // 文字块和列表式代码块。
    'literal-block': {
        pattern: /^(-{4,}|\.{4,})(?:\r?\n|\r)(?:.*(?:\r?\n|\r))*?\1$/m,
        inside: {
            'punctuation': /^(?:-+|\.+)|(?:-+|\.+)$/
                // 嵌套规则在下方补入。
        }
    },
    // 边栏、引用、示例和开放块。
    'other-block': {
        pattern: /^(--|\*{4,}|_{4,}|={4,})(?:\r?\n|\r)(?:.*(?:\r?\n|\r))*?\1$/m,
        inside: {
            'punctuation': /^(?:-+|\*+|_+|=+)|(?:-+|\*+|_+|=+)$/
                // 嵌套规则在下方补入。
        }
    },

    // 列表标记和标签必须在缩进块之前匹配。
    'list-punctuation': {
        pattern: /(^[ \t]*)(?:-|\*{1,5}|\.{1,5}|(?:[a-z]|\d+)\.|[xvi]+\))(?= )/im,
        lookbehind: true,
        alias: 'punctuation'
    },
    'list-label': {
        pattern: /(^[ \t]*)[a-z\d].+(?::{2,4}|;;)(?=\s)/im,
        lookbehind: true,
        alias: 'symbol'
    },
    'indented-block': {
        pattern: /((\r?\n|\r)\2)([ \t]+)\S.*(?:(?:\r?\n|\r)\3.+)*(?=\2{2}|$)/,
        lookbehind: true
    },

    'comment': /^\/\/.*/m,
    'title': {
        pattern: /^.+(?:\r?\n|\r)(?:={3,}|-{3,}|~{3,}|\^{3,}|\+{3,})$|^={1,5} +.+|^\.(?![\s.]).*/m,
        alias: 'important',
        inside: {
            'punctuation': /^(?:\.|=+)|(?:=+|-+|~+|\^+|\++)$/
                // 嵌套规则在下方补入。
        }
    },
    'attribute-entry': {
        pattern: /^:[^:\r\n]+:(?: .*?(?: \+(?:\r?\n|\r).*?)*)?$/m,
        alias: 'tag'
    },
    'attributes': attributes,
    'hr': {
        pattern: /^'{3,}$/m,
        alias: 'punctuation'
    },
    'page-break': {
        pattern: /^<{3,}$/m,
        alias: 'punctuation'
    },
    'admonition': {
        pattern: /^(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION):/m,
        alias: 'keyword'
    },
    'callout': [{
            pattern: /(^[ \t]*)<?\d*>/m,
            lookbehind: true,
            alias: 'symbol'
        },
        {
            pattern: /<\d+>/,
            alias: 'symbol'
        }
    ],
    'macro': {
        pattern: /\b[a-z\d][a-z\d-]*::?(?:(?:\S+)??\[(?:[^\]\\"]|(["'])(?:(?!\1)[^\\]|\\.)*\1|\\.)*\])/,
        inside: {
            'function': /^[a-z\d-]+(?=:)/,
            'punctuation': /^::?/,
            'attributes': {
                pattern: /(?:\[(?:[^\]\\"]|(["'])(?:(?!\1)[^\\]|\\.)*\1|\\.)*\])/,
                inside: attributes.inside
            }
        }
    },
    'inline': {
        /*
        The initial look-behind prevents the highlighting of escaped quoted text.

        Quoted text can be multi-line but cannot span an empty line.
        All quoted text can have attributes before [foobar, 'foobar', baz="bar"].

        First, we handle the constrained quotes.
        Those must be bounded by non-word chars and cannot have spaces between the delimiter and the first char.
        They are, in order: _emphasis_, ``double quotes'', `single quotes', `monospace`, 'emphasis', *strong*, +monospace+ and #unquoted#

        Then we handle the unconstrained quotes.
        Those do not have the restrictions of the constrained quotes.
        They are, in order: __emphasis__, **strong**, ++monospace++, +++passthrough+++, ##unquoted##, $$passthrough$$, ~subscript~, ^superscript^, {attribute-reference}, [[anchor]], [[[bibliography anchor]]], <<xref>>, (((indexes))) and ((indexes))
         */
        pattern: /(^|[^\\])(?:(?:\B\[(?:[^\]\\"]|(["'])(?:(?!\2)[^\\]|\\.)*\2|\\.)*\])?(?:\b_(?!\s)(?: _|[^_\\\r\n]|\\.)+(?:(?:\r?\n|\r)(?: _|[^_\\\r\n]|\\.)+)*_\b|\B``(?!\s).+?(?:(?:\r?\n|\r).+?)*''\B|\B`(?!\s)(?: ['`]|.)+?(?:(?:\r?\n|\r)(?: ['`]|.)+?)*['`]\B|\B(['*+#])(?!\s)(?: \3|(?!\3)[^\\\r\n]|\\.)+(?:(?:\r?\n|\r)(?: \3|(?!\3)[^\\\r\n]|\\.)+)*\3\B)|(?:\[(?:[^\]\\"]|(["'])(?:(?!\4)[^\\]|\\.)*\4|\\.)*\])?(?:(__|\*\*|\+\+\+?|##|\$\$|[~^]).+?(?:(?:\r?\n|\r).+?)*\5|\{[^}\r\n]+\}|\[\[\[?.+?(?:(?:\r?\n|\r).+?)*\]?\]\]|<<.+?(?:(?:\r?\n|\r).+?)*>>|\(\(\(?.+?(?:(?:\r?\n|\r).+?)*\)?\)\)))/m,
        lookbehind: true,
        inside: {
            'attributes': attributes,
            'url': {
                pattern: /^(?:\[\[\[?.+?\]?\]\]|<<.+?>>)$/,
                inside: {
                    'punctuation': /^(?:\[\[\[?|<<)|(?:\]\]\]?|>>)$/
                }
            },
            'attribute-ref': {
                pattern: /^\{.+\}$/,
                inside: {
                    'variable': {
                        pattern: /(^\{)[a-z\d,+_-]+/,
                        lookbehind: true
                    },
                    'operator': /^[=?!#%@$]|!(?=[:}])/,
                    'punctuation': /^\{|\}$|::?/
                }
            },
            'italic': {
                pattern: /^(['_])[\s\S]+\1$/,
                inside: {
                    'punctuation': /^(?:''?|__?)|(?:''?|__?)$/
                }
            },
            'bold': {
                pattern: /^\*[\s\S]+\*$/,
                inside: {
                    punctuation: /^\*\*?|\*\*?$/
                }
            },
            'punctuation': /^(?:``?|\+{1,3}|##?|\$\$|[~^]|\(\(\(?)|(?:''?|\+{1,3}|##?|\$\$|[~^`]|\)?\)\))$/
        }
    },
    'replacement': {
        pattern: /\((?:C|TM|R)\)/,
        alias: 'builtin'
    },
    'entity': /&#?[\da-z]{1,8};/i,
    'line-continuation': {
        pattern: /(^| )\+$/m,
        lookbehind: true,
        alias: 'punctuation'
    }
};


// 支持有限嵌套，规则关系无递归，可直接复用。

insideGrammar(attributes.inside['interpreted']).rest = {
    'macro': highlight.languages.asciidoc['macro'],
    'inline': highlight.languages.asciidoc['inline'],
    'replacement': highlight.languages.asciidoc['replacement'],
    'entity': highlight.languages.asciidoc['entity']
};

insideGrammar(highlight.languages.asciidoc!['passthrough-block']).rest = {
    'macro': highlight.languages.asciidoc['macro']
};

insideGrammar(highlight.languages.asciidoc!['literal-block']).rest = {
    'callout': highlight.languages.asciidoc['callout']
};

insideGrammar(highlight.languages.asciidoc!['table']).rest = {
    'comment-block': highlight.languages.asciidoc['comment-block'],
    'passthrough-block': highlight.languages.asciidoc['passthrough-block'],
    'literal-block': highlight.languages.asciidoc['literal-block'],
    'other-block': highlight.languages.asciidoc['other-block'],
    'list-punctuation': highlight.languages.asciidoc['list-punctuation'],
    'indented-block': highlight.languages.asciidoc['indented-block'],
    'comment': highlight.languages.asciidoc['comment'],
    'title': highlight.languages.asciidoc['title'],
    'attribute-entry': highlight.languages.asciidoc['attribute-entry'],
    'attributes': highlight.languages.asciidoc['attributes'],
    'hr': highlight.languages.asciidoc['hr'],
    'page-break': highlight.languages.asciidoc['page-break'],
    'admonition': highlight.languages.asciidoc['admonition'],
    'list-label': highlight.languages.asciidoc['list-label'],
    'callout': highlight.languages.asciidoc['callout'],
    'macro': highlight.languages.asciidoc['macro'],
    'inline': highlight.languages.asciidoc['inline'],
    'replacement': highlight.languages.asciidoc['replacement'],
    'entity': highlight.languages.asciidoc['entity'],
    'line-continuation': highlight.languages.asciidoc['line-continuation']
};

insideGrammar(highlight.languages.asciidoc!['other-block']).rest = {
    'table': highlight.languages.asciidoc['table'],
    'list-punctuation': highlight.languages.asciidoc['list-punctuation'],
    'indented-block': highlight.languages.asciidoc['indented-block'],
    'comment': highlight.languages.asciidoc['comment'],
    'attribute-entry': highlight.languages.asciidoc['attribute-entry'],
    'attributes': highlight.languages.asciidoc['attributes'],
    'hr': highlight.languages.asciidoc['hr'],
    'page-break': highlight.languages.asciidoc['page-break'],
    'admonition': highlight.languages.asciidoc['admonition'],
    'list-label': highlight.languages.asciidoc['list-label'],
    'macro': highlight.languages.asciidoc['macro'],
    'inline': highlight.languages.asciidoc['inline'],
    'replacement': highlight.languages.asciidoc['replacement'],
    'entity': highlight.languages.asciidoc['entity'],
    'line-continuation': highlight.languages.asciidoc['line-continuation']
};

insideGrammar(highlight.languages.asciidoc!['title']).rest = {
    'macro': highlight.languages.asciidoc['macro'],
    'inline': highlight.languages.asciidoc['inline'],
    'replacement': highlight.languages.asciidoc['replacement'],
    'entity': highlight.languages.asciidoc['entity']
};

// 实体提示展示解码后的字符，做法来自 Roman Komarov。
highlight.hooks.add('wrap', function(env) {
    if (env.type === 'entity') {
        env.attributes['title'] = env.content.replace(/&amp;/, '&');
    }
});
