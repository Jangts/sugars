/**
 * `@sugars/highlight` 内置的 `kotlin` 词法。
 *
 * 识别 Kotlin 原始字符串、标签和注解。两种字符串共用插值规则。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern } from '../grammar.js'

highlight.languages.kotlin = highlight.languages.extend('clike', {
    'keyword': {
        // 后顾避免把 kotlin.properties.get 的成员名当作关键字。
        pattern: /(^|[^.])\b(?:abstract|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|else|enum|final|finally|for|fun|get|if|import|in|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|out|override|package|private|protected|public|reified|return|sealed|set|super|tailrec|this|throw|to|try|val|var|when|where|while)\b/,
        lookbehind: true
    },
    'function': [
        /\w+(?=\s*\()/,
        {
            pattern: /(\.)\w+(?=\s*\{)/,
            lookbehind: true
        }
    ],
    'number': /\b(?:0[bx][\da-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?[fFL]?)\b/,
    'operator': /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/
});

delete highlight.languages.kotlin["class-name"];

highlight.languages.insertBefore('kotlin', 'string', {
    // 三引号字符串有自己的边界，普通字符串和原始字符串内部共用下面的插值词法。
    'raw-string': {
        pattern: /(["'])\1\1[\s\S]*?\1{3}/,
        alias: 'string'
            // 插值词法在下方补入。
    }
});
highlight.languages.insertBefore('kotlin', 'keyword', {
    'annotation': {
        pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,
        alias: 'builtin'
    }
});
highlight.languages.insertBefore('kotlin', 'function', {
    'label': {
        pattern: /\w+@|@\w+/,
        alias: 'symbol'
    }
});

var interpolation = [{
        pattern: /\$\{[^}]+\}/,
        inside: {
            delimiter: {
                pattern: /^\$\{|\}$/,
                alias: 'variable'
            },
            rest: cloneGrammar(highlight.languages.kotlin)
        }
    },
    {
        pattern: /\$\w+/,
        alias: 'variable'
    }
];

grammarPattern(highlight.languages.kotlin!['string']).inside = grammarPattern(highlight.languages.kotlin!['raw-string']).inside = {
    interpolation: interpolation
};
