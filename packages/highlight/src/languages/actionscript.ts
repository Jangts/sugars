/**
 * `@sugars/highlight` 内置的 `actionscript` 词法。
 *
 * 在 JavaScript 词法之上补充 ActionScript 声明、运算符和类型名称。
 */

import { highlighter as highlight } from '../core.js'
import { grammarPattern } from '../grammar.js'

highlight.languages.actionscript = highlight.languages.extend('javascript', {
    // 从 JavaScript 复制词法后换掉关键字集合，避免改变 JavaScript 的登记项。
    'keyword': /\b(?:as|break|case|catch|class|const|default|delete|do|else|extends|finally|for|function|if|implements|import|in|instanceof|interface|internal|is|native|new|null|package|private|protected|public|return|super|switch|this|throw|try|typeof|use|var|void|while|with|dynamic|each|final|get|include|namespace|native|override|set|static)\b/,
    'operator': /\+\+|--|(?:[+\-*\/%^]|&&?|\|\|?|<<?|>>?>?|[!=]=?)=?|[~?@]/
});
grammarPattern(highlight.languages.actionscript!['class-name']).alias = 'function';

if (highlight.languages.markup) {
    highlight.languages.insertBefore('actionscript', 'string', {
        'xml': {
            pattern: /(^|[^.])<\/?\w+(?:\s+[^\s>\/=]+=("|')(?:\\\1|\\?(?!\1)[\w\W])*\2)*\s*\/?>/,
            lookbehind: true,
            inside: {
                rest: highlight.languages.markup
            }
        }
    });
};
