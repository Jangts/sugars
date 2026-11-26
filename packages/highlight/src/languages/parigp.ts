/**
 * `@sugars/highlight` 内置的 `parigp` 词法。
 *
 * 识别 PARI/GP 的数学运算符、函数名称、字符串及注释。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.parigp = {
    'comment': /\/\*[\s\S]*?\*\/|\\\\.*/,
    'string': /"(?:[^"\\]|\\.)*"/,
    // PARI/GP 关键字中的空白可忽略，构建正则时一并处理。
    // (e.g. "b *r *e *a *k", etc.)
    // 关键字本身由各字符之间可插入空白的模式构造，沿用 PARI/GP 的空白规则。
    'keyword': (function() {
        var keywords = [
            'breakpoint', 'break', 'dbg_down', 'dbg_err', 'dbg_up', 'dbg_x',
            'forcomposite', 'fordiv', 'forell', 'forpart', 'forprime',
            'forstep', 'forsubgroup', 'forvec', 'for', 'iferr', 'if',
            'local', 'my', 'next', 'return', 'until', 'while'
        ];
        const words = keywords.map(function(keyword) {
            return keyword.split('').join(' *');
        }).join('|');
        return RegExp('\\b(?:' + words + ')\\b');
    }()),
    'function': /\w[\w ]*?(?= *\()/,
    'number': {
        // 后顾和否定前瞻保护 .. 运算符的完整性。
        pattern: /((?:\. *\. *)?)(?:\d(?: *\d)*(?: *(?!\. *\.)\.(?: *\d)*)?|\. *\d(?: *\d)*)(?: *e *[+-]? *\d(?: *\d)*)?/i,
        lookbehind: true
    },
    'operator': /\. *\.|[*\/!](?: *=)?|%(?: *=|(?: *#)?(?: *')*)?|\+(?: *[+=])?|-(?: *[-=>])?|<(?:(?: *<)?(?: *=)?| *>)?|>(?: *>)?(?: *=)?|=(?: *=){0,2}|\\(?: *\/)?(?: *=)?|&(?: *&)?|\| *\||['#~^]/,
    'punctuation': /[\[\]{}().,:;|]/
};
