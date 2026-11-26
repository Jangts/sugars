// TangramJS tangram.js:912
import deep from './internal/deep.js'
import shallow from './internal/shallow.js'

/** @param {boolean|number} [deeply] */
export default function clone<T>(source: T, deeply?: boolean | number): T {
    if (deeply === true || deeply === 1) {
        return deep(source) as T;
    } else {
        return shallow(source) as T;
    }
}
