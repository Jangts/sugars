/**
 * `@sugars/highlight` 内置的 `groovy` 词法。
 *
 * 识别 Groovy 注解、字符串插值与 Spock 测试块标签。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.groovy = highlight.languages.extend('clike', {
    'keyword': /\b(as|def|in|abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|trait|transient|try|void|volatile|while)\b/,
    'string': /("""|''')[\W\w]*?\1|("|'|\/)(?:\\?.)*?\2|(\$\/)(\$\/\$|[\W\w])*?\/\$/,
    'number': /\b(?:0b[01_]+|0x[\da-f_]+(?:\.[\da-f_p\-]+)?|[\d_]+(?:\.[\d_]+)?(?:e[+-]?[\d]+)?)[glidf]?\b/i,
    'operator': {
        pattern: /(^|[^.])(~|==?~?|\?[.:]?|\*(?:[.=]|\*=?)?|\.[@&]|\.\.<|\.{1,2}(?!\.)|-[-=>]?|\+[+=]?|!=?|<(?:<=?|=>?)?|>(?:>>?=?|=)?|&[&=]?|\|[|=]?|\/=?|\^=?|%=?)/,
        lookbehind: true
    },
    'punctuation': /\.+|[{}[\];(),:$]/
});

highlight.languages.insertBefore('groovy', 'string', {
    'shebang': {
        pattern: /#!.+/,
        alias: 'comment'
    }
});

highlight.languages.insertBefore('groovy', 'punctuation', {
    'spock-block': /\b(setup|given|when|then|and|cleanup|expect|where):/
});

highlight.languages.insertBefore('groovy', 'function', {
    // 注解和测试标签有独立规则，使普通关键字匹配不会承担测试 DSL 的标记职责。
    'annotation': {
        alias: 'punctuation',
        pattern: /(^|[^.])@\w+/,
        lookbehind: true
    }
});

// 处理字符串插值。
highlight.hooks.add('wrap', function(env) {
    if (env.language === 'groovy' && env.type === 'string') {
        var delimiter = env.content[0];

        if (delimiter != "'") {
            var pattern = /([^\\])(\$(\{.*?\}|[\w\.]+))/;
            if (delimiter === '$') {
                pattern = /([^\$])(\$(\{.*?\}|[\w\.]+))/;
            }

            // 先还原 env.content，再进入序列化，避免双重 HTML 转义。
            env.content = env.content.replace(/&amp;/g, '&').replace(/&lt;/g, '<');

            env.content = highlight.highlight(env.content, {
                'expression': {
                    pattern: pattern,
                    lookbehind: true,
                    inside: highlight.languages.groovy
                }
            });

            env.classes.push(delimiter === '/' ? 'regex' : 'gstring');
        }
    }
});
