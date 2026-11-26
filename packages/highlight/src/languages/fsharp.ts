/**
 * `@sugars/highlight` 内置的 `fsharp` 词法。
 *
 * 识别 F# 注释、指令、数值和字符串边界。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.fsharp = highlight.languages.extend('clike', {
    'comment': [{
        pattern: /(^|[^\\])\(\*[\w\W]*?\*\)/,
        lookbehind: true
    }, {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true
    }],
    'keyword': /\b(?:let|return|use|yield)(?:!\B|\b)|\b(abstract|and|as|assert|base|begin|class|default|delegate|do|done|downcast|downto|elif|else|end|exception|extern|false|finally|for|fun|function|global|if|in|inherit|inline|interface|internal|lazy|match|member|module|mutable|namespace|new|not|null|of|open|or|override|private|public|rec|select|static|struct|then|to|true|try|type|upcast|val|void|when|while|with|asr|land|lor|lsl|lsr|lxor|mod|sig|atomic|break|checked|component|const|constraint|constructor|continue|eager|event|external|fixed|functor|include|method|mixin|object|parallel|process|protected|pure|sealed|tailcall|trait|virtual|volatile)\b/,
    'string': /(?:"""[\s\S]*?"""|@"(?:""|[^"])*"|("|')(?:\\\1|\\?(?!\1)[\s\S])*\1)B?/,
    'number': [
        /\b-?0x[\da-fA-F]+(un|lf|LF)?\b/,
        /\b-?0b[01]+(y|uy)?\b/,
        /\b-?(\d*\.?\d+|\d+\.)([fFmM]|[eE][+-]?\d+)?\b/,
        /\b-?\d+(y|uy|s|us|l|u|ul|L|UL|I)?\b/
    ]
});
highlight.languages.insertBefore('fsharp', 'keyword', {
    // 指令单独标记，保留编译条件与普通 F# 表达式之间的视觉区别。
    'preprocessor': {
        pattern: /^[^\r\n\S]*#.*/m,
        alias: 'property',
        inside: {
            'directive': {
                pattern: /(\s*#)\b(else|endif|if|light|line|nowarn)\b/,
                lookbehind: true,
                alias: 'keyword'
            }
        }
    }
});
