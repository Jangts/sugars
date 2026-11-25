/*!
 * tangram.js framework source code
 *
 * static see.highlight.language
 *
 * Date: 2017-04-06
 */
import { highlighter as highlight } from '../core.js'

highlight.languages.ini = {
    'comment': /^[ \t]*;.*$/m,
    'important': /\[.*?\]/,
    'constant': /^[ \t]*[^\s=]+?(?=[ \t]*=)/m,
    'attr-value': {
        pattern: /=.*/,
        inside: {
            'punctuation': /^[=]/
        }
    }
};
