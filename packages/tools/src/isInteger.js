// TangramJS util/type.js:123

export default function isInteger(number) {
    if (typeof Number.isInteger === 'function') {
        return Number.isInteger(number);
    } else {
        return Math.floor(number) === number;
    }
}
