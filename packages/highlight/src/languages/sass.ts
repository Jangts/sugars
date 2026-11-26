/**
 * `@sugars/highlight` 内置的 `sass` 词法。
 *
 * 按缩进语法识别 Sass 的指令行、变量行、属性行和选择器。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.sass = highlight.languages.extend('css', {
    // 缩进划定 Sass 注释范围，无需结束定界符。
    'comment': {
        pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m,
        lookbehind: true
    }
});

highlight.languages.insertBefore('sass', 'atrule', {
    // 整行作为同一个词法片段。
    'atrule-line': {
        // 支持 = 与 + 简写。
        pattern: /^(?:[ \t]*)[@+=].+/m,
        inside: {
            'atrule': /(?:@[\w-]+|[+=])/m
        }
    }
});
delete highlight.languages.sass.atrule;


var variable = /((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i;
var operator = [
    /[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/,
    {
        pattern: /(\s+)-(?=\s)/,
        lookbehind: true
    }
];

highlight.languages.insertBefore('sass', 'property', {
    // 整行作为同一个词法片段。
    'variable-line': {
        pattern: /^[ \t]*\$.+/m,
        inside: {
            'punctuation': /:/,
            'variable': variable,
            'operator': operator
        }
    },
    // 整行作为同一个词法片段。
    // 按整行识别属性。其余整行规则先消耗自己的行，剩余内容才按缩进选择器处理。
    'property-line': {
        pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
        inside: {
            'property': [
                /[^:\s]+(?=\s*:)/,
                {
                    pattern: /(:)[^:\s]+/,
                    lookbehind: true
                }
            ],
            'punctuation': /:/,
            'variable': variable,
            'operator': operator,
            'important': highlight.languages.sass.important
        }
    }
});
delete highlight.languages.sass.property;
delete highlight.languages.sass.important;

// 其他整行结构处理完毕后，剩余行按选择器匹配。
delete highlight.languages.sass.selector;
highlight.languages.insertBefore('sass', 'punctuation', {
    'selector': {
        pattern: /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
        lookbehind: true
    }
});
