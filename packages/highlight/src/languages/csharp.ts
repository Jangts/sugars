/**
 * `@sugars/highlight` 内置的 `csharp` 词法。
 *
 * 在通用词法上加入 C# 的预处理指令、逐字字符串和语言关键字。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.csharp = highlight.languages.extend('clike', {
    'keyword': /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield)\b/,
    'string': [/@("|')(\1\1|\\\1|\\?(?!\1)[\s\S])*\1/, /("|')(\\?.)*?\1/],
    'number': /\b-?(0x[\da-f]+|\d*\.?\d+f?)\b/i
});

highlight.languages.insertBefore('csharp', 'keyword', {
    // 复用该词法的外围标记仍会把预处理行作为 C# 片段处理，指令名在内部再标成关键字。
    'preprocessor': {
        pattern: /(^\s*)#.*/m,
        lookbehind: true,
        alias: 'property',
        inside: {
            // 预处理指令按关键字标记。
            'directive': {
                pattern: /(\s*#)\b(define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\b/,
                lookbehind: true,
                alias: 'keyword'
            }
        }
    }
});
