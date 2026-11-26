/**
 * `@sugars/highlight` 内置的 `j` 词法。
 *
 * 区分 J 的名词字面量、动词、副词和合取运算。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.j = {
    'comment': /\bNB\..*/,
    'string': /'(?:''|[^'\r\n])*'/,
    'keyword': /\b(?:(?:adverb|conjunction|CR|def|define|dyad|LF|monad|noun|verb)\b|(?:assert|break|case|catch[dt]?|continue|do|else|elseif|end|fcase|for|for_\w+|goto_\w+|if|label_\w+|return|select|throw|try|while|whilst)\.)/,
    // 动词的符号和其后缀可能与数字前缀重合，需要给较长的符号写法保留整体边界。
    'verb': {
        // 否定前瞻避免把复合运算符拆开。
        // 例如 ^:、;.、=.、=:、!. 和 !:。
        pattern: /(?!\^:|;\.|[=!][.:])(?:\{(?:\.|::?)?|p(?:\.\.?|:)|[=!\]]|[<>+*\-%$|,#][.:]?|[\^?]\.?|[;\[]:?|[~}"i][.:]|[ACeEIjLor]\.|(?:[_\/\\qsux]|_?\d):)/,
        alias: 'keyword'
    },
    'number': /\b_?(?:(?!\d:)\d+(?:\.\d+)?(?:(?:[ejpx]|ad|ar)_?\d+(?:\.\d+)?)*(?:b_?[\da-z]+(?:\.[\da-z]+)?)?|_(?!\.))/,
    'adverb': {
        pattern: /[~}]|[\/\\]\.?|[bfM]\.|t[.:]/,
        alias: 'builtin'
    },
    'operator': /[=a][.:]|_\./,
    'conjunction': {
        pattern: /&(?:\.:?|:)?|[.:@][.:]?|[!D][.:]|[;dHT]\.|`:?|[\^LS]:|"/,
        alias: 'variable'
    },
    'punctuation': /[()]/
};
