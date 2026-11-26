/**
 * `@sugars/highlight` 内置的 `css` 词法。
 *
 * 在样式表中区分选择器、属性和函数参数，遇到标记内的样式时复用同一套规则。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, grammarPattern, insideGrammar } from '../grammar.js'

highlight.languages.css = {
    'comment': /\/\*[\w\W]*?\*\//,
    // 先消费整条 at 规则，然后标记规则名并通过 rest 匹配剩余内容。把两步分开可保住规则的结束边界。
    'atrule': {
        pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
        inside: {
            'rule': /@[\w-]+/
                // 嵌套规则在下方补入。
        }
    },
    'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
    'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
    'string': /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
    'property': /(\b|\B)[\w-]+(?=\s*:)/i,
    'important': /\B!important\b/i,
    'function': /[-a-z0-9]+(?=\()/i,
    'punctuation': /[(){};:]/
};

insideGrammar(highlight.languages.css!['atrule']).rest = cloneGrammar(highlight.languages.css);

if (highlight.languages.markup) {
    highlight.languages.insertBefore('markup', 'tag', {
        'style': {
            pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
            lookbehind: true,
            inside: highlight.languages.css,
            alias: 'language-css'
        }
    });

    highlight.languages.insertBefore('inside', 'attr-value', {
            'style-attr': {
                pattern: /\s*style=("|').*?\1/i,
                inside: {
                    'attr-name': {
                        pattern: /^\s*style/i,
                        inside: grammarPattern(highlight.languages.markup!.tag).inside
                    },
                    'punctuation': /^\s*=\s*['"]|['"]\s*$/,
                    'attr-value': {
                        pattern: /.+/i,
                        inside: highlight.languages.css
                    }
                },
                alias: 'language-css'
            }
        },
        grammarPattern(highlight.languages.markup.tag));
};

highlight.languages.css.selector = {
    pattern: /[^\{\}\s][^\{\}]*(?=\s*\{)/,
    inside: {
        'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
        'pseudo-class': /:[-\w]+(?:\(.*\))?/,
        'class': /\.[-:\.\w]+/,
        'id': /#[-:\.\w]+/
    }
};

highlight.languages.insertBefore('css', 'function', {
    'hexcode': /#[\da-f]{3,6}/i,
    'entity': /\\[\da-f]{1,8}/i,
    'number': /[\d%\.]+/
});
