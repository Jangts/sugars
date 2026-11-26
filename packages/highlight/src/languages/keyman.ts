/**
 * `@sugars/highlight` 内置的 `keyman` 词法。
 *
 * 标记 Keyman 规则的节、关键字、函数和字符串。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.keyman = {
    'comment': /\bc\s.*/i,
    // 方括号内的修饰键组合属于虚拟键写法，因此按一个标记处理。
    'function': /\[\s*((CTRL|SHIFT|ALT|LCTRL|RCTRL|LALT|RALT|CAPS|NCAPS)\s+)*([TKU]_[a-z0-9_?]+|".+?"|'.+?')\s*\]/i, // 虚拟键。
    'string': /("|')((?!\1).)*\1/,
    'bold': [ // 头部语句、系统存储和变量系统存储。
        /&(baselayout|bitmap|capsononly|capsalwaysoff|shiftfreescaps|copyright|ethnologuecode|hotkey|includecodes|keyboardversion|kmw_embedcss|kmw_embedjs|kmw_helpfile|kmw_helptext|kmw_rtl|language|layer|layoutfile|message|mnemoniclayout|name|oldcharposmatching|platform|targets|version|visualkeyboard|windowslanguages)\b/i,
        /\b(bitmap|bitmaps|caps on only|caps always off|shift frees caps|copyright|hotkey|language|layout|message|name|version)\b/i
    ],
    'keyword': /\b(any|baselayout|beep|call|context|deadkey|dk|if|index|layer|notany|nul|outs|platform|return|reset|save|set|store|use)\b/i, // 规则关键字。
    'atrule': /\b(ansi|begin|unicode|group|using keys|match|nomatch)\b/i, // 结构关键字。
    'number': /\b(U\+[\dA-F]+|d\d+|x[\da-f]+|\d+)\b/i, // 字符码与数字，包含 U+####、x###、d###。
    'operator': /[+>\\,()]/,
    'tag': /\$(keyman|kmfl|weaver|keymanweb|keymanonly):/i // 平台前缀。
};
