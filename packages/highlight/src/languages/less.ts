/**
 * `@sugars/highlight` 内置的 `less` 词法。
 *
 * 扩展 CSS 选择器和属性规则，加入 Less 的变量及混入调用。
 */

import { highlighter as highlight } from '../core.js'

/*
 * 旧规则的边界包括 :extend()、带插值的 at 规则和脱离规则集的混入。
 * 独立规则集会被识别为 at 规则，混入前的注释可能影响匹配。
 */

highlight.languages.less = highlight.languages.extend('css', {
    'comment': [/\/\*[\w\W]*?\*\//, {
        pattern: /(^|[^\\])\/\/.*/,
        lookbehind: true
    }],
    'atrule': {
        pattern: /@[\w-]+?(?:\([^{}]+\)|[^(){};])*?(?=\s*\{)/i,
        inside: {
            'punctuation': /[:()]/
        }
    },
    // 选择器与混入共用这个匹配规则。
    'selector': {
        pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\([^{}]*\)|[^{};@])*?(?=\s*\{)/,
        inside: {
            // 混入参数。
            'variable': /@+[\w-]+/
        }
    },

    'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,
    'punctuation': /[{}();:,]/,
    'operator': /[+\-*\/]/
});

// 先匹配函数，再匹配标点。
highlight.languages.insertBefore('less', 'punctuation', {
    'function': highlight.languages.less.
    function
});

highlight.languages.insertBefore('less', 'property', {
    'variable': [
        // 变量声明须连同冒号一起消耗。
        {
            pattern: /@[\w-]+\s*:/,
            inside: {
                "punctuation": /:/
            }
        },

        // 变量引用。
        / @@ ? [\w - ] + /
    ],
    // 混入调用的语法和选择器相似。先引入专用候选，再让 CSS 基础规则处理余下文本。
    'mixin-usage': {
        pattern: / ([{;]\s * )[.#]( ? !\d)[\w - ] + . * ?( ? =[(;]) /,
        lookbehind: true,
        alias: 'function'
    }
});
