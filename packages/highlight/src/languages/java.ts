/**
 * `@sugars/highlight` 内置的 `java` 词法。
 *
 * 加入 Java 的类型关键词、数字字面量和注解。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.java = highlight.languages.extend('clike', {
    'keyword': /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
    'number': /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
    'operator': {
        pattern: /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
        lookbehind: true
    }
});

highlight.languages.insertBefore('java', 'function', {
    // 注解单独分类。尽管使用同一个通用词法底座，注解无需按普通 Java 类型或关键字着色。
    'annotation': {
        alias: 'punctuation',
        pattern: /(^|[^.])@\w+/,
        lookbehind: true
    }
});
