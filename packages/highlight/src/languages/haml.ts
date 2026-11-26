/**
 * `@sugars/highlight` 内置的 `haml` 词法。
 *
 * 区分 Haml 缩进块、标记及脚本，并为过滤器选择嵌套词法。
 */

import { highlighter as highlight } from '../core.js'
import type { Grammar } from '../grammar.js'

var handlebars_pattern = /\{\{\{[\w\W]+?\}\}\}|\{\{[\w\W]+?\}\}/g;

highlight.languages.haml = {
    // 多行结构须先于普通规则匹配。

    'multiline-comment': {
        pattern: /((?:^|\r?\n|\r)([\t ]*))(?:\/|-#).*((?:\r?\n|\r)\2[\t ]+.+)*/,
        lookbehind: true,
        alias: 'comment'
    },

    'multiline-code': [{
            pattern: /((?:^|\r?\n|\r)([\t ]*)(?:[~-]|[&!]?=)).*,[\t ]*((?:\r?\n|\r)\2[\t ]+.*,[\t ]*)*((?:\r?\n|\r)\2[\t ]+.+)/,
            lookbehind: true,
            inside: {
                rest: highlight.languages.ruby
            }
        },
        {
            pattern: /((?:^|\r?\n|\r)([\t ]*)(?:[~-]|[&!]?=)).*\|[\t ]*((?:\r?\n|\r)\2[\t ]+.*\|[\t ]*)*/,
            lookbehind: true,
            inside: {
                rest: highlight.languages.ruby
            }
        }
    ],

    // 支持的过滤器在文件末尾登记。
    // 先用缩进划定过滤块范围，再由底部登记的过滤器规则决定内容用哪门语言处理。
    'filter': {
        pattern: /((?:^|\r?\n|\r)([\t ]*)):[\w-]+((?:\r?\n|\r)(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/,
        lookbehind: true,
        inside: {
            'filter-name': {
                pattern: /^:[\w-]+/,
                alias: 'variable'
            }
        }
    },

    'markup': {
        pattern: /((?:^|\r?\n|\r)[\t ]*)<.+/,
        lookbehind: true,
        inside: {
            rest: highlight.languages.markup
        }
    },
    'doctype': {
        pattern: /((?:^|\r?\n|\r)[\t ]*)!!!(?: .+)?/,
        lookbehind: true
    },
    'tag': {
        // 允许一层内嵌花括号。
        pattern: /((?:^|\r?\n|\r)[\t ]*)[%.#][\w\-#.]*[\w\-](?:\([^)]+\)|\{(?:\{[^}]+\}|[^}])+\}|\[[^\]]+\])*[\/<>]*/,
        lookbehind: true,
        inside: {
            'attributes': [{
                    // 后顾用于避开会截断外层插值的匹配。
                    // 允许一层内嵌花括号。
                    pattern: /(^|[^#])\{(?:\{[^}]+\}|[^}])+\}/,
                    lookbehind: true,
                    inside: {
                        rest: highlight.languages.ruby
                    }
                },
                {
                    pattern: /\([^)]+\)/,
                    inside: {
                        'attr-value': {
                            pattern: /(=\s*)(?:"(?:\\?.)*?"|[^)\s]+)/,
                            lookbehind: true
                        },
                        'attr-name': /[\w:-]+(?=\s*!?=|\s*[,)])/,
                        'punctuation': /[=(),]/
                    }
                },
                {
                    pattern: /\[[^\]]+\]/,
                    inside: {
                        rest: highlight.languages.ruby
                    }
                }
            ],
            'punctuation': /[<>]/
        }
    },
    'code': {
        pattern: /((?:^|\r?\n|\r)[\t ]*(?:[~-]|[&!]?=)).+/,
        lookbehind: true,
        inside: {
            rest: highlight.languages.ruby
        }
    },
    // 纯文本中的插值。
    'interpolation': {
        pattern: /#\{[^}]+\}/,
        inside: {
            'delimiter': {
                pattern: /^#\{|\}$/,
                alias: 'punctuation'
            },
            rest: highlight.languages.ruby
        }
    },
    'punctuation': {
        pattern: /((?:^|\r?\n|\r)[\t ]*)[~=\-&!]+/,
        lookbehind: true
    }
};

var filter_pattern = '((?:^|\\r?\\n|\\r)([\\t ]*)):{{filter_name}}((?:\\r?\\n|\\r)(?:\\2[\\t ]+.+|\\s*?(?=\\r?\\n|\\r)))+';

// 登记已支持的过滤器和对应词法。
var filters = [
    'css',
    { filter: 'coffee', language: 'coffeescript' },
    'erb',
    'javascript',
    'less',
    'markdown',
    'ruby',
    'scss',
    'textile'
];
var all_filters: Grammar = {};
for (var i = 0, l = filters.length; i < l; i++) {
    var filter = filters[i]!;
    filter = typeof filter === 'string' ? { filter: filter, language: filter } : filter;
    if (highlight.languages[filter.language]) {
        all_filters['filter-' + filter.filter] = {
            pattern: RegExp(filter_pattern.replace('{{filter_name}}', filter.filter)),
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

highlight.languages.insertBefore('haml', 'filter', all_filters);
