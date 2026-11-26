/** 将包内指南、英文对应稿及声明派生的 API 组合成可重建页面。 */
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { collectApi, matchTools, renderApi, renderToolGroup } from './api.mjs'
import { apiRoute, generated, groups, guideRoute, locales, packages, site, text } from './catalog.mjs'

const marks = ['`'.repeat(3), '~'.repeat(3)]
const link = (title, route) => `[${title}](${route})`
const examplePattern = /^<!-- example:(\d+) -->$/gm

async function write(name, contents) {
    const file = path.join(generated, name)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, contents.trim() + '\n')
}

function extractExamples(source, pkg) {
    const lines = source.split('\n')
    const examples = []
    let fence
    let start = 0
    for (const [index, line] of lines.entries()) {
        const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
        if (!match) continue
        if (!fence) {
            fence = match[1]
            start = index
        } else if (match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) {
            examples.push(lines.slice(start, index + 1).join('\n'))
            fence = undefined
        }
    }
    if (fence || !examples.length) throw new Error(`Malformed or missing examples in ${pkg.manifest.name}`)
    return examples
}

function sectionAnchors(source, anchors) {
    let inCode = false
    let index = 0
    return source.split('\n').map(line => {
        if (marks.some(mark => line.trimStart().startsWith(mark))) {
            inCode = !inCode
            return line
        }
        if (inCode || !/^#{2,6}\s/.test(line)) return line
        if (anchors[index] === undefined) throw new Error('Missing bilingual anchor for ' + line)
        return line + ' {#' + anchors[index++] + '}'
    }).join('\n')
}

async function guide(pkg) {
    const original = await readFile(path.join(pkg.directory, 'README.md'), 'utf8')
    const examples = extractExamples(original, pkg)
    const translation = await readFile(path.join(site, 'content', 'en', 'packages', pkg.id + '.md'), 'utf8')
    const used = [...translation.matchAll(examplePattern)].map(match => Number(match[1]))
    if (used.length !== examples.length || used.some((reference, index) => reference !== index + 1)) {
        throw new Error(`English guide must include all source examples in order: ${pkg.id}`)
    }
    const anchors = [...translation.matchAll(/^#{2,6} (.+)$/gm)].map(([,title]) =>
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    if (new Set(anchors).size !== anchors.length || anchors.includes('')) {
        throw new Error(`English headings must have unique section identifiers: ${pkg.id}`)
    }
    const zh = sectionAnchors(original, anchors)
    if (anchors.some(anchor => !zh.includes(`{#${anchor}}`))) {
        throw new Error(`Missing translated section for ${pkg.id}`)
    }
    const en = sectionAnchors(translation, anchors).replace(examplePattern, (_, index) => examples[Number(index) - 1])
    return { zh, en }
}

async function copyNotices(pkg) {
    const relative = path.join('notices', pkg.id)
    for (const name of ['THIRD-PARTY-NOTICES.md', 'licenses']) {
        const source = path.join(pkg.directory, name)
        try {
            await access(source)
        } catch (error) {
            if (error.code !== 'ENOENT') throw error
            continue
        }
        const file = name === 'THIRD-PARTY-NOTICES.md' ? 'THIRD-PARTY-NOTICES.txt' : name
        const destination = path.join(generated, 'public', relative, file)
        await mkdir(path.dirname(destination), { recursive: true })
        await cp(source, destination, { recursive: true })
    }
}

async function renderGuide(locale, pkg, source) {
    const t = text[locale]
    const notice = `/notices/${pkg.id}/THIRD-PARTY-NOTICES.txt`
    const hasNotice = await access(path.join(generated, 'public', notice)).then(() => true, error => {
        if (error.code !== 'ENOENT') throw error
        return false
    })
    const fields = [
        `${t.version} ${pkg.manifest.version}`,
        pkg.manifest.sugars?.runtime === 'es5' ? t.legacy : t.esm,
        ...(pkg.browser ? [t.browser] : []),
    ].map(field => `\`${field}\``).join(' · ')
    const info = pkg.manifest.private ? t.local : t.publishable
    let fence
    // README 中持有的代码和实际包用法共用，只转换代码块之外的站内链接。
    const body = source.split('\n').map(line => {
        if (marks.some(mark => line.trimStart().startsWith(mark))) {
            fence = !fence
            return line
        }
        return fence ? line : line.replace(/\]\(THIRD-PARTY-NOTICES\.md\)/g, `](/notices/${pkg.id}/THIRD-PARTY-NOTICES.txt)`)
    }).join('\n')
    const withTitle = body.replace(/^# ([^\n]+)\n/, (line) =>
        `${line}\n${fields}\n\n${link(t.api, apiRoute(locale, pkg.id))}\n\n${info}\n`)
    return withTitle + (hasNotice && !withTitle.includes(notice) ? '\n' + link(t.source, notice) + '\n' : '')
}

function directory(locale) {
    const t = text[locale]
    return `# ${t.packages}\n\n` + groups.map(group =>
        `## ${group[locale]} {#${group.id}}\n\n` + group.packages.map(pkg => {
            const status = pkg.manifest.sugars?.runtime === 'es5' ? ` · **${t.legacy}**` : ''
            const browser = pkg.browser ? ` · ${t.browser}` : ''
            return `- ${link(pkg.manifest.name, guideRoute(locale, pkg.id))} · ${pkg[locale]}${status}${browser} · ${link(t.api, apiRoute(locale, pkg.id))}`
        }).join('\n')
    ).join('\n\n')
}

function home(locale) {
    const t = text[locale]
    return [
        '---', 'layout: home', 'hero:', '  name: Sugars',
        `  text: ${JSON.stringify(t.description)}`,
        '  actions:', '    - theme: brand', `      text: ${t.start}`, `      link: /${locale}/getting-started`,
        '    - theme: alt', `      text: ${t.packages}`, `      link: /${locale}/packages/`,
        'features:', ...groups.flatMap(group => [
            `  - title: ${group[locale]}`, `    details: "${group.packages.map(pkg => pkg.id).join(' · ')}"`,
            `    link: /${locale}/packages/#${group.id}`,
        ]), '---',
    ].join('\n')
}

function gettingStarted(locale) {
    const isZh = locale === 'zh'
    const heading = text[locale].start
    const description = isZh
        ? '从 Sugars 仓库根目录安装依赖并构建，然后在工作区项目中使用各包的正式导入路径。'
        : 'Install dependencies and build from the Sugars repository root, then use the package entry points from a workspace project.'
    const mode = isZh
        ? '现代包提供 ESM 和类型声明。ES5 兼容包可通过 CommonJS 或包中适用的普通浏览器脚本入口使用。'
        : 'Modern packages ship ESM and type declarations. ES5 compatibility packages provide CommonJS or direct browser scripts where applicable.'
    return `# ${heading}\n\n${description}\n\n\x60\x60\x60sh\nnpm ci\nnpm run build\n\x60\x60\x60\n\n${mode}\n\n${link(text[locale].packages, `/${locale}/packages/`)}\n`
}

const sources = await Promise.all(packages.map(guide))
const api = await collectApi()
const categories = matchTools(api.get('tools'))

await rm(generated, { recursive: true, force: true })
await Promise.all(packages.map(copyNotices))
await write('index.md', `---\nlayout: page\n---\n\n# Sugars\n\n[简体中文](/zh/) · [English](/en/)\n`)
for (const locale of locales) {
    await write(`${locale}/index.md`, home(locale))
    await write(`${locale}/getting-started.md`, gettingStarted(locale))
    await write(`${locale}/packages/index.md`, directory(locale))
    await write(`${locale}/api/index.md`, `# ${text[locale].api}\n\n` + groups.map(group =>
        `## ${group[locale]} {#${group.id}}\n\n` + group.packages.map(pkg =>
            `- ${link(pkg.manifest.name, apiRoute(locale, pkg.id))} · ${pkg[locale]}`).join('\n')
    ).join('\n\n'))
    for (const [index, pkg] of packages.entries()) {
        const folder = `${locale}/packages/${pkg.id}`
        await write(`${folder}/index.md`, await renderGuide(locale, pkg, sources[index][locale]))
        await write(`${folder}/api/index.md`, renderApi(locale, pkg, api.get(pkg.id)))
    }
    for (const category of categories) {
        await write(`${locale}/packages/tools/api/${category.group.id}.md`, renderToolGroup(locale, category))
    }
}
console.log(`Generated ${locales.length} locales for ${packages.length} packages and ${categories.length} utility categories.`)
