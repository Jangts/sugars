/**
 * `@sugars/highlight` 内置的 `ruby` 词法。
 *
 * 识别 Ruby 的插值字符串、正则、符号、变量和内置常量。
 */

/*! Original by Samuel Flores */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar } from '../grammar.js'

highlight.languages.ruby = highlight.languages.extend('clike', {
    'comment': /#(?!\{[^\r\n]*?\}).*/,
    'keyword': /\b(alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/
});

var interpolation = {
    pattern: /#\{[^}]+\}/,
    inside: {
        'delimiter': {
            pattern: /^#\{|\}$/,
            alias: 'tag'
        },
        rest: cloneGrammar(highlight.languages.ruby)
    }
};

highlight.languages.insertBefore('ruby', 'keyword', {
    // 正则内部可含 Ruby 插值，所以定界符确认后仍需交给内层规则识别表达式。
    'regex': [{
            pattern: /%r([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1[gim]{0,3}/,
            inside: {
                'interpolation': interpolation
            }
        },
        {
            pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
            inside: {
                'interpolation': interpolation
            }
        },
        {
            // 此处显式允许字符串插值。
            pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
            inside: {
                'interpolation': interpolation
            }
        },
        {
            pattern: /%r\[(?:[^\[\]\\]|\\[\s\S])*\][gim]{0,3}/,
            inside: {
                'interpolation': interpolation
            }
        },
        {
            pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
            inside: {
                'interpolation': interpolation
            }
        },
        {
            pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
            lookbehind: true
        }
    ],
    'variable': /[@$]+[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\b)/,
    'symbol': /:[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\b)/
});

highlight.languages.insertBefore('ruby', 'number', {
    'builtin': /\b(Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|File|Fixnum|Fload|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
    'constant': /\b[A-Z][a-zA-Z_0-9]*(?:[?!]|\b)/
});

highlight.languages.ruby.string = [{
        pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1/,
        inside: {
            'interpolation': interpolation
        }
    },
    {
        pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
        inside: {
            'interpolation': interpolation
        }
    },
    {
        // 此处显式允许字符串插值。
        pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
        inside: {
            'interpolation': interpolation
        }
    },
    {
        pattern: /%[qQiIwWxs]?\[(?:[^\[\]\\]|\\[\s\S])*\]/,
        inside: {
            'interpolation': interpolation
        }
    },
    {
        pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
        inside: {
            'interpolation': interpolation
        }
    },
    {
        pattern: /("|')(#\{[^}]+\}|\\(?:\r?\n|\r)|\\?.)*?\1/,
        inside: {
            'interpolation': interpolation
        }
    }
];
