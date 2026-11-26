/**
 * `@sugars/highlight` 内置的 `jsx` 词法。
 *
 * 扩展标记和 JavaScript 规则，识别标签属性值与花括号表达式。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern, insideGrammar } from '../grammar.js'

var javascript = cloneGrammar(highlight.languages.javascript!);

highlight.languages.jsx = highlight.languages.extend('markup', javascript);
grammarPattern(highlight.languages.jsx!.tag).pattern = /<\/?[\w\.:-]+\s*(?:\s+[\w\.:-]+(?:=(?:("|')(\\?[\w\W])*?\1|[^\s'">=]+|(\{[\w\W]*?\})))?\s*)*\/?>/i;

grammarPattern(insideGrammar(highlight.languages.jsx!.tag)['attr-value']).pattern = /=[^\{](?:('|")[\w\W]*?(\1)|[^\s>]+)/i;

var jsxExpression = cloneGrammar(highlight.languages.jsx);

delete jsxExpression.punctuation

jsxExpression = highlight.languages.insertBefore('jsx', 'operator', {
    'punctuation': /=(?={)|[{}[\];(),.:]/
}, {
    // 正文中的花括号片段需要交给 JavaScript 词法，装配时复用标签与表达式规则。
    jsx: jsxExpression
});

highlight.languages.insertBefore('inside', 'attr-value', {
        'script': {
            // 允许一层嵌套。
            pattern: /=(\{(?:\{[^}]*\}|[^}])+\})/i,
            inside: jsxExpression,
            'alias': 'language-javascript'
        }
    },
    grammarPattern(highlight.languages.jsx.tag));
