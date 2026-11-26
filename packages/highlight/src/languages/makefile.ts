/**
 * `@sugars/highlight` 内置的 `makefile` 词法。
 *
 * 区分目标和变量赋值，并识别指令、变量引用与函数调用。
 * `languages/index.ts` 加载本模块后，通过语言名 `makefile` 选用这套规则。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.makefile = {
    // 只把未被反斜线转义的井号识别为注释起点。遇到续行时仍视为同一段注释。
    'comment': {
        pattern: /(^|[^\\])#(?:\\(?:\r\n|[\s\S])|.)*/,
        lookbehind: true
    },
    'string': /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,

    // .PHONY 等内置名称先于一般目标匹配，主题可以单独标记它们。
    'builtin': /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,

    // 只匹配规则冒号前的目标，排除 := 赋值。目标名称中的变量引用仍交给内部规则。
    'symbol': {
        pattern: /^[^:=\r\n]+(?=\s*:(?!=))/m,
        inside: {
            'variable': /\$+(?:[^(){}:#=\s]+|(?=[({]))/
        }
    },
    // 把 $(@D) 这样的自动变量视为整体。普通的 $(...) 只在这里标记美元前缀，括号内容留给后续规则。
    'variable': /\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,

    'keyword': [
        // 指令用关键字边界匹配。-include 单列，保留其可忽略缺失文件的写法。
        /-include\b|\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|include|override|private|sinclude|undefine|unexport|vpath)\b/,
        // 函数名须紧跟左括号，且随后有空格或制表符，避免把同名变量引用当成函数。
        {
            pattern: /(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,
            lookbehind: true
        }
    ],
    'operator': /(?:::|[?:+!])?=|[|@]/,
    'punctuation': /[:;(){}]/
};
