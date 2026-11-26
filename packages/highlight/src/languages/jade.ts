/**
 * `@sugars/highlight` 内置的 `jade` 词法。
 *
 * 识别 Jade 标签、过滤器和流程控制。脚本与对应的过滤内容交给嵌套词法。
 */

import { highlighter as highlight } from '../core.js'
import type { Grammar } from '../grammar.js'

// 旧规则的待补项包括 style 内 CSS、多行代码块、#{}、!{} 与 #[] 插值，以及用竖线引入的文本和其中的标记。

highlight.languages.jade = {

    // 多行结构须先于普通规则匹配。

    // 覆盖单行注释及缩进的多行注释。
    'comment': {
        pattern: /(^([\t ]*))\/\/.*((?:\r?\n|\r)\2[\t ]+.+)*/m,
        lookbehind: true
    },

    // 标签部分保留在后顾范围内，交给 tag 规则处理。
    // 脚本块要连同缩进内的行一起匹配，避免后续标签规则在代码片段里误找标签。
    'multiline-script': {
        pattern: /(^([\t ]*)script\b.*\.[\t ]*)((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
        lookbehind: true,
        inside: {
            rest: highlight.languages.javascript
        }
    },

    // 支持的过滤器在文件末尾登记。
    'filter': {
        pattern: /(^([\t ]*)):.+((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
        lookbehind: true,
        inside: {
            'filter-name': {
                pattern: /^:[\w-]+/,
                alias: 'variable'
            }
        }
    },

    'multiline-plain-text': {
        pattern: /(^([\t ]*)[\w\-#.]+\.[\t ]*)((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
        lookbehind: true
    },
    'markup': {
        pattern: /(^[\t ]*)<.+/m,
        lookbehind: true,
        inside: {
            rest: highlight.languages.markup
        }
    },
    'doctype': {
        pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
        lookbehind: true
    },

    // 匹配条件和循环关键字。
    'flow-control': {
        pattern: /(^[\t ]*)(?:if|unless|else|case|when|default|each|while)\b(?: .+)?/m,
        lookbehind: true,
        inside: {
            'each': {
                pattern: /^each .+? in\b/,
                inside: {
                    'keyword': /\b(?:each|in)\b/,
                    'punctuation': /,/
                }
            },
            'branch': {
                pattern: /^(?:if|unless|else|case|when|default|while)\b/,
                alias: 'keyword'
            },
            rest: highlight.languages.javascript
        }
    },
    'keyword': {
        pattern: /(^[\t ]*)(?:block|extends|include|append|prepend)\b.+/m,
        lookbehind: true
    },
    'mixin': [
        // 声明。
        {
            pattern: /(^[\t ]*)mixin .+/m,
            lookbehind: true,
            inside: {
                'keyword': /^mixin/,
                'function': /\w+(?=\s*\(|\s*$)/,
                'punctuation': /[(),.]/
            }
        },
        // 调用。
        {
            pattern: /(^[\t ]*)\+.+/m,
            lookbehind: true,
            inside: {
                'name': {
                    pattern: /^\+\w+/,
                    alias: 'function'
                },
                'rest': highlight.languages.javascript
            }
        }
    ],
    'script': {
        pattern: /(^[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*[\t ]+).+/m,
        lookbehind: true,
        inside: {
            rest: highlight.languages.javascript
        }
    },

    'plain-text': {
        pattern: /(^[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/m,
        lookbehind: true
    },
    'tag': {
        pattern: /(^[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/m,
        lookbehind: true,
        inside: {
            'attributes': [{
                    pattern: /&[^(]+\([^)]+\)/,
                    inside: {
                        rest: highlight.languages.javascript
                    }
                },
                {
                    pattern: /\([^)]+\)/,
                    inside: {
                        'attr-value': {
                            pattern: /(=\s*)(?:\{[^}]*\}|[^,)\r\n]+)/,
                            lookbehind: true,
                            inside: {
                                rest: highlight.languages.javascript
                            }
                        },
                        'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
                        'punctuation': /[!=(),]+/
                    }
                }
            ],
            'punctuation': /:/
        }
    },
    'code': [{
        pattern: /(^[\t ]*(?:-|!?=)).+/m,
        lookbehind: true,
        inside: {
            rest: highlight.languages.javascript
        }
    }],
    'punctuation': /[.\-!=|]+/
};

var filter_pattern = '(^([\\t ]*)):{{filter_name}}((?:\\r?\\n|\\r(?!\\n))(?:\\2[\\t ]+.+|\\s*?(?=\\r?\\n|\\r)))+';

// 登记已支持的过滤器和对应词法。
var filters = [
    { filter: 'atpl', language: 'twig' },
    { filter: 'coffee', language: 'coffeescript' },
    'ejs',
    'handlebars',
    'hogan',
    'less',

    'livescript',
    'markdown',
    'mustache',
    'plates',
    { filter: 'sass', language: 'scss' },
    'stylus',
    'swig'

];
var all_filters: Grammar = {};
for (var i = 0, l = filters.length; i < l; i++) {
    var filter = filters[i]!;
    filter = typeof filter === 'string' ? { filter: filter, language: filter } : filter;
    if (highlight.languages[filter.language]) {
        all_filters['filter-' + filter.filter] = {
            pattern: RegExp(filter_pattern.replace('{{filter_name}}', filter.filter), 'm'),
            lookbehind: true,
            inside: {
                'filter-name': {
                    pattern: /^:[\w-]+/,
                    alias: 'variable'
                },
                rest: highlight.languages[filter.language]
            }
        }
    }
}

highlight.languages.insertBefore('jade', 'filter', all_filters);
