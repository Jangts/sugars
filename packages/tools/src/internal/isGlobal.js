// TangramJS util/type.js:53

export default function isGlobal(object) {
    return typeof window !== 'undefined' && object === window;
}
