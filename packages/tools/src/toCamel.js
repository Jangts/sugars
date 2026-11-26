// TangramJS str/str.js:73

export default function toCamel(str) {
    return str.replace(/(-\w)/, function(v) { return v.replace('-', '').toUpperCase() });
}
