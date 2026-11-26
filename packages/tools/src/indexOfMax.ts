// TangramJS arr/arr.js:151
import arrayIndex from './arrayIndex.js'

export default function indexOfMax(array: readonly number[]) {
    return arrayIndex(array, Math.max.apply(Math, array as number[]));
}
