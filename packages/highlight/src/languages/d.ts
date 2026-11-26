/**
 * `@sugars/highlight` 内置的 `d` 词法。
 *
 * 识别 D 的多种字符串、属性和数值格式。
 */

import { highlighter as highlight } from '../core.js'
import type { Rule } from '../grammar.js'

highlight.languages.d = highlight.languages.extend('clike', {
    // 定界字符串使用多个候选以保留各自关闭方式。宽泛的匹配不能抢在带特殊定界符的候选之前。
    'string': [
        // r"", x""
        /\b[rx]"(\\.|[^\\"])*"[cwd]?/,
        // q"[]", q"()", q"<>", q"{}"
        /\bq"(?:\[[\s\S]*?\]|\([\s\S]*?\)|<[\s\S]*?>|\{[\s\S]*?\})"/,
        // q"IDENT
        // ...
        // IDENT"
        /\bq"([_a-zA-Z][_a-zA-Z\d]*)(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\1"/,
        // q"//", q"||", etc.
        /\bq"(.)[\s\S]*?\1"/,
        // 字符字面量。
        /'(?:\\'|\\?[^']+)'/,

        /(["`])(\\.|(?!\1)[^\\])*\1[cwd]?/
    ],

    'number': [
        // 用后顾和否定前瞻防止把 .. 运算符拆成数字的一部分。
        // 单独匹配十六进制，避免把 e 当作指数。
        /\b0x\.?[a-f\d_]+(?:(?!\.\.)\.[a-f\d_]*)?(?:p[+-]?[a-f\d_]+)?[ulfi]*/i,
        {
            pattern: /((?:\.\.)?)(?:\b0b\.?|\b|\.)\d[\d_]*(?:(?!\.\.)\.[\d_]*)?(?:e[+-]?\d[\d_]*)?[ulfi]*/i,
            lookbehind: true
        }
    ],

    // 依次匹配 $、关键字与特殊记号、全局符号。
    'keyword': /\$|\b(?:abstract|alias|align|asm|assert|auto|body|bool|break|byte|case|cast|catch|cdouble|cent|cfloat|char|class|const|continue|creal|dchar|debug|default|delegate|delete|deprecated|do|double|else|enum|export|extern|false|final|finally|float|for|foreach|foreach_reverse|function|goto|idouble|if|ifloat|immutable|import|inout|int|interface|invariant|ireal|lazy|long|macro|mixin|module|new|nothrow|null|out|override|package|pragma|private|protected|public|pure|real|ref|return|scope|shared|short|static|struct|super|switch|synchronized|template|this|throw|true|try|typedef|typeid|typeof|ubyte|ucent|uint|ulong|union|unittest|ushort|version|void|volatile|wchar|while|with|__(?:(?:FILE|MODULE|LINE|FUNCTION|PRETTY_FUNCTION|DATE|EOF|TIME|TIMESTAMP|VENDOR|VERSION)__|gshared|traits|vector|parameters)|string|wstring|dstring|size_t|ptrdiff_t)\b/,
    'operator': /\|[|=]?|&[&=]?|\+[+=]?|-[-=]?|\.?\.\.|=[>=]?|!(?:i[ns]\b|<>?=?|>=?|=)?|\bi[ns]\b|(?:<[<>]?|>>?>?|\^\^|[*\/%^~])=?/
});

highlight.languages.d.comment = ([
    // 脚本解释器指令。
    /^\s*#!.+/,
    // /+ +/
    {
        // 允许一层嵌套。
        pattern: /(^|[^\\])\/\+(?:\/\+[\w\W]*?\+\/|[\w\W])*?\+\//,
        lookbehind: true
    }
] as Rule[]).concat(highlight.languages.d.comment as Rule | Rule[]);

highlight.languages.insertBefore('d', 'comment', {
    'token-string': {
        // 允许一层嵌套。
        pattern: /\bq\{(?:|\{[^}]*\}|[^}])*\}/,
        alias: 'string'
    }
});

highlight.languages.insertBefore('d', 'keyword', {
    'property': /\B@\w*/
});

highlight.languages.insertBefore('d', 'function', {
    'register': {
        // 内联汇编寄存器。
        pattern: /\b(?:[ABCD][LHX]|E[ABCD]X|E?(?:BP|SP|DI|SI)|[ECSDGF]S|CR[0234]|DR[012367]|TR[3-7]|X?MM[0-7]|R[ABCD]X|[BS]PL|R[BS]P|[DS]IL|R[DS]I|R(?:[89]|1[0-5])[BWD]?|XMM(?:[89]|1[0-5])|YMM(?:1[0-5]|\d))\b|\bST(?:\([0-7]\)|\b)/,
        alias: 'variable'
    }
});
