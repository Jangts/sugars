// TangramJS arr/arr.js:154
import arrayIndex from './arrayIndex.js'

export default function indexOfMin(array: readonly number[]) {
    return arrayIndex(array, Math.min.apply(Math, array as number[]));
}
