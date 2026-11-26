// TangramJS str/str.js:76

export default function hasString(strs, str) {
    return RegExp("\\b" + str + "\\b").test(strs);
}
