/**
 * `@sugars/highlight` 内置的 `c` 词法。
 *
 * 沿用 C 风格通用词法，补入 C 的预处理指令、常量和数值格式。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.c = highlight.languages.extend('clike', {
    'keyword': /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
    'operator': /\-[>-]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|?\||[~^%?*\/]/,
    'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)[ful]*\b/i
});

highlight.languages.insertBefore('c', 'string', {
    // 先识别完整的预处理行及其续行，再拆出 include 路径、指令和内部语法，避免被通用规则切断。
    'macro': {
        // 宏定义可以续行。
        // gcc 允许 # 之后有空格。
        pattern: /(^\s*)#\s*[a-z]+([^\r\n\\]|\\.|\\(?:\r\n?|\n))*/im,
        lookbehind: true,
        alias: 'property',
        inside: {
            // include 路径按字符串标记。
            'string': {
                pattern: /(#\s*include\s*)(<.+?>|("|')(\\?.)+?\3)/,
                lookbehind: true
            },
            // 宏指令按关键字标记。
            'directive': {
                pattern: /(#\s*)\b(define|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
                lookbehind: true,
                alias: 'keyword'
            }
        }
    },
    // 预定义宏按常量标记。
    'constant': /\b(__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|stdin|stdout|stderr)\b/
});

delete highlight.languages.c['class-name'];
delete highlight.languages.c['boolean'];
