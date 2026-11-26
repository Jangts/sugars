/**
 * `@sugars/highlight` 内置的 `aspnet` 词法。
 *
 * 扩展标记词法以识别 ASP.NET 指令与服务端 C# 代码。
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
// 沿用 Prism 标记词法的正则，加上否定前瞻。
// 先调整通用标记的标签规则，排除服务端指令的起始符，再单独把指令加入属性值内部的词法。
grammarPattern(highlight.languages.aspnet!.tag).pattern = /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i;

// 在属性值中识别指令，例如 foo="<% Bar %>"。
highlight.languages.insertBefore('inside', 'punctuation', {
        'directive tag': highlight.languages.aspnet['directive tag']
    },
    grammarPattern(insideGrammar(highlight.languages.aspnet!.tag)["attr-value"]));

highlight.languages.insertBefore('aspnet', 'comment', {
    'asp comment': /<%--[\w\W]*?--%>/
});

// 标记为 runat="server" 的脚本内容应用 C# 词法。
highlight.languages.insertBefore('aspnet', highlight.languages.javascript ? 'script' : 'tag', {
    'asp script': {
        pattern: /(<script(?=.*runat=['"]?server['"]?)[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
        lookbehind: true,
        inside: highlight.languages.csharp || {}
    }
});
