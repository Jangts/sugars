/**
 * `@sugars/highlight` 内置的 `rest` 词法。
 *
 * 识别 reStructuredText 的指令、替换定义、表格和内联标记。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.rest = {
    'table': [{
            pattern: /(\s*)(?:\+[=-]+)+\+(?:\r?\n|\r)(?:\1(?:[+|].+)+[+|](?:\r?\n|\r))+\1(?:\+[=-]+)+\+/,
            lookbehind: true,
            inside: {
                'punctuation': /\||(?:\+[=-]+)+\+/
            }
        },
        {
            pattern: /(\s*)(?:=+ +)+=+((?:\r?\n|\r)\1.+)+(?:\r?\n|\r)\1(?:=+ +)+=+(?=(?:\r?\n|\r){2}|\s*$)/,
            lookbehind: true,
            inside: {
                'punctuation': /[=-]+/
            }
        }
    ],

    // 类指令的标记。
    'substitution-def': {
        pattern: /(^\s*\.\. )\|(?:[^|\s](?:[^|]*[^|\s])?)\| [^:]+::/m,
        lookbehind: true,
        inside: {
            'substitution': {
                pattern: /^\|(?:[^|\s]|[^|\s][^|]*[^|\s])\|/,
                alias: 'attr-value',
                inside: {
                    'punctuation': /^\||\|$/
                }
            },
            'directive': {
                pattern: /( +)[^:]+::/,
                lookbehind: true,
                alias: 'function',
                inside: {
                    'punctuation': /::$/
                }
            }
        }
    },
    'link-target': [{
            pattern: /(^\s*\.\. )\[[^\]]+\]/m,
            lookbehind: true,
            alias: 'string',
            inside: {
                'punctuation': /^\[|\]$/
            }
        },
        {
            pattern: /(^\s*\.\. )_(?:`[^`]+`|(?:[^:\\]|\\.)+):/m,
            lookbehind: true,
            alias: 'string',
            inside: {
                'punctuation': /^_|:$/
            }
        }
    ],
    // 类指令和替换标记须先于普通注释匹配。它们都可能借用相近的显式标记前缀。
    'directive': {
        pattern: /(^\s*\.\. )[^:]+::/m,
        lookbehind: true,
        alias: 'function',
        inside: {
            'punctuation': /::$/
        }
    },
    'comment': {
        // 两个分支均用于排除空白注释。
        pattern: /(^\s*\.\.)(?:(?: .+)?(?:(?:\r?\n|\r).+)+| .+)(?=(?:\r?\n|\r){2}|$)/m,
        lookbehind: true
    },

    'title': [
        // 上下都带修饰线的标题。
        {
            pattern: /^(([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+)(?:\r?\n|\r).+(?:\r?\n|\r)\1$/m,
            inside: {
                'punctuation': /^[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+|[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
                'important': /.+/
            }
        },

        // 仅有下方修饰线的标题。
        {
            pattern: /(^|(?:\r?\n|\r){2}).+(?:\r?\n|\r)([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+(?=\r?\n|\r|$)/,
            lookbehind: true,
            inside: {
                'punctuation': /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
                'important': /.+/
            }
        }
    ],
    'hr': {
        pattern: /((?:\r?\n|\r){2})([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2{3,}(?=(?:\r?\n|\r){2})/,
        lookbehind: true,
        alias: 'punctuation'
    },
    'field': {
        pattern: /(^\s*):[^:\r\n]+:(?= )/m,
        lookbehind: true,
        alias: 'attr-name'
    },
    'command-line-option': {
        pattern: /(^\s*)(?:[+-][a-z\d]|(?:\-\-|\/)[a-z\d-]+)(?:[ =](?:[a-z][a-z\d_-]*|<[^<>]+>))?(?:, (?:[+-][a-z\d]|(?:\-\-|\/)[a-z\d-]+)(?:[ =](?:[a-z][a-z\d_-]*|<[^<>]+>))?)*(?=(?:\r?\n|\r)? {2,}\S)/im,
        lookbehind: true,
        alias: 'symbol'
    },
    'literal-block': {
        pattern: /::(?:\r?\n|\r){2}([ \t]+).+(?:(?:\r?\n|\r)\1.+)*/,
        inside: {
            'literal-block-punctuation': {
                pattern: /^::/,
                alias: 'punctuation'
            }
        }
    },
    'quoted-literal-block': {
        pattern: /::(?:\r?\n|\r){2}([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]).*(?:(?:\r?\n|\r)\1.*)*/,
        inside: {
            'literal-block-punctuation': {
                pattern: /^(?:::|([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\1*)/m,
                alias: 'punctuation'
            }
        }
    },
    'list-bullet': {
        pattern: /(^\s*)(?:[*+\-•‣⁃]|\(?(?:\d+|[a-z]|[ivxdclm]+)\)|(?:\d+|[a-z]|[ivxdclm]+)\.)(?= )/im,
        lookbehind: true,
        alias: 'punctuation'
    },
    'doctest-block': {
        pattern: /(^\s*)>>> .+(?:(?:\r?\n|\r).+)*/m,
        lookbehind: true,
        inside: {
            'punctuation': /^>>>/
        }
    },

    'inline': [{
        pattern: /(^|[\s\-:\/'"<(\[{])(?::[^:]+:`.*?`|`.*?`:[^:]+:|(\*\*?|``?|\|)(?!\s).*?[^\s]\2(?=[\s\-.,:;!?\\\/'")\]}]|$))/m,
        lookbehind: true,
        inside: {
            'bold': {
                pattern: /(^\*\*).+(?=\*\*$)/,
                lookbehind: true
            },
            'italic': {
                pattern: /(^\*).+(?=\*$)/,
                lookbehind: true
            },
            'inline-literal': {
                pattern: /(^``).+(?=``$)/,
                lookbehind: true,
                alias: 'symbol'
            },
            'role': {
                pattern: /^:[^:]+:|:[^:]+:$/,
                alias: 'function',
                inside: {
                    'punctuation': /^:|:$/
                }
            },
            'interpreted-text': {
                pattern: /(^`).+(?=`$)/,
                lookbehind: true,
                alias: 'attr-value'
            },
            'substitution': {
                pattern: /(^\|).+(?=\|$)/,
                lookbehind: true,
                alias: 'attr-value'
            },
            'punctuation': /\*\*?|``?|\|/
        }
    }],

    'link': [{
            pattern: /\[[^\]]+\]_(?=[\s\-.,:;!?\\\/'")\]}]|$)/,
            alias: 'string',
            inside: {
                'punctuation': /^\[|\]_$/
            }
        },
        {
            pattern: /(?:\b[a-z\d](?:[_.:+]?[a-z\d]+)*_?_|`[^`]+`_?_|_`[^`]+`)(?=[\s\-.,:;!?\\\/'")\]}]|$)/i,
            alias: 'string',
            inside: {
                'punctuation': /^_?`|`$|`?_?_$/
            }
        }
    ],

    // 匹配行块开头、引文署名、显式标记开头和匿名链接入口 __。
    'punctuation': {
        pattern: /(^\s*)(?:\|(?= |$)|(?:---?|—|\.\.|__)(?= )|\.\.$)/m,
        lookbehind: true
    }
};
