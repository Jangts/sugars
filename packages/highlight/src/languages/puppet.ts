/**
 * `@sugars/highlight` 内置的 `puppet` 词法。
 *
 * 识别 Puppet 的资源属性与插值，双引号文本和 heredoc 共用插值规则。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarRules, insideGrammar } from '../grammar.js'

highlight.languages.puppet = {
    // 带引号和不带引号的 heredoc 使用各自候选。只有按语法允许插值的内容才带插值词法。
    'heredoc': [
        // 带引号的 heredoc 内容允许插值。
        {
            pattern: /(@\("([^"\r\n\/):]+)"(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r))*?[ \t]*\|?[ \t]*-?[ \t]*\2/,
            lookbehind: true,
            alias: 'string',
            inside: {
                // 匹配结束标记。
                'punctuation': /(?=\S).*\S(?= *$)/
                    // 插值词法在下方补入。
            }
        },
        // 无引号的 heredoc 内容按普通字符串处理。
        {
            pattern: /(@\(([^"\r\n\/):]+)(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r))*?[ \t]*\|?[ \t]*-?[ \t]*\2/,
            lookbehind: true,
            alias: 'string',
            inside: {
                // 匹配结束标记。
                'punctuation': /(?=\S).*\S(?= *$)/
            }
        },
        // 匹配 heredoc 的起始标记。
        {
            pattern: /@\("?(?:[^"\r\n\/):]+)"?(?:\/[nrts$uL]*)?\)/,
            alias: 'string',
            inside: {
                'punctuation': {
                    pattern: /(\().+?(?=\))/,
                    lookbehind: true
                }
            }
        }
    ],
    'multiline-comment': {
        pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
        lookbehind: true,
        alias: 'comment'
    },
    'regex': {
        // 前面必须是 node 关键字或非单词字符。
        pattern: /((?:\bnode\s+|[^\s\w\\]\s*))\/(?:[^\/\\]|\\[\s\S])+\/(?:[imx]+\b|\B)/,
        lookbehind: true,
        inside: {
            // 扩展正则须使用 x 标志，其中允许单行注释。
            'extended-regex': {
                pattern: /^\/(?:[^\/\\]|\\[\s\S])+\/[im]*x[im]*$/,
                inside: {
                    'comment': /#.*/
                }
            }
        }
    },
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true
    },
    'string': {
        // 插值表达式内允许一层双引号。
        pattern: /(["'])(?:\$\{(?:[^'"}]|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}|(?!\1)[^\\]|\\[\s\S])*\1/,
        inside: {
            'double-quoted': {
                pattern: /^"[\s\S]*"$/,
                inside: {
                    // 插值词法在下方补入。
                }
            }
        }
    },
    'variable': {
        pattern: /\$(?:::)?\w+(?:::\w+)*/,
        inside: {
            'punctuation': /::/
        }
    },
    'attr-name': /(?:\w+|\*)(?=\s*=>)/,
    'function': [{
            pattern: /(\.)(?!\d)\w+/,
            lookbehind: true
        },
        /\b(?:contain|debug|err|fail|include|info|notice|realize|require|tag|warning)\b|\b(?!\d)\w+(?=\()/
    ],
    'number': /\b(?:0x[a-f\d]+|\d+(?:\.\d+)?(?:e-?\d+)?)\b/i,
    'boolean': /\b(?:true|false)\b/,
    // 包含为以后保留的关键字。
    'keyword': /\b(?:application|attr|case|class|consumes|default|define|else|elsif|function|if|import|inherits|node|private|produces|type|undef|unless)\b/,
    'datatype': {
        pattern: /\b(?:Any|Array|Boolean|Callable|Catalogentry|Class|Collection|Data|Default|Enum|Float|Hash|Integer|NotUndef|Numeric|Optional|Pattern|Regexp|Resource|Runtime|Scalar|String|Struct|Tuple|Type|Undef|Variant)\b/,
        alias: 'symbol'
    },
    'operator': /=[=~>]?|![=~]?|<(?:<\|?|[=~|-])?|>[>=]?|->?|~>|\|>?>?|[*\/%+?]|\b(?:and|in|or)\b/,
    'punctuation': /[\[\]{}().,;]|:+/
};

var interpolation = [{
        // 插值中允许一层嵌套花括号。
        pattern: /(^|[^\\])\$\{(?:[^'"{}]|\{[^}]*\}|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}/,
        lookbehind: true,
        inside: {
            'short-variable': {
                // 否定前瞻避免把函数误标为变量。
                pattern: /(^\$\{)(?!\w+\()(?:::)?\w+(?:::\w+)*/,
                lookbehind: true,
                alias: 'variable',
                inside: {
                    'punctuation': /::/
                }
            },
            'delimiter': {
                pattern: /^\$/,
                alias: 'variable'
            },
            rest: cloneGrammar(highlight.languages.puppet)
        }
    },
    {
        pattern: /(^|[^\\])\$(?:::)?\w+(?:::\w+)*/,
        lookbehind: true,
        alias: 'variable',
        inside: {
            'punctuation': /::/
        }
    }
];
insideGrammar(grammarRules(highlight.languages.puppet!['heredoc'])[0]!).interpolation = interpolation;
insideGrammar(insideGrammar(highlight.languages.puppet!['string'])['double-quoted']).interpolation = interpolation;
