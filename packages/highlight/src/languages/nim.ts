/**
 * `@sugars/highlight` 内置的 `nim` 词法。
 *
 * 识别 Nim 的不同引号形式、过程名称、关键字和标点。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.nim = {
    'comment': /#.*/,
    // 双引号字符串可带标识符前缀，形成广义原始字符串。
    // 单独处理字符字面量，避免和数值类型后缀混淆。
    // 字符串可以有标识符前缀。字符字面量单独匹配，以避免影响数值类型后缀。
    'string': /(?:(?:\b(?!\d)(?:\w|\\x[8-9a-fA-F][0-9a-fA-F])+)?(?:"""[\s\S]*?"""(?!")|"(?:\\[\s\S]|""|[^"\\])*")|'(?:\\(?:\d+|x[\da-fA-F]{2}|.)|[^'])')/,
    // 否定前瞻避免拆开 .. 运算符。
    'number': /\b(?:0[xXoObB][\da-fA-F_]+|\d[\d_]*(?:(?!\.\.)\.[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)(?:'?[iuf]\d*)?/,
    'keyword': /\b(?:addr|as|asm|atomic|bind|block|break|case|cast|concept|const|continue|converter|defer|discard|distinct|do|elif|else|end|enum|except|export|finally|for|from|func|generic|if|import|include|interface|iterator|let|macro|method|mixin|nil|object|out|proc|ptr|raise|ref|return|static|template|try|tuple|type|using|var|when|while|with|without|yield)\b/,
    'function': {
        pattern: /(?:(?!\d)(?:\w|\\x[8-9a-fA-F][0-9a-fA-F])+|`[^`\r\n]+`)\*?(?:\[[^\]]+\])?(?=\s*\()/,
        inside: {
            'operator': /\*$/
        }
    },
    // 反引号中的运算符保持原样。
    'ignore': {
        pattern: /`[^`\r\n]+`/,
        inside: {
            'punctuation': /`/
        }
    },
    'operator': {
        // 前瞻与后顾保留 [. .]、{. .}、(. .) 的标点边界，同时允许切片 .. 优先匹配。
        // Nim 支持用户自定义运算符，因此任意合法字符组合都可能是运算符。
        pattern: /(^|[({\[](?=\.\.)|(?![({\[]\.).)(?:(?:[=+\-*\/<>@$~&%|!?^:\\]|\.\.|\.(?![)}\]]))+|\b(?:and|div|of|or|in|is|isnot|mod|not|notin|shl|shr|xor)\b)/m,
        lookbehind: true
    },
    'punctuation': /[({\[]\.|\.[)}\]]|[`(){}\[\],:]/
};
