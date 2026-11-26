/**
 * `@sugars/highlight` 内置的 `tcl` 词法。
 *
 * 区分 Tcl 命令、变量、作用域声明和字符串。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.tcl = {
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true
    },
    'string': /"(?:[^"\\\r\n]|\\(?:\r\n|[\s\S]))*"/,
    'variable': [{
            pattern: /(\$)(?:::)?(?:[a-zA-Z0-9]+::)*[a-zA-Z0-9_]+/,
            lookbehind: true
        },
        {
            pattern: /(\$){[^}]+}/,
            lookbehind: true
        },
        {
            pattern: /(^\s*set[ \t]+)(?:::)?(?:[a-zA-Z0-9]+::)*[a-zA-Z0-9_]+/m,
            lookbehind: true
        }
    ],
    'function': {
        pattern: /(^\s*proc[ \t]+)[^\s]+/m,
        lookbehind: true
    },
    'builtin': [{
            pattern: /(^\s*)(?:proc|return|class|error|eval|exit|for|foreach|if|switch|while|break|continue)\b/m,
            lookbehind: true
        },
        /\b(elseif|else)\b/
    ],
    // 作用域相关命令有单独标记，便于主题和普通命令名区别显示。
    'scope': {
        pattern: /(^\s*)(global|upvar|variable)\b/m,
        lookbehind: true,
        alias: 'constant'
    },
    'keyword': {
        pattern: /(^\s*|\[)(after|append|apply|array|auto_(?:execok|import|load|mkindex|qualify|reset)|automkindex_old|bgerror|binary|catch|cd|chan|clock|close|concat|dde|dict|encoding|eof|exec|expr|fblocked|fconfigure|fcopy|file(?:event|name)?|flush|gets|glob|history|http|incr|info|interp|join|lappend|lassign|lindex|linsert|list|llength|load|lrange|lrepeat|lreplace|lreverse|lsearch|lset|lsort|math(?:func|op)|memory|msgcat|namespace|open|package|parray|pid|pkg_mkIndex|platform|puts|pwd|re_syntax|read|refchan|regexp|registry|regsub|rename|Safe_Base|scan|seek|set|socket|source|split|string|subst|Tcl|tcl(?:_endOfWord|_findLibrary|startOf(?:Next|Previous)Word|wordBreak(?:After|Before)|test|vars)|tell|time|tm|trace|unknown|unload|unset|update|uplevel|vwait)\b/m,
        lookbehind: true
    },
    'operator': /!=?|\*\*?|==|&&?|\|\|?|<[=<]?|>[=>]?|[-+~\/%?^]|\b(?:eq|ne|in|ni)\b/,
    'punctuation': /[{}()\[\]]/
};
