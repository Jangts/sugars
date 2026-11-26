// TangramJS str/str.js:76

export default function hasString(strs: string, str: string) {
    return RegExp("\\b" + str + "\\b").test(strs);
}
