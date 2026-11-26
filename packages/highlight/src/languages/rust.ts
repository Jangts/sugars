/**
 * `@sugars/highlight` 内置的 `rust` 词法。
 *
 * 标记 Rust 属性、宏、闭包参数和数值后缀。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.rust = {
    'comment': [{
        pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
        lookbehind: true
    }, {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true
    }],
    'string': [
        /b?r(#*)"(?:\\?.)*?"\1/,
        /b?("|')(?:\\?.)*?\1/
    ],
    'keyword': /\b(?:abstract|alignof|as|be|box|break|const|continue|crate|do|else|enum|extern|false|final|fn|for|if|impl|in|let|loop|match|mod|move|mut|offsetof|once|override|priv|pub|pure|ref|return|sizeof|static|self|struct|super|true|trait|type|typeof|unsafe|unsized|use|virtual|where|while|yield)\b/,

    'attribute': {
        pattern: /#!?\[.+?\]/,
        alias: 'attr-name'
    },

    'function': [
        /[a-z0-9_]+(?=\s*\()/i,
        // 宏可以使用圆括号或方括号。
        /[a-z0-9_]+!(?=\s*\(|\[)/i
    ],
    'macro-rules': {
        pattern: /[a-z0-9_]+!/i,
        alias: 'function'
    },

    // 带分隔符和类型后缀的十六、八、二、十进制数值。
    'number': /\b-?(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(\d(_?\d)*)?\.?\d(_?\d)*([Ee][+-]?\d+)?)(?:_?(?:[iu](?:8|16|32|64)?|f32|f64))?\b/,

    // 区分闭包参数边界与按位或。
    // 闭包参数的竖线也可能是按位或，需要用周围语法限制匹配范围。
    'closure-params': {
        pattern: /\|[^|]*\|(?=\s*[{-])/,
        inside: {
            'punctuation': /[\|:,]/,
            'operator': /[&*]/
        }
    },
    'punctuation': /[{}[\];(),:]|\.+|->/,
    'operator': /[-+*\/%!^=]=?|@|&[&=]?|\|[|=]?|<<?=?|>>?=?/
};
