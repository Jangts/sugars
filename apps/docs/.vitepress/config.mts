import { defineConfig } from 'vitepress'
import { apiRoute, base, groups, guideRoute, origin, text, toolGroups, toolRoute } from '../scripts/catalog.mjs'
import { languageOf, languageRedirect, languageRoute, locales } from '../scripts/routing.mjs'

type Locale = (typeof locales)[number]

function searchTerms(input: string): string[] {
    const chunks = input.toLowerCase().match(/\p{Script=Han}+|[a-z\d]+/gu) ?? []
    return chunks.flatMap(chunk => {
        if (!/\p{Script=Han}/u.test(chunk)) return [chunk]
        const characters = Array.from(chunk)
        return characters.flatMap((character, index) =>
            index + 1 < characters.length ? [character, character + characters[index + 1]] : [character])
    })
}

function navigation(locale: Locale) {
    const t = text[locale]
    return {
        nav: [
            { text: t.start, link: `/${locale}/getting-started` },
            { text: t.packages, link: `/${locale}/packages/` },
            { text: t.api, link: `/${locale}/api/` },
        ],
        sidebar: {
            [`/${locale}/`]: [
                { text: t.start, link: `/${locale}/getting-started` },
                ...groups.map(group => ({
                    text: group[locale],
                    collapsed: false,
                    items: group.packages.map(pkg => ({
                        text: pkg.manifest.name.replace('@sugars/', ''),
                        link: guideRoute(locale, pkg.id),
                        collapsed: true,
                        items: [
                            { text: t.api, link: apiRoute(locale, pkg.id) },
                            ...(pkg.id === 'tools'
                                ? toolGroups.map(tool => ({ text: tool[locale], link: toolRoute(locale, tool.id) }))
                                : []),
                        ],
                    })),
                })),
            ],
        },
        outline: { label: t.onPage, level: [2, 3] as [number, number] },
        docFooter: { prev: t.previous, next: t.next },
        sidebarMenuLabel: t.menu,
        returnToTopLabel: locale === 'zh' ? '回到顶部' : 'Return to top',
    }
}

export default defineConfig({
    title: 'Sugars',
    description: text.en.description,
    srcDir: '.generated',
    outDir: 'dist',
    base,
    head: [['script', {}, languageRedirect(base)]],
    locales: Object.fromEntries(locales.map(locale => [
        locale, {
            label: locale === 'zh' ? '简体中文' : 'English',
            lang: locale === 'zh' ? 'zh-CN' : 'en',
            description: text[locale].description,
            link: `/${locale}/`,
            themeConfig: navigation(locale),
        },
    ])),
    ...(origin ? { sitemap: { hostname: origin + base } } : {}),
    transformHead({ pageData }) {
        const page = pageData.relativePath
        if (!origin || page === '404.md') return []
        const absolute = (locale: Locale) => origin + base + languageRoute(page, locale).slice(1)
        const canonical = page === 'index.md' ? origin + base : absolute(languageOf(page))
        return [
            ['link', { rel: 'canonical', href: canonical }],
            ['link', { rel: 'alternate', hreflang: 'zh-CN', href: absolute('zh') }],
            ['link', { rel: 'alternate', hreflang: 'en', href: absolute('en') }],
            ['link', { rel: 'alternate', hreflang: 'x-default', href: page === 'index.md' ? canonical : absolute('en') }],
        ]
    },
    themeConfig: {
        siteTitle: 'Sugars',
        footer: { message: 'Sugars' },
        search: {
            provider: 'local',
            options: {
                miniSearch: { options: { tokenize: searchTerms }, searchOptions: { prefix: true, fuzzy: 0.15 } },
                locales: {
                    zh: {
                        translations: {
                            button: { buttonText: text.zh.search, buttonAriaLabel: text.zh.search },
                            modal: {
                                displayDetails: '显示详细结果', resetButtonTitle: '清除搜索', backButtonTitle: '返回',
                                noResultsText: '没有找到相关结果', footer: { selectText: '打开', navigateText: '移动', closeText: '关闭' },
                            },
                        },
                    },
                },
            },
        },
    },
})
