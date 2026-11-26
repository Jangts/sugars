// TangramJS tangram.js:927
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/** @param {boolean|number} [shallowly] */
export default function copy(source, shallowly) {
    if (shallowly === true || shallowly === 1) {
        return shallow(source);
    } else {
        return deep(source);
    }
}
