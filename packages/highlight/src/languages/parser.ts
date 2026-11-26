/**
 * `@sugars/highlight` 内置的 `parser` 词法。
 *
 * 在标记嵌套中识别 Parser 模板表达式、变量、转义及注释。
 */

import { highlighter as highlight } from '../core.js'
import { grammarPattern, insideGrammar } from '../grammar.js'

highlight.languages.parser = highlight.languages.extend('markup', {
    'keyword': {
        pattern: /(^|[^^])(?:\^(?:case|eval|for|if|switch|throw)\b|@(?:BASE|CLASS|GET(?:_DEFAULT)?|OPTIONS|SET_DEFAULT|USE)\b)/,
        lookbehind: true
    },
    'variable': {
        pattern: /(^|[^^])\B\$(?:\w+|(?=[.\{]))(?:(?:\.|::?)\w+)*(?:\.|::?)?/,
        lookbehind: true,
        inside: {
            'punctuation': /\.|:+/
        }
    },
    'function': {
        pattern: /(^|[^^])\B[@^]\w+(?:(?:\.|::?)\w+)*(?:\.|::?)?/,
        lookbehind: true,
        inside: {
            'keyword': {
                pattern: /(^@)(?:GET_|SET_)/,
                lookbehind: true
            },
            'punctuation': /\.|:+/
        }
    },
    'escape': {
        pattern: /\^(?:[$^;@()\[\]{}"':]|#[a-f\d]*)/i,
        alias: 'builtin'
    },
    'punctuation': /[\[\](){};]/
});
highlight.languages.insertBefore('parser', 'keyword', {
    'parser-comment': {
        pattern: /(\s)#.*/,
        lookbehind: true,
        alias: 'comment'
    },
    // 表达式匹配有固定嵌套深度。单独留出该候选，可保住内部定界符供嵌套词法识别。
    'expression': {
        // 最多允许三层嵌套。
        pattern: /(^|[^^])\((?:[^()]|\((?:[^()]|\((?:[^()])*\))*\))*\)/,
        lookbehind: true,
        inside: {
            'string': {
                pattern: /(^|[^^])(["'])(?:(?!\2)[^^]|\^[\s\S])*\2/,
                lookbehind: true
            },
            'keyword': highlight.languages.parser.keyword,
            'variable': highlight.languages.parser.variable,
            'function': highlight.languages.parser.
            function,
            'boolean': /\b(?:true|false)\b/,
            'number': /\b(?:0x[a-f\d]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/i,
            'escape': highlight.languages.parser.escape,
            'operator': /[~+*\/\\%]|!(?:\|\|?|=)?|&&?|\|\|?|==|<[<=]?|>[>=]?|-[fd]?|\b(?:def|eq|ge|gt|in|is|le|lt|ne)\b/,
            'punctuation': highlight.languages.parser.punctuation
        }
    }
});
highlight.languages.insertBefore('inside', 'punctuation', {
        'expression': highlight.languages.parser.expression,
        'keyword': highlight.languages.parser.keyword,
        'variable': highlight.languages.parser.variable,
        'function': highlight.languages.parser.
        function,
        'escape': highlight.languages.parser.escape,
        'parser-punctuation': {
            pattern: highlight.languages.parser.punctuation as RegExp,
            alias: 'punctuation'
        }
    },
    grammarPattern(insideGrammar(highlight.languages.parser!['tag'])['attr-value']));
