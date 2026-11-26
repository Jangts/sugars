// TangramJS util/type.js:151

export default function fasttype(obj: unknown) {
    return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g, '');
}
