// TangramJS util/type.js:89

export default function isArray(object: unknown): object is readonly unknown[] {
    return Object.prototype.toString.call(object) === '[object Array]';
}
