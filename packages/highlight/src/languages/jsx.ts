/*!
 * tangram.js framework source code
 *
 * static see.highlight.language
 *
 * Date: 2017-04-06
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
    jsx: jsxExpression
});

highlight.languages.insertBefore('inside', 'attr-value', {
        'script': {
            // Allow for one level of nesting
            pattern: /=(\{(?:\{[^}]*\}|[^}])+\})/i,
            inside: jsxExpression,
            'alias': 'language-javascript'
        }
    },
    grammarPattern(highlight.languages.jsx.tag));
