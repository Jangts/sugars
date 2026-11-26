// TangramJS str/str.js:73

export default function toCamel(str: string) {
    return str.replace(/(-\w)/, function(v) { return v.replace('-', '').toUpperCase() });
}
