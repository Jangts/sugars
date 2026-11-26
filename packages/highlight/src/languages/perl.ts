/**
 * `@sugars/highlight` 内置的 `perl` 词法。
 *
 * 区分 Perl 的正则、字符串和带前缀的变量。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.perl = {
    'comment': [{
            // POD
            pattern: /(^\s*)=\w+[\s\S]*?=cut.*/m,
            lookbehind: true
        },
        {
            pattern: /(^|[^\\$])#.*/,
            lookbehind: true
        }
    ],
    // 待补充 Heredoc 词法。
    'string': [
        // q/.../
        /\b(?:q|qq|qx|qw)\s*([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1/,

        // q a...a
        /\b(?:q|qq|qx|qw)\s+([a-zA-Z0-9])(?:[^\\]|\\[\s\S])*?\1/,

        // q(...)
        /\b(?:q|qq|qx|qw)\s*\((?:[^()\\]|\\[\s\S])*\)/,

        // q{...}
        /\b(?:q|qq|qx|qw)\s*\{(?:[^{}\\]|\\[\s\S])*\}/,

        // q[...]
        /\b(?:q|qq|qx|qw)\s*\[(?:[^[\]\\]|\\[\s\S])*\]/,

        // q<...>
        /\b(?:q|qq|qx|qw)\s*<(?:[^<>\\]|\\[\s\S])*>/,

        // "...", `...`
        /("|`)(?:[^\\]|\\[\s\S])*?\1/,

        // '...'
        // 暂未支持多行单引号字符串，以免误伤包含单引号的变量。
        /'(?:[^'\\\r\n]|\\.)*'/
    ],
    // m、s 等运算支持多种成对分隔符。规则按分隔符分别匹配，避免通用斜线分支误吞除法。
    'regex': [
        // m/.../
        /\b(?:m|qr)\s*([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1[msixpodualngc]*/,

        // m a...a
        /\b(?:m|qr)\s+([a-zA-Z0-9])(?:[^\\]|\\.)*?\1[msixpodualngc]*/,

        // m(...)
        /\b(?:m|qr)\s*\((?:[^()\\]|\\[\s\S])*\)[msixpodualngc]*/,

        // m{...}
        /\b(?:m|qr)\s*\{(?:[^{}\\]|\\[\s\S])*\}[msixpodualngc]*/,

        // m[...]
        /\b(?:m|qr)\s*\[(?:[^[\]\\]|\\[\s\S])*\][msixpodualngc]*/,

        // m<...>
        /\b(?:m|qr)\s*<(?:[^<>\\]|\\[\s\S])*>[msixpodualngc]*/,

        // 后顾用于保留 -s 的原匹配。
        // 暂未支持 s(...)[...] 这样的混用定界符。
        // s/.../.../
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s*([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\2(?:[^\\]|\\[\s\S])*?\2[msixpodualngcer]*/,
            lookbehind: true
        },

        // s a...a...a
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s+([a-zA-Z0-9])(?:[^\\]|\\[\s\S])*?\2(?:[^\\]|\\[\s\S])*?\2[msixpodualngcer]*/,
            lookbehind: true
        },

        // s(...)(...)
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s*\((?:[^()\\]|\\[\s\S])*\)\s*\((?:[^()\\]|\\[\s\S])*\)[msixpodualngcer]*/,
            lookbehind: true
        },

        // s{...}{...}
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s*\{(?:[^{}\\]|\\[\s\S])*\}\s*\{(?:[^{}\\]|\\[\s\S])*\}[msixpodualngcer]*/,
            lookbehind: true
        },

        // s[...][...]
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s*\[(?:[^[\]\\]|\\[\s\S])*\]\s*\[(?:[^[\]\\]|\\[\s\S])*\][msixpodualngcer]*/,
            lookbehind: true
        },

        // s<...><...>
        {
            pattern: /(^|[^-]\b)(?:s|tr|y)\s*<(?:[^<>\\]|\\[\s\S])*>\s*<(?:[^<>\\]|\\[\s\S])*>[msixpodualngcer]*/,
            lookbehind: true
        },

        // /.../
        // 前瞻用于避免把同一行的两个除号误判为正则边界。
        // 这条规则只处理单行正则。
        /\/(?:[^\/\\\r\n]|\\.)*\/[msixpodualngc]*(?=\s*(?:$|[\r\n,.;})&|\-+*~<>!?^]|(lt|gt|le|ge|eq|ne|cmp|not|and|or|xor|x)\b))/
    ],

    // ::、单引号和 # 的部分组合仍待核对。
    'variable': [
        // ${^POSTMATCH}
        /[&*$@%]\{\^[A-Z]+\}/,
        // $^V
        /[&*$@%]\^[A-Z_]/,
        // ${...}
        /[&*$@%]#?(?=\{)/,
        // $foo
        /[&*$@%]#?((::)*'?(?!\d)[\w$]+)+(::)*/i,
        // $1
        /[&*$@%]\d+/,
        // $_, @_, %!
        // 否定前瞻避免拆开 %= 运算符。
        /(?!%=)[$@%][!"#$ % &'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/
    ],
    'filehandle ': {
        // <>, <FOO>, _
        pattern: /<(?![<=])\S*>|\b_\b/,
        alias: 'symbol '
    },
    'vstring ': {
        // v1.2, 1.2.3
        pattern: /v\d+(\.\d+)*|\d+(\.\d+){2,}/,
        alias: 'string '
    },
    'function ': {
        pattern: /sub [a-z0-9_]+/i,
        inside: {
            keyword: /sub/
        }
    },
    'keyword ': /\b(any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|say|state|sub|switch|undef|unless|until|use|when|while)\b/,
    'number ': /\b-?(0x[\dA-Fa-f](_?[\dA-Fa-f])*|0b[01](_?[01])*|(\d(_?\d)*)?\.?\d(_?\d)*([Ee][+-]?\d+)?)\b/,
    'operator ': /-[rwxoRWXOezsfdlpSbctugkTBMAC]\b|\+[+=]?|-[-=>]?|\*\*?=?|\/\/?=?|=[=~>]?|~[~=]?|\|\|?=?|&&?=?|<(?:=>?|<=?)?|>>?=?|![~=]?|[%^]=?|\.(?:=|\.\.?)?|[\\?]|\bx(?:=|\b)|\b(lt|gt|le|ge|eq|ne|cmp|not|and|or|xor)\b/,
    'punctuation ': /[{}[\];(),:]/
};
