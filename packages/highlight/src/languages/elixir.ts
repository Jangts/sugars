/**
 * `@sugars/highlight` 内置的 `elixir` 词法。
 *
 * 区分 Elixir 原子、属性、捕获和插值，插值内部复用语言词法。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern, grammarRules } from '../grammar.js'

highlight.languages.elixir = {
    // 否定前瞻避免干扰字符串插值。
    // 否定后顾避免把多行文档字符串中的 Markdown 标题误当成注释。
    'comment': {
        pattern: /(^|[^#])#(?![{#]).*/m,
        lookbehind: true
    },
    // ~r"""foo""", ~r'''foo''', ~r/foo/, ~r|foo|, ~r"foo", ~r'foo', ~r(foo), ~r[foo], ~r{foo}, ~r<foo>
    // 正则和字符串的插值需要独立分词。在这里先识别完整定界区域，再为内部变量提供上下文。
    'regex': /~[rR](?:("""|'''|[\/|"'])(?:\\.|(?!\1)[^\\])+\1|\((?:\\\)|[^)])+\)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|[^}])+\}|<(?:\\>|[^>])+>)[uismxfr]*/,
    'string': [{
            // ~s"""foo""", ~s'''foo''', ~s/foo/, ~s|foo|, ~s"foo", ~s'foo', ~s(foo), ~s[foo], ~s{foo}, ~s<foo>
            pattern: /~[cCsSwW](?:("""|'''|[\/|"'])(?:\\.|(?!\1)[^\\])+\1|\((?:\\\)|[^)])+\)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|#\{[^}]+\}|[^}])+\}|<(?:\\>|[^>])+>)[csa]?/,
            inside: {
                // 插值词法在下方补入。
            }
        },
        {
            pattern: /("""|''')[\s\S]*?\1/,
            inside: {
                // 插值词法在下方补入。
            }
        },
        {
            // 允许字符串跨行。
            pattern: /("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/,
            inside: {
                // 插值词法在下方补入。
            }
        }
    ],
    'atom': {
        // 用后顾避免拆开 :: 运算符。
        pattern: /(^|[^:]):\w+/,
        lookbehind: true,
        alias: 'symbol'
    },
    // 用前瞻避免拆开 :: 运算符。
    'attr-name': /\w+:(?!:)/,
    'capture': {
        // 用后顾避免拆开 && 运算符。
        pattern: /(^|[^&])&(?:[^&\s\d()][^\s()]*|(?=\())/,
        lookbehind: true,
        alias: 'function'
    },
    'argument': {
        // 用后顾避免拆开 && 运算符。
        pattern: /(^|[^&])&\d+/,
        lookbehind: true,
        alias: 'variable'
    },
    'attribute': {
        pattern: /@[\S]+/,
        alias: 'variable'
    },
    'number': /\b(?:0[box][a-f\d_]+|\d[\d_]*)(?:\.[\d_]+)?(?:e[+-]?[\d_]+)?\b/i,
    'keyword': /\b(?:after|alias|and|case|catch|cond|def(?:callback|exception|impl|module|p|protocol|struct)?|do|else|end|fn|for|if|import|not|or|require|rescue|try|unless|use|when)\b/,
    'boolean': /\b(?:true|false|nil)\b/,
    'operator': [
        /\bin\b|&&?|\|[|>]?|\\\\|::|\.\.\.?|\+\+?|-[->]?|<[-=>]|>=|!==?|\B!|=(?:==?|[>~])?|[*\/^]/,
        {
            // 跳过 << 运算符。
            pattern: /([^<])<(?!<)/,
            lookbehind: true
        },
        {
            // 跳过 >> 运算符。
            pattern: /([^>])>(?!>)/,
            lookbehind: true
        }
    ],
    'punctuation': /<<|>>|[.,%\[\]{}()]/
};

grammarRules(highlight.languages.elixir.string).forEach(function(o) {
    grammarPattern(o).inside = {
        'interpolation': {
            pattern: /#\{[^}]+\}/,
            inside: {
                'delimiter': {
                    pattern: /^#\{|\}$/,
                    alias: 'punctuation'
                },
                rest: cloneGrammar(highlight.languages.elixir)
            }
        }
    };
});
