/**
 * `@sugars/highlight` 内置的 `apl` 词法。
 *
 * 区分 APL 系统函数、单元及二元运算符和数组字面量。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.apl = {
    'comment': /(?:⍝|#[! ]).*$/m,
    'string': /'(?:[^'\r\n]|'')*'/,
    'number': /¯?(?:\d*\.?\d+(?:e[+¯]?\d+)?|¯|∞)(?:j¯?(?:\d*\.?\d+(?:e[\+¯]?\d+)?|¯|∞))?/i,
    'statement': /:[A-Z][a-z][A-Za-z]*\b/,
    // 以四方框开头的系统名称独立于普通函数和运算符，保留其专用标记。
    'system-function': {
        pattern: /⎕[A-Z]+/i,
        alias: 'function'
    },
    'constant': /[⍬⌾#⎕⍞]/,
    'function': /[-+×÷⌈⌊∣|⍳?*⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩~∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢⍁⍂≈⍯↗¤→]/,
    'monadic-operator': {
        pattern: /[\\\/⌿⍀¨⍨⌶&∥]/,
        alias: 'operator'
    },
    'dyadic-operator': {
        pattern: /[.⍣⍠⍤∘⌸]/,
        alias: 'operator'
    },
    'assignment': {
        pattern: /←/,
        alias: 'keyword'
    },
    'punctuation': /[\[;\]()◇⋄]/,
    'dfn': {
        pattern: /[{}⍺⍵⍶⍹∇⍫:]/,
        alias: 'builtin'
    }
};
