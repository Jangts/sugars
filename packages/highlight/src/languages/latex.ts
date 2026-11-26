/**
 * `@sugars/highlight` 内置的 `latex` 词法。
 *
 * 标记 LaTeX 的命令、数学环境和文档结构。
 */

import { highlighter as highlight } from '../core.js'

var funcPattern = /\\([^a-z()[\]]|[a-z\*]+)/i,
    insideEqu = {
        'equation-command': {
            pattern: funcPattern,
            alias: 'regex'
        }
    };

highlight.languages.latex = {
    'comment': /%.*/m,
    // verbatim 环境保留文档中的空白。
    'cdata': {
        pattern: /(\\begin\{((?:verbatim|lstlisting)\*?)\})([\w\W]*?)(?=\\end\{\2\})/,
        lookbehind: true
    },
    /*
     * 公式可以用 $ $、\( \) 或 \[ \] 包裹。
     * (all are multiline)
     */
    // 在匹配公式定界符时保留公式内部空白，语法着色不改变文档实际字符。
    'equation': [{
            pattern: /\$(?:\\?[\w\W])*?\$|\\\((?:\\?[\w\W])*?\\\)|\\\[(?:\\?[\w\W])*?\\\]/,
            inside: insideEqu,
            alias: 'string'
        },
        {
            pattern: /(\\begin\{((?:equation|math|eqnarray|align|multline|gather)\*?)\})([\w\W]*?)(?=\\end\{\2\})/,
            lookbehind: true,
            inside: insideEqu,
            alias: 'string'
        }
    ],
    /*
     * 关键字和引用参数使用关键字标记。
     */
    'keyword': {
        pattern: /(\\(?:begin|end|ref|cite|label|usepackage|documentclass)(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
        lookbehind: true
    },
    'url': {
        pattern: /(\\url\{)[^}]+(?=\})/,
        lookbehind: true
    },
    /*
     * 章节标题使用加粗标记。
     */
    'headline': {
        pattern: /(\\(?:part|chapter|section|subsection|frametitle|subsubsection|paragraph|subparagraph|subsubparagraph|subsubsubparagraph)\*?(?:\[[^\]]+\])?\{)[^}]+(?=\}(?:\[[^\]]+\])?)/,
        lookbehind: true,
        alias: 'class-name'
    },
    'function': {
        pattern: funcPattern,
        alias: 'selector'
    },
    'punctuation': /[[\]{}&]/
};
