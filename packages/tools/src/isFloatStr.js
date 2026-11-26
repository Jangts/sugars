// TangramJS util/type.js:114

export default function isFloatStr(string) {
    if (/^[-\+]{0,1}[\d\.]+$/.test(string)) {
        if (string.split('.').length === 2 && string.split('.')[1] != '') {
            return true;
        }
    }
    return false;
}
