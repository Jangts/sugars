// TangramJS tangram.js:912
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/** @param {boolean|number} [deeply] */
export default function clone(source, deeply) {
    if (deeply === true || deeply === 1) {
        return deep(source);
    } else {
        return shallow(source);
    }
}
