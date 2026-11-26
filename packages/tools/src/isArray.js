// TangramJS util/type.js:89

export default function isArray(object) {
    return Object.prototype.toString.call(object) === '[object Array]';
}
