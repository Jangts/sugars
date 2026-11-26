/**
 * `@sugars/highlight` 内置的 `haxe` 词法。
 *
 * 在通用词法上加入 Haxe 元数据、正则、插值和预处理宏。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, insideGrammar } from '../grammar.js'

highlight.languages.haxe = highlight.languages.extend('clike', {
    // 字符串允许跨行。
    'string': {
        pattern: /(["'])(?:(?!\1)[^\\]|\\[\s\S])*\1/,
        inside: {
            'interpolation': {
                pattern: /(^|[^\\])\$(?:\w+|\{[^}]+\})/,
                lookbehind: true,
                inside: {
                    'interpolation': {
                        pattern: /^\$\w*/,
                        alias: 'variable'
                    }
                    // 嵌套规则在下方补入。
                }
            }
        }
    },
    // 末尾前瞻让 haxe.macro.Expr 之类的限定名称避开关键字匹配。
    'keyword': /\bthis\b|\b(?:abstract|as|break|case|cast|catch|class|continue|default|do|dynamic|else|enum|extends|extern|from|for|function|if|implements|import|in|inline|interface|macro|new|null|override|public|private|return|static|super|switch|throw|to|try|typedef|using|var|while)(?!\.)\b/,
    'operator': /\.{3}|\+\+?|-[->]?|[=!]=?|&&?|\|\|?|<[<=]?|>[>=]?|[*\/%~^]/
});
highlight.languages.insertBefore('haxe', 'class-name', {
    'regex': {
        pattern: /~\/(?:[^\/\\\r\n]|\\.)+\/[igmsu]*/
    }
});
highlight.languages.insertBefore('haxe', 'keyword', {
    'preprocessor': {
        pattern: /#\w+/,
        alias: 'builtin'
    },
    'metadata': {
        pattern: /@:?\w+/,
        alias: 'symbol'
    },
    // 以专用标记区分 AST 重化语法与字符串插值。两类写法都可能带变量样式的前缀。
    'reification': {
        pattern: /\$(?:\w+|(?=\{))/,
        alias: 'variable'
    }
});
insideGrammar(insideGrammar(highlight.languages.haxe!['string'])['interpolation']).rest = cloneGrammar(highlight.languages.haxe);
delete highlight.languages.haxe['class-name'];
