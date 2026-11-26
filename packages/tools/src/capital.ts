// TangramJS str/str.js:70

export default function capital(str: string) {
    return str.replace(/(\w)/, function(v) { return v.toUpperCase() });
}
