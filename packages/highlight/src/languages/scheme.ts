/**
 * `@sugars/highlight` 内置的 `scheme` 词法。
 *
 * 区分 Scheme 的字面量、形式和内置过程。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.scheme = {
    'comment': /;.*/,
    'string': /"(?:[^"\\\r\n]|\\.)*?"|'[^('\s]*/,
    'keyword': {
        pattern: /(\()(?:define(?:-syntax|-library|-values)?|(?:case-)?lambda|let(?:\*|rec)?(?:-values)?|else|if|cond|begin|delay(?:-force)?|parameterize|guard|set!|(?:quasi-)?quote|syntax-rules)/,
        lookbehind: true
    },
    // 内置过程名称与语言形式分开处理，标识符里的同形片段由词法边界排除。
    'builtin': {
        pattern: /(\()(?:(?:cons|car|cdr|list|call-with-current-continuation|call\/cc|append|abs|apply|eval)\b|null\?|pair\?|boolean\?|eof-object\?|char\?|procedure\?|number\?|port\?|string\?|vector\?|symbol\?|bytevector\?)/,
        lookbehind: true
    },
    'number': {
        pattern: /(\s|\))[-+]?[0-9]*\.?[0-9]+(?:\s*[-+]\s*[0-9]*\.?[0-9]+i)?\b/,
        lookbehind: true
    },
    'boolean': /#[tf]/,
    'operator': {
        pattern: /(\()(?:[-+*%\/]|[<>]=?|=>?)/,
        lookbehind: true
    },
    'function': {
        pattern: /(\()[^\s()]*(?=\s)/,
        lookbehind: true
    },
    'punctuation': /[()]/
};
