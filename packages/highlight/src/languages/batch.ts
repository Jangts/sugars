/**
 * `@sugars/highlight` 内置的 `batch` 词法。
 *
 * 识别批处理的标签、命令、参数变量与注释。
 */

import { highlighter as highlight } from '../core.js'

var variable = /%%?[~:\w]+%?|!\S+!/;
var parameter = {
    pattern: /\/[a-z?]+(?=[ :]|$):?|-[a-z]\b|--[a-z-]+\b/im,
    alias: 'attr-name',
    inside: {
        'punctuation': /:/
    }
};
var string = /"[^"]*"/;
var number = /(?:\b|-)\d+\b/;

highlight.languages.batch = {
    'comment': [
        /^::.*/m,
        {
            pattern: /((?:^|[&(])[ \t]*)rem\b(?:[^^&)\r\n]|\^(?:\r\n|[\s\S]))*/im,
            lookbehind: true
        }
    ],
    'label': {
        pattern: /^:.*/m,
        alias: 'property'
    },
    // 同一组命令分支按命令位置识别参数关键字，避免把参数文本中的普通单词一律当作命令。
    'command': [{
            // FOR 循环。
            pattern: /((?:^|[&(])[ \t]*)for(?: ?\/[a-z?](?:[ :](?:"[^"]*"|\S+))?)* \S+ in \([^)]+\) do/im,
            lookbehind: true,
            inside: {
                'keyword': /^for\b|\b(?:in|do)\b/i,
                'string': string,
                'parameter': parameter,
                'variable': variable,
                'number': number,
                'punctuation': /[()',]/
            }
        },
        {
            // IF 条件。
            pattern: /((?:^|[&(])[ \t]*)if(?: ?\/[a-z?](?:[ :](?:"[^"]*"|\S+))?)* (?:not )?(?:cmdextversion \d+|defined \w+|errorlevel \d+|exist \S+|(?:"[^"]*"|\S+)?(?:==| (?:equ|neq|lss|leq|gtr|geq) )(?:"[^"]*"|\S+))/im,
            lookbehind: true,
            inside: {
                'keyword': /^if\b|\b(?:not|cmdextversion|defined|errorlevel|exist)\b/i,
                'string': string,
                'parameter': parameter,
                'variable': variable,
                'number': number,
                'operator': /\^|==|\b(?:equ|neq|lss|leq|gtr|geq)\b/i
            }
        },
        {
            // ELSE 分支。
            pattern: /((?:^|[&()])[ \t]*)else\b/im,
            lookbehind: true,
            inside: {
                'keyword': /^else\b/i
            }
        },
        {
            // SET 赋值。
            pattern: /((?:^|[&(])[ \t]*)set(?: ?\/[a-z](?:[ :](?:"[^"]*"|\S+))?)* (?:[^^&)\r\n]|\^(?:\r\n|[\s\S]))*/im,
            lookbehind: true,
            inside: {
                'keyword': /^set\b/i,
                'string': string,
                'parameter': parameter,
                'variable': [
                    variable,
                    /\w+(?=(?:[*\/%+\-&^|]|<<|>>)?=)/
                ],
                'number': number,
                'operator': /[*\/%+\-&^|]=?|<<=?|>>=?|[!~_=]/,
                'punctuation': /[()',]/
            }
        },
        {
            // 其余命令。
            pattern: /((?:^|[&(])[ \t]*@?)\w+\b(?:[^^&)\r\n]|\^(?:\r\n|[\s\S]))*/im,
            lookbehind: true,
            inside: {
                'keyword': /^\w+\b/i,
                'string': string,
                'parameter': parameter,
                'label': {
                    pattern: /(^\s*):\S+/m,
                    lookbehind: true,
                    alias: 'property'
                },
                'variable': variable,
                'number': number,
                'operator': /\^/
            }
        }
    ],
    'operator': /[&@]/,
    'punctuation': /[()']/
};
