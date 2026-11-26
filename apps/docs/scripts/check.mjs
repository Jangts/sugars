/** 核对静态页面、语言互链、示例和真实包入口。 */
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { load } from 'cheerio'
import { collectApi, entryAnchor, matchTools, symbolAnchor } from './api.mjs'
import { apiRoute, base, generated, guideRoute, locales, origin, packages, site, toolGroups, toolRoute } from './catalog.mjs'

const dist = path.join(site, 'dist')
const require = createRequire(import.meta.url)
const testOrigin = origin || 'https://docs.invalid'

async function gather(directory, prefix = '') {
    const children = await readdir(directory, { withFileTypes: true })
    return (await Promise.all(children.map(child => child.isDirectory()
        ? gather(path.join(directory, child.name), prefix + child.name + '/')
        : prefix + child.name))).flat()
}

function fileFor(route) {
    const file = route.slice(base.length)
    if (file.endsWith('/') || !file) return file + 'index.html'
    if (!path.posix.extname(file) && files.has(file + '.html')) return file + '.html'
    return file
}

const files = new Set(await gather(dist))
const pages = new Map()
for (const file of files) {
    if (!file.endsWith('.html')) continue
    const body = await readFile(path.join(dist, file), 'utf8')
    pages.set(file, load(body))
}

for (const [file, $] of pages) {
    const address = testOrigin + base + file
    const ids = new Set()
    for (const element of $('[id]').toArray()) {
        const id = $(element).attr('id')
        assert(!ids.has(id), `${file} has duplicate id ${id}`)
        ids.add(id)
    }
    for (const element of $('[href], [src]').toArray()) {
        const reference = $(element).attr('href') ?? $(element).attr('src')
        if (!reference || /^(?:mailto:|data:|tel:)/i.test(reference)) continue
        const target = new URL(reference, address)
        if (target.origin !== testOrigin) continue
        const route = decodeURIComponent(target.pathname)
        assert(route.startsWith(base), `${file} -> ${reference} is outside ${base}`)
        const targetFile = fileFor(route)
        assert(files.has(targetFile), `${file} -> missing ${reference}`)
        if (target.hash && pages.has(targetFile)) {
            const anchor = decodeURIComponent(target.hash.slice(1))
            const targetPage = pages.get(targetFile)
            assert(targetPage('[id]').toArray().some(element => targetPage(element).attr('id') === anchor),
                `${file} -> missing anchor ${reference}`)
        }
    }
    if (/^(zh|en)\//.test(file)) {
        const locale = file.slice(0, 2)
        const other = locale === 'zh' ? 'en' : 'zh'
        assert.equal($('html').attr('lang'), locale === 'zh' ? 'zh-CN' : 'en', file)
        assert(pages.has(other + file.slice(2)), `Missing alternate of ${file}`)
        const switches = $('a.sugars-language').toArray()
        assert(switches.length > 0, `Missing language switch in ${file}`)
        for (const element of switches) {
            const href = $(element).attr('href')
            assert.equal(fileFor(new URL(href, address).pathname), other + file.slice(2), file)
        }
        if (origin) {
            assert.equal(fileFor(new URL($('link[rel="canonical"]').attr('href')).pathname), file)
            const otherLanguage = other === 'zh' ? 'zh-CN' : 'en'
            const alternate = $('link[rel="alternate"][hreflang="' + otherLanguage + '"]').attr('href')
            assert.equal(fileFor(new URL(alternate).pathname), other + file.slice(2), file)
        }
    }
}

