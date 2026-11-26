/**
 * `@sugars/highlight` 内置的 `vhdl` 词法。
 *
 * 优先识别 VHDL 位向量和带引号的函数，再处理基本词法。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.vhdl = {
    'comment': /--.+/,
    // 识别逻辑向量。
    // 位向量有专用规则，必须先于普通字符串处理，保留其进制前缀与整体类别。
    'vhdl-vectors': {
        'pattern': /\b[oxb]"[\da-f_]+"|"[01uxzwlh-]+"/i,
        'alias': 'number'
    },
    // 包含运算符重载写法。
    'quoted-function': {
        pattern: /"\S+?"(?=\()/,
        alias: 'function'
    },
    'string': /"(?:[^\\\r\n]|\\?(?:\r\n|[\s\S]))*?"/,
    'constant': /\b(?:use|library)\b/i,
    // 包含预定义属性。
    'keyword': /\b(?:'active|'ascending|'base|'delayed|'driving|'driving_value|'event|'high|'image|'instance_name|'last_active|'last_event|'last_value|'left|'leftof|'length|'low|'path_name|'pos|'pred|'quiet|'range|'reverse_range|'right|'rightof|'simple_name|'stable|'succ|'transaction|'val|'value|access|after|alias|all|architecture|array|assert|attribute|begin|block|body|buffer|bus|case|component|configuration|constant|disconnect|downto|else|elsif|end|entity|exit|file|for|function|generate|generic|group|guarded|if|impure|in|inertial|inout|is|label|library|linkage|literal|loop|map|new|next|null|of|on|open|others|out|package|port|postponed|procedure|process|pure|range|record|register|reject|report|return|select|severity|shared|signal|subtype|then|to|transport|type|unaffected|units|until|use|variable|wait|when|while|with)\b/i,
    'boolean': /\b(?:true|false)\b/i,
    'function': /[a-z0-9_]+(?=\()/i,
    // 支持十进制、带进制基数、物理量和指数写法。
    'number': /'[01uxzwlh-]'|\b(?:\d+#[\da-f_.]+#|\d[\d_.]*)(?:e[-+]?\d+)?/i,
    'operator': /[<>]=?|:=|[-+*/&=]|\b(?:abs|not|mod|rem|sll|srl|sla|sra|rol|ror|and|or|nand|xnor|xor|nor)\b/i,
    'punctuation': /[{}[\];(),.:]/
};
