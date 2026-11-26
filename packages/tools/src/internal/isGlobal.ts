// TangramJS util/type.js:53

export default function isGlobal(object: unknown) {
    return typeof window !== 'undefined' && object === window;
}