const api = await collectApi()
let runtimeEntries = 0
let syntaxExamples = 0
const exportsByName = new Map([...api.values()].flat().map(entry => [entry.name, entry]))
for (const pkg of packages) {
    const entries = api.get(pkg.id)
    const apiPages = locales.map(locale => pages.get(fileFor(base + apiRoute(locale, pkg.id).slice(1))))
    const guidePages = locales.map(locale => pages.get(fileFor(base + guideRoute(locale, pkg.id).slice(1))))
    for (const $ of [...apiPages, ...guidePages]) assert($, pkg.manifest.name)
    const examples = guidePages.map($ => $('.vp-doc pre code').toArray().map(element => $(element).text()))
    assert(examples[0].length > 0, `No examples for ${pkg.id}`)
    assert.deepEqual(examples[0], examples[1], `Code examples must share one source: ${pkg.id}`)
    syntaxExamples += examples[0].length
    for (const code of examples[0]) {
        for (const match of code.matchAll(/(?:from\s+|import\s+|require\(\s*)['"](@sugars\/[^'"]+)['"]/g)) {
            assert(exportsByName.has(match[1]), `${pkg.id} example imports non-public entry ${match[1]}`)
        }
    }
    const zhGuide = await readFile(path.join(generated, 'zh', 'packages', pkg.id, 'index.md'), 'utf8')
    assert(!zhGuide.includes('<!-- example:'), pkg.id)

    for (const entry of entries) {
        if (entry.css) {
            for (const $ of apiPages) assert($('.vp-doc').text().includes(entry.name), entry.name)
            continue
        }
        const actual = pkg.manifest.type === 'commonjs' ? require(entry.name) : await import(entry.name)
        if (entry.commonJS) {
            assert.equal(typeof actual, 'function', entry.name)
        } else {
            const declared = entry.symbols.filter(symbol => !symbol.typeOnly).map(symbol => symbol.name).sort()
            assert.deepEqual(Object.keys(actual).sort(), declared, entry.name)
        }
        runtimeEntries++
        if (pkg.id === 'tools' && entry.subpath !== '.') {
            if (entry.declaration === entries[0].declaration) {
                for (const $ of apiPages) assert($('.vp-doc').text().includes(entry.name), entry.name)
            }
            continue
        }
        for (const $ of apiPages) {
            for (const symbol of entry.symbols) {
                const id = entryAnchor(entry.name) + '-' + symbolAnchor(symbol.name)
                assert.equal($(`[id="${id}"]`).length, 1, `${entry.name}#${symbol.name}`)
            }
        }
    }
}

const categories = matchTools(api.get('tools'))
for (const { group, entry, leaves } of categories) {
    for (const locale of locales) {
        const $ = pages.get(fileFor(base + toolRoute(locale, group.id).slice(1)))
        assert($, group.id)
        for (const { leaf, symbol } of leaves) {
            assert($('.vp-doc').text().includes(leaf.name), leaf.name)
            assert.equal($(`[id="${entryAnchor(entry.name)}-${symbolAnchor(symbol.name)}"]`).length, 1)
        }
    }
}

assert(files.has('index.html'), 'Missing language entry')
assert(files.has('404.html'), 'Missing 404 page')
if (origin) {
    const sitemap = load(await readFile(path.join(dist, 'sitemap.xml'), 'utf8'), { xmlMode: true })
    const routes = new Set(sitemap('url > loc').toArray().map(element => fileFor(new URL(sitemap(element).text()).pathname)))
    for (const file of pages.keys()) {
        if (/^(zh|en)\//.test(file)) assert(routes.has(file), `Missing ${file} in sitemap`)
    }
    assert.equal(pages.get('index.html')('link[rel="canonical"]').attr('href'), origin + base)
}
for (const locale of locales) {
    const file = [...files].find(file => path.basename(file).startsWith(`@localSearchIndex${locale}.`))
    assert(file, `Missing local search index for ${locale}`)
    const { default: json } = await import(pathToFileURL(path.join(dist, file)))
    const index = JSON.parse(json)
    const routes = Object.values(index.documentIds)
    assert(routes.length > packages.length, `Incomplete ${locale} search index`)
    assert(routes.every(route => route.startsWith(`${base}${locale}/`)), `Search index includes the wrong language: ${locale}`)
    assert(routes.some(route => route.startsWith(`${base}${locale}/packages/tools/api/array`)), `Missing tool groups in ${locale} search`)
}
console.log(`Checked ${pages.size} HTML files, ${packages.length} packages, ${toolGroups.length} tool groups, ${runtimeEntries} runtime entries and ${syntaxExamples} shared examples.`)
