// TangramJS arr/arr.js:151
import arrayIndex from './arrayIndex.js'

export default function indexOfMax(array) {
    return arrayIndex(array, Math.max.apply(Math, array));
}
