// TangramJS tangram.js:927
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/** @param {boolean|number} [shallowly] */
export default function copy<T>(source: T, shallowly?: boolean | number): T {
    if (shallowly === true || shallowly === 1) {
        return shallow(source) as T;
    } else {
        return deep(source) as T;
    }
}
