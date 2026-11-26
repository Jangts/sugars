/**
 * `@sugars/highlight` 内置的 `monkey` 词法。
 *
 * 识别 Monkey 的类型字符、预处理指令和函数声明。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.monkey = {
    'string': /"[^"\r\n]*"/,
    'comment': [
        /^#Rem\s+[\s\S]*?^#End/im,
        /'.+/,
    ],
    'preprocessor': {
        pattern: /(^[ \t]*)#.+/m,
        lookbehind: true,
        alias: 'comment'
    },
    'function': /\w+(?=\()/,
    // 标识符上的类型后缀单独着色，保留名称与声明类型之间的区别。
    'type-char': {
        pattern: /(\w)[?%#$]/,
        lookbehind: true,
        alias: 'variable'
    },
    'number': {
        pattern: /((?:\.\.)?)(?:(?:\b|\B-\.?|\B\.)\d+((?!\.\.)\.\d*)?|\$[\da-f]+)/i,
        lookbehind: true
    },
    'keyword': /\b(?:Void|Strict|Public|Private|Property|Bool|Int|Float|String|Array|Object|Continue|Exit|Import|Extern|New|Self|Super|Try|Catch|Eachin|True|False|Extends|Abstract|Final|Select|Case|Default|Const|Local|Global|Field|Method|Function|Class|End|If|Then|Else|ElseIf|EndIf|While|Wend|Repeat|Until|Forever|For|To|Step|Next|Return|Module|Interface|Implements|Inline|Throw|Null)\b/i,
    'operator': /\.\.|<[=>]?|>=?|:?=|(?:[+\-*\/&~|]|\b(?:Mod|Shl|Shr)\b)=?|\b(?:And|Not|Or)\b/i,
    'punctuation': /[.,:;()\[\]]/
};
