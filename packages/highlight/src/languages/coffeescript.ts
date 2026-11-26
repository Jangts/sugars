/**
 * `@sugars/highlight` 内置的 `coffeescript` 词法。
 *
 * 识别 CoffeeScript 插值、块正则、隐式对象成员和内嵌 JavaScript。
 */

import { highlighter as highlight } from '../core.js'

// 让插值表达式优先于以花括号起始的注释候选。
var comment = /#(?!\{).+/,
    interpolation = {
        pattern: /#\{[^}]+\}/,
        alias: 'variable'
    };

highlight.languages.coffeescript = highlight.languages.extend('javascript', {
    'comment': comment,
    'string': [

        // 字符串可以跨行。
        / '(?:\\?[^\\])*?' /,

        {
            // 字符串可以跨行。
            pattern: /"(?:\\?[^\\])*?"/,
            inside: {
                'interpolation': interpolation
            }
        }
    ],
    'keyword': /\b(and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
    'class-member': {
        pattern: /@(?!\d)\w+/,
        alias: 'variable'
    }
});

highlight.languages.insertBefore('coffeescript', 'comment', {
    'multiline-comment': {
        pattern: /###[\s\S]+?###/,
        alias: 'comment'
    },

    // 正则块内部包含注释与插值。
    // 块正则允许内部注释和插值。词法需保留整块，再识别其内部成员。
    'block-regex': {
        pattern: /\/{3}[\s\S]*?\/{3}/,
        alias: 'regex',
        inside: {
            'comment': comment,
            'interpolation': interpolation
        }
    }
});

highlight.languages.insertBefore('coffeescript', 'string', {
    'inline-javascript': {
        pattern: /`(?:\\?[\s\S])*?`/,
        inside: {
            'delimiter': {
                pattern: /^`|`$/,
                alias: 'punctuation'
            },
            rest: highlight.languages.javascript
        }
    },

    // 块字符串。
    'multiline-string': [{
            pattern: /'''[\s\S]*?'''/,
            alias: 'string'
        },
        {
            pattern: /"""[\s\S]*?"""/,
            alias: 'string',
            inside: {
                interpolation: interpolation
            }
        }
    ]

});

highlight.languages.insertBefore('coffeescript', 'keyword', {
    // 对象属性。
    'property': /(?!\d)\w+(?=\s*:(?!:))/
});
