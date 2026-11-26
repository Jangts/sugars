/**
 * `@sugars/highlight` 内置的 `lolcode` 词法。
 *
 * 识别 LOLCODE 的多词关键字、流程标记和数据字面量。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.lolcode = {
    'comment': [
        /\bOBTW\s+[\s\S]*?\s+TLDR\b/,
        /\bBTW.+/
    ],
    'string': {
        pattern: /"(?::.|[^"])*"/,
        inside: {
            'variable': /:\{[^}]+\}/,
            'symbol': [
                /:\([a-f\d]+\)/i,
                /:\[[^\]]+\]/,
                /:[)>o":]/
            ]
        }
    },
    'number': /(-|\b)\d*\.?\d+/,
    'symbol': {
        pattern: /(^|\s)(?:A )?(?:YARN|NUMBR|NUMBAR|TROOF|BUKKIT|NOOB)(?=\s|,|$)/,
        lookbehind: true,
        inside: {
            'keyword': /A(?=\s)/
        }
    },
    'label': {
        pattern: /((?:^|\s)(?:IM IN YR|IM OUTTA YR) )[a-zA-Z]\w*/,
        lookbehind: true,
        alias: 'string'
    },
    'function': {
        pattern: /((?:^|\s)(?:I IZ|HOW IZ I|IZ) )[a-zA-Z]\w*/,
        lookbehind: true
    },
    // 多词关键字保留中间的词与空白，避免把复合语句只着色一部分。
    'keyword': [{
            pattern: /(^|\s)(?:O HAI IM|KTHX|HAI|KTHXBYE|I HAS A|ITZ(?: A)?|R|AN|MKAY|SMOOSH|MAEK|IS NOW(?: A)?|VISIBLE|GIMMEH|O RLY\?|YA RLY|NO WAI|OIC|MEBBE|WTF\?|OMG|OMGWTF|GTFO|IM IN YR|IM OUTTA YR|FOUND YR|YR|TIL|WILE|UPPIN|NERFIN|I IZ|HOW IZ I|IF U SAY SO|SRS|HAS A|LIEK(?: A)?|IZ)(?=\s|,|$)/,
            lookbehind: true
        },
        /'Z(?=\s|,|$)/
    ],
    'boolean': {
        pattern: /(^|\s)(?:WIN|FAIL)(?=\s|,|$)/,
        lookbehind: true
    },
    'variable': {
        pattern: /(^|\s)IT(?=\s|,|$)/,
        lookbehind: true
    },
    'operator': {
        pattern: /(^|\s)(?:NOT|BOTH SAEM|DIFFRINT|(?:SUM|DIFF|PRODUKT|QUOSHUNT|MOD|BIGGR|SMALLR|BOTH|EITHER|WON|ALL|ANY) OF)(?=\s|,|$)/,
        lookbehind: true
    },
    'punctuation': /\.{3}|…|,|!/
};
