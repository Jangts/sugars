// TangramJS tangram.js:294

/* 按历史遍历顺序把成员放入新普通对象，保留值的引用。 */

import each from '../each.js'
import writeValue from './writeValue.js'

export default function shallow(source: unknown) {
    var target = {};
    each(source, function(key, value) {
        writeValue(target, key, value);
    });
    return target;
}
