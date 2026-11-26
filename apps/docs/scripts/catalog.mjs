/** 文档站以这份能力清单登记正文、路由和导航，实际包身份由 workspace 清单提供。 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const site = fileURLToPath(new URL('../', import.meta.url))
export const root = fileURLToPath(new URL('../../../', import.meta.url))
export const generated = path.join(site, '.generated')
export { locales } from './routing.mjs'
export const base = process.env.DOCS_BASE || '/'
export const origin = process.env.DOCS_ORIGIN ? new URL(process.env.DOCS_ORIGIN).origin : ''
if (!/^\/(?:[\w.-]+\/)*$/.test(base) || base.split('/').some(segment => segment === '..' || segment === '.')) {
    throw new Error('DOCS_BASE must be a slash-delimited path ending in /')
}

export const text = {
    zh: {
        description: '浏览器组件、数据模型与基础工具的独立模块集。',
        start: '快速上手', packages: '包目录', api: 'API 参考', onPage: '本页内容',
        previous: '上一篇', next: '下一篇', menu: '目录', search: '搜索文档',
        browser: '浏览器', esm: 'ESM', legacy: 'ES5 兼容',
        guides: '接入与示例', source: '源码来源和许可', version: '工作区版本',
        local: '包清单标记为私有。完成根目录构建后，在 Sugars 工作区项目中按下方示例导入。',
        publishable: '包清单配置为公开发布。以下示例使用工作区版本，registry 上的可用版本以实际发布记录为准。',
        generated: '以下签名来自工作区构建后与包清单公开入口对应的 TypeScript 声明。',
        styles: '主题样式', category: '工具分类',
    },
    en: {
        description: 'Independent browser components, data models, and utilities.',
        start: 'Get started', packages: 'Packages', api: 'API reference', onPage: 'On this page',
        previous: 'Previous', next: 'Next', menu: 'Menu', search: 'Search docs',
        browser: 'Browser', esm: 'ESM', legacy: 'ES5 compatibility',
        guides: 'Setup and examples', source: 'Attribution and licenses', version: 'Workspace version',
        local: 'The package manifest marks this package as private. Build from the repository root and use the imports below from a Sugars workspace project.',
        publishable: 'The package manifest configures public publishing. These examples use the workspace version. Consult the release record for registry availability.',
        generated: 'Signatures are generated from the TypeScript declarations for the manifest’s public exports after building the workspace.',
        styles: 'Theme stylesheets', category: 'Utility categories',
    },
}

const groupDefinitions = [
    ['editing', '编辑与高亮', 'Editing and highlighting', [
        ['editor', '原生富文本编辑内核', 'Browser-native rich text editing', true],
        ['editor-element', 'Light DOM 编辑器元素', 'A Light DOM editor element', true],
        ['highlight', '代码分词、HTML 输出与浏览器渲染', 'Tokenization, highlighted HTML, and browser rendering'],
    ]],
    ['visuals', '图表与交互', 'Charts and interactions', [
        ['charts', '通用 Canvas 图表', 'General-purpose Canvas charts', true],
        ['kline', '行情图、指标和输入交互', 'Candlestick charts, indicators, and input', true],
        ['animation', '按场景和帧播放', 'Scene and frame playback'],
        ['scroll-view', '原生滚动与自定义轨道', 'Native scrolling with external tracks', true],
        ['swiper', '可更换布局预设的轮播', 'A carousel with layout presets', true],
        ['3d-pictures', '拖动切换图片序列', 'Drag through an image sequence', true],
    ]],
    ['data', '数据与视图', 'Data and views', [
        ['simple-mvvm', '字段观察、自定义渲染与虚拟 DOM', 'Field observation, custom rendering, and virtual DOM'],
        ['visual-form', '由字段定义生成 JSON 表单', 'Generate JSON forms from field definitions', true],
        ['simple-sql', '带字段约束的本地表', 'Local tables with field constraints'],
    ]],
    ['foundation', '工具与兼容', 'Utilities and compatibility', [
        ['dom', 'DOM 集合和 jQuery 风格插件入口', 'DOM collections and a jQuery-style plugin API', true],
        ['tools', '可独立导入的分类工具', 'Utilities with category and individual imports'],
        ['async', 'AMD 加载器与旧式 Promise', 'An AMD loader and legacy Promise helpers'],
        ['declare', '原型继承与旧式类工厂', 'Prototype inheritance and a legacy class factory'],
    ]],
]

export const groups = await Promise.all(groupDefinitions.map(async ([id, zh, en, entries]) => ({
    id, zh, en,
    packages: await Promise.all(entries.map(async ([id, zh, en, browser = false]) => {
        const directory = path.join(root, 'packages', id)
        const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
        if (manifest.name !== `@sugars/${id}`) throw new Error(`Unexpected package name: ${manifest.name}`)
        return { id, zh, en, browser, directory, manifest }
    })),
})))
export const packages = groups.flatMap(group => group.packages)
const actual = (await readdir(path.join(root, 'packages'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name).sort()
if (JSON.stringify(actual) !== JSON.stringify(packages.map(pkg => pkg.id).sort())) {
    throw new Error('Every package workspace must be registered exactly once in the docs catalog')
}
export const toolGroups = [
    { id: 'array', zh: '数组', en: 'Arrays' },
    { id: 'collection', zh: '集合遍历', en: 'Collection iteration' },
    { id: 'lang', zh: '类型检查', en: 'Type checks' },
    { id: 'math', zh: '数学', en: 'Math' },
    { id: 'object', zh: '对象', en: 'Objects' },
    { id: 'string', zh: '字符串与编码', en: 'Strings and encoding' },
]

export const guideRoute = (locale, id) => `/${locale}/packages/${id}/`
export const apiRoute = (locale, id) => `${guideRoute(locale, id)}api/`
export const toolRoute = (locale, id) => `${apiRoute(locale, 'tools')}${id}`
