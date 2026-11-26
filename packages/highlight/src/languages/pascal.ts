/**
 * `@sugars/highlight` 内置的 `pascal` 词法。
 *
 * 识别 Pascal 的各种注释定界符、关键字和数值。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.pascal = {
    // 不同方言的注释定界符由同一规则覆盖，后面的关键字只处理未被注释切走的文本。
    'comment': [/\(\*[\s\S]+?\*\)/, /\{[\s\S]+?\}/, /\/\/.*/],
    'string': /(?:'(?:''|[^'\r\n])*'|#[&$%]?[a-f\d]+)+|\^[a-z]/i,
    'keyword': [{
            // Turbo Pascal
            pattern: /(^|[^&])\b(?:absolute|array|asm|begin|case|const|constructor|destructor|do|downto|else|end|file|for|function|goto|if|implementation|inherited|inline|interface|label|nil|object|of|operator|packed|procedure|program|record|reintroduce|repeat|self|set|string|then|to|type|unit|until|uses|var|while|with)\b/i,
            lookbehind: true
        },
        {
            // Free Pascal
            pattern: /(^|[^&])\b(?:dispose|exit|false|new|true)\b/i,
            lookbehind: true
        },
        {
            // Object Pascal
            pattern: /(^|[^&])\b(?:class|dispinterface|except|exports|finalization|finally|initialization|inline|library|on|out|packed|property|raise|resourcestring|threadvar|try)\b/i,
            lookbehind: true
        },
        {
            // 修饰符。
            pattern: /(^|[^&])\b(?:absolute|abstract|alias|assembler|bitpacked|break|cdecl|continue|cppdecl|cvar|default|deprecated|dynamic|enumerator|experimental|export|external|far|far16|forward|generic|helper|implements|index|interrupt|iochecks|local|message|name|near|nodefault|noreturn|nostackframe|oldfpccall|otherwise|overload|override|pascal|platform|private|protected|public|published|read|register|reintroduce|result|safecall|saveregisters|softfloat|specialize|static|stdcall|stored|strict|unaligned|unimplemented|varargs|virtual|write)\b/i,
            lookbehind: true
        }
    ],
    'number': [
        // 十六、八、二进制。
        /[+-]?(?:[&%]\d+|\$[a-f\d]+)/i,
        // 十进制。
        /([+-]|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?/i
    ],
    'operator': [
        /\.\.|\*\*|:=|<[<= >]?|>[>=]?|[+\-*\/]=?|[@^=]/i, {
            pattern: /(^|[^&])\b(?:and|as|div|exclude|in|include|is|mod|not|or|shl|shr|xor)\b/,
            lookbehind: true
        }
    ],
    'punctuation': /\(\.|\.\)|[()\[\]:;,.]/
};
