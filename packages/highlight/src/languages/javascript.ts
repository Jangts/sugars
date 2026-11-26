/**
 * `@sugars/highlight` 内置的 `javascript` 词法。
 *
 * 区分 JavaScript 正则与运算符，并在模板字符串内嵌入表达式词法。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.javascript = highlight.languages.extend('clike', {
    'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
    'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
    // 允许非 ASCII 标识符字符，写法参照 http://stackoverflow.com/a/2008444
    'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i
});

highlight.languages.insertBefore('javascript', 'keyword', {
    // 借助前后文猜测斜线是否为正则起始，尽量避开普通除法运算符。
    'regex': {
        pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
        lookbehind: true,
        greedy: true
    }
});

highlight.languages.insertBefore('javascript', 'class-name', {
    'template-string': {
        pattern: /`(?:\\\\|\\?[^\\])*?`/,
        greedy: true,
        inside: {
            'interpolation': {
                pattern: /\$\{[^}]+\}/,
                inside: {
                    'interpolation-punctuation': {
                        pattern: /^\$\{|\}$/,
                        alias: 'punctuation'
                    },
                    rest: highlight.languages.javascript
                }
            },
            'string': /[\s\S]+/
        }
    }
});

if (highlight.languages.markup) {
    highlight.languages.insertBefore('markup', 'tag', {
        'script': {
            pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
            lookbehind: true,
            inside: highlight.languages.javascript,
            alias: 'language-javascript'
        }
    });
}

highlight.languages.js = highlight.languages.javascript;
