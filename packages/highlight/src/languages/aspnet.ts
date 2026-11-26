/*!
 * tangram.js framework source code
 *
 * static see.highlight.language
 *
 * Date: 2017-04-06
 */
import { highlighter as highlight } from '../core.js'
import { grammarPattern, insideGrammar } from '../grammar.js'

highlight.languages.aspnet = highlight.languages.extend('markup', {
    'page-directive tag': {
        pattern: /<%\s*@.*%>/i,
        inside: {
            'page-directive tag': /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
            rest: grammarPattern(highlight.languages.markup!.tag).inside
        }
    },
    'directive tag': {
        pattern: /<%.*%>/i,
        inside: {
            'directive tag': /<%\s*?[$=%#:]{0,2}|%>/i,
            rest: highlight.languages.csharp
        }
    }
});
// Regexp copied from prism-markup, with a negative look-ahead added
grammarPattern(highlight.languages.aspnet!.tag).pattern = /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i;

// match directives of attribute value foo="<% Bar %>"
highlight.languages.insertBefore('inside', 'punctuation', {
        'directive tag': highlight.languages.aspnet['directive tag']
    },
    grammarPattern(insideGrammar(highlight.languages.aspnet!.tag)["attr-value"]));

highlight.languages.insertBefore('aspnet', 'comment', {
    'asp comment': /<%--[\w\W]*?--%>/
});

// script runat="server" contains csharp, not javascript
highlight.languages.insertBefore('aspnet', highlight.languages.javascript ? 'script' : 'tag', {
    'asp script': {
        pattern: /(<script(?=.*runat=['"]?server['"]?)[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
        lookbehind: true,
        inside: highlight.languages.csharp || {}
    }
});
