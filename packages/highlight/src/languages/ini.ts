/**
 * `@sugars/highlight` 内置的 `ini` 词法。
 *
 * 标记 INI 段名、配置键、值及行注释。
 */

import { highlighter as highlight } from '../core.js'

highlight.languages.ini = {
    'comment': /^[ \t]*;.*$/m,
    // 段名使用独立标记，后面的键和值按配置项规则分别识别。
    'important': /\[.*?\]/,
    'constant': /^[ \t]*[^\s=]+?(?=[ \t]*=)/m,
    'attr-value': {
        pattern: /=.*/,
        inside: {
            'punctuation': /^[=]/
        }
    }
};
