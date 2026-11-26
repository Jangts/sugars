// TangramJS util/type.js:57

export default function isDoc(object) {
    return typeof document !== 'undefined' && object === document;
}
