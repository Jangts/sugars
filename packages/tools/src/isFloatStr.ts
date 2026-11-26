// TangramJS util/type.js:114

export default function isFloatStr(string: unknown) {
    if (/^[-\+]{0,1}[\d\.]+$/.test(string as string)) {
        const parts = (string as string).split('.');
        if (parts.length === 2 && parts[1] != '') {
            return true;
        }
    }
    return false;
}
