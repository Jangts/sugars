// TangramJS util/bool.js:91

export default function isPercent(str) {
    return (typeof str === 'string') && (/^[-\+]{0,1}(\d+(\.\d+){0,1}|\.\d+)\%$/.test(str));
}
