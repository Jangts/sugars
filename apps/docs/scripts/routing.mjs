/** 语言切换、入口跳转和 hreflang 共用同一套路径换算。 */
export const locales = ['zh', 'en']
export const languageKey = 'sugars-docs-language'
export const languageOf = page => /^zh\//.test(page) ? 'zh' : 'en'

export function languageRoute(page, language) {
    const suffix = page.replace(/^(zh|en)\//, '')
    const route = suffix.endsWith('index.md') ? suffix.slice(0, -'index.md'.length) : suffix.replace(/\.md$/, '.html')
    return `/${language}/${route}`
}

export function languageRedirect(base) {
    return `(() => {
        if (location.pathname !== ${JSON.stringify(base)} && location.pathname !== ${JSON.stringify(base + 'index.html')}) return
        let preference
        try { preference = localStorage.getItem(${JSON.stringify(languageKey)}) } catch {}
        const locale = preference === 'zh' || preference === 'en'
            ? preference : /^zh(?:[-_]|$)/i.test(navigator.language || '') ? 'zh' : 'en'
        location.replace(${JSON.stringify(base)} + locale + '/' + location.search + location.hash)
    })()`
}
