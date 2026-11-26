// Keep __proto__ as a data key when a legacy utility writes caller data.
export default function writeValue(target, key, value) {
    if (key === '__proto__') {
        Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
    } else {
        target[key] = value;
    }
}
