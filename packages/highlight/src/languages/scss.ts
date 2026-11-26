/**
 * `@sugars/highlight` 内置的 `scss` 词法。
 *
 * 沿用 CSS 词法结构并加入 SCSS 变量、占位选择器和控制语句。
 */

import { highlighter as highlight } from '../core.js'
import { cloneGrammar, insideGrammar } from '../grammar.js'

highlight.languages.scss = highlight.languages.extend('css', {
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\w\W]*?\*\/|\/\/.*)/,
        lookbehind: true
    },
    'atrule': {
        pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
        inside: {
            'rule': /@[\w-]+/
                // 嵌套规则在下方补入。
        }
    },
    // 覆盖 Compass 使用的 URL 形式。
    'url': /(?:[-a-z]+-)*url(?=\()/i,
    // 从属性或规则块边界识别选择器。允许 & 和插值，并检查随后的花括号内容，避免把属性名插值当作选择器。
    // 此规则依赖后续花括号内容区分选择器和属性插值。保留规则次序才能让前面的 at 规则先退出。
    'selector': {
        // 开头的前瞻排除空白选择器。
        pattern: /(?=\S)[^@;\{\}\(\)]?([^@;\{\}\(\)]|&|#\{\$[-_\w]+\})+(?=\s*\{(\}|\s|[^\}]+(:|\{)[^\}]+))/m,
        inside: {
            'placeholder': /%[-_\w]+/
        }
    }
});

highlight.languages.insertBefore('scss', 'atrule', {
    'keyword': [/@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i, {
        pattern: /( +)(?:from|through)(?= )/,
        lookbehind: true
    }]
});

highlight.languages.insertBefore('scss', 'property', {
    // 变量及插值变量。
    'variable': /\$[-_\w]+|#\{\$[-_\w]+\}/
});

highlight.languages.insertBefore('scss', 'function', {
    'placeholder': {
        pattern: /%[-_\w]+/,
        alias: 'selector'
    },
    'statement': /\B!(?:default|optional)\b/i,
    'boolean': /\b(?:true|false)\b/,
    'null': /\bnull\b/,
    'operator': {
        pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
        lookbehind: true
    }
});

insideGrammar(highlight.languages.scss!['atrule']).rest = cloneGrammar(highlight.languages.scss);
highlight.languages.scala = highlight.languages.extend('java', {
    'keyword': /<-|=>|\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
    'string': /"""[\W\w]*?"""|"(?:[^"\\\r\n]|\\.)*"|'(?:[^\\\r\n']|\\.[^\\']*)'/,
    'builtin': /\b(?:String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\b/,
    'number': /\b(?:0x[\da-f]*\.?[\da-f]+|\d*\.?\d+e?\d*[dfl]?)\b/i,
    'symbol': /'[^\d\s\\]\w*/
});
delete highlight.languages.scala['class-name'];
delete highlight.languages.scala['function'];
