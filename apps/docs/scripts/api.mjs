/** 根据实际 exports 与构建声明提取签名，不加载任何包的运行时代码。 */
import { access, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { API, SymbolFlags } from 'typescript/unstable/sync'
import { isInterfaceDeclaration, isTypeAliasDeclaration, isTypeReferenceNode, isVariableDeclaration } from 'typescript/unstable/ast/is'
import { packages, text, guideRoute, toolGroups, toolRoute } from './catalog.mjs'

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const matches = (pattern, name) => new RegExp('^' + pattern.split('*').map(escape).join('(.*)') + '$').exec(name)
export const symbolAnchor = name => 'export-' + name.replace(/[^a-z\d]+/gi, '-').toLowerCase()
export const entryAnchor = name => 'entry-' + name.replace(/[^a-z\d]+/gi, '-').toLowerCase()

async function expand(directory, pattern, target) {
    if (!pattern.includes('*')) return [['', pattern]]
    const folder = path.join(directory, path.posix.dirname(target))
    const tail = path.posix.basename(target)
    if (path.posix.dirname(target).includes('*') || tail.split('*').length !== 2) {
        throw new Error(`Unsupported export pattern: ${pattern} -> ${target}`)
    }
    return (await readdir(folder, { withFileTypes: true }))
        .filter(entry => entry.isFile())
        .flatMap(entry => {
            const match = matches(tail, entry.name)
            return match ? [[match[1], pattern.replace('*', match[1])]] : []
        })
        .sort((a, b) => a[1].localeCompare(b[1]))
}

async function publicEntries({ directory, manifest }) {
    const entries = Object.entries(manifest.exports)
    const isSelected = (subpath, pattern) => {
        if (Object.hasOwn(manifest.exports, subpath)) return subpath === pattern
        return entries.filter(([key]) => key.includes('*') && matches(key, subpath))
            .sort(([a], [b]) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)[0]?.[0] === pattern
    }
    const resolved = []
    for (const [pattern, conditions] of entries) {
        if (conditions === null) continue
        const target = conditions.import ?? conditions.require ?? conditions.default
        if (!target || !conditions.types) throw new Error(`Missing entry or declaration: ${manifest.name} ${pattern}`)
        for (const [match, subpath] of await expand(directory, pattern, target)) {
            if (!isSelected(subpath, pattern)) continue
            const file = path.join(directory, target.replace('*', match))
            const declaration = path.join(directory, conditions.types.replace('*', match))
            await Promise.all([access(file), access(declaration)])
            const name = subpath === '.' ? manifest.name : manifest.name + subpath.slice(1)
            resolved.push({ name, file, declaration, css: file.endsWith('.css'), subpath })
        }
    }
    return resolved
}

function reflect(entry, { program, checker, emitter }) {
    const source = program.getSourceFile(entry.declaration)
    const module = source && checker.getSymbolAtLocation(source)
    if (!module) throw new Error(`Cannot resolve the declarations for ${entry.name}`)
    const commonJS = module.getExports().get('export=')
    const exports = commonJS ? [commonJS] : checker.getExportsOfModule(module)
    if (!exports.length) throw new Error(`No API symbols found in ${entry.name}`)

    const resolve = symbol => symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
    const exportedIds = new Set(exports.map(exported => resolve(exported).id))
    const symbols = exports.map(exported => {
        const symbol = resolve(exported)
        const declarations = symbol.declarations.map(handle => handle.resolve()).filter(Boolean)
        const name = commonJS ? symbol.name : exported.name
        const definitions = declarations.flatMap(declaration => {
            if (!isVariableDeclaration(declaration)) return [declaration]
            const node = declaration.parent?.parent ?? declaration
            if (!declaration.type || !isTypeReferenceNode(declaration.type)) return [node]
            // 可调用导出可能引用内部接口，补出调用约定，同时避免重复展示同入口已导出的类型。
            const reference = checker.getSymbolAtLocation(declaration.type.typeName)
            const target = reference && resolve(reference)
            if (!target || exportedIds.has(target.id)) return [node]
            const shapes = target.declarations.map(handle => handle.resolve()).filter(related =>
                related && (isInterfaceDeclaration(related) || isTypeAliasDeclaration(related))
                && !related.getSourceFile().fileName.includes('/node_modules/'))
            return [...shapes, node]
        })
        const content = definitions.map(node => emitter.printNode(node)
            .replace(/\/\*\*[\s\S]*?\*\//g, '').trim())
        const typeOnly = !(symbol.flags & SymbolFlags.Value)
        if (!content.length) throw new Error(`No declaration for ${entry.name}#${name}`)
        return {
            name, typeOnly,
            source: declarations[0].getSourceFile().fileName,
            summary: symbol.getDocumentationComment(checker),
            signature: [...new Set(content)].join('\n'),
        }
    })
    return { ...entry, symbols, commonJS: Boolean(commonJS) }
}

export async function collectApi() {
    const entries = await Promise.all(packages.map(publicEntries))
    const declarations = [...new Set(entries.flat().filter(entry => !entry.css).map(entry => entry.declaration))]
    // 使用与库构建相同的 TypeScript 7。临时项目只包含被发布入口引用的声明。
    const temp = await mkdtemp(path.join(tmpdir(), 'sugars-api-'))
    const config = path.join(temp, 'tsconfig.json')
    const compiler = new API()
    try {
        await writeFile(config, JSON.stringify({
            compilerOptions: { target: 'ES2025', module: 'NodeNext', skipLibCheck: true, noEmit: true, types: [] },
            files: declarations,
        }))
        const snapshot = compiler.updateSnapshot({ openProjects: [config] })
        const project = snapshot.getProject(config)
        if (!project) throw new Error('Could not open the API declaration project')
        return new Map(packages.map((pkg, index) => [
            pkg.id, entries[index].map(entry => entry.css ? { ...entry, symbols: [] } : reflect(entry, project)),
        ]))
    } finally {
        compiler.close()
        await rm(temp, { recursive: true, force: true })
    }
}

const fenceFor = value => '\x60'.repeat(Math.max(3, ...[...value.matchAll(/\x60+/g)].map(match => match[0].length + 1)))
const inline = value => '\x60' + value + '\x60'
const link = (label, url) => `[${label}](${url})`

function entryDoc(locale, entry) {
    const intro = `## ${inline(entry.name)} {#${entryAnchor(entry.name)}}\n\n`
    if (entry.commonJS) {
        const implementation = entry.symbols[0]
        const used = `var ${implementation.name} = require('${entry.name}')`
        return intro + '\x60\x60\x60js\n' + used + '\n\x60\x60\x60\n\n'
            + (locale === 'zh' ? '此 CommonJS 入口返回该值。\n\n' : 'This CommonJS entry returns this value.\n\n')
            + symbolDoc(locale, implementation, entry.name)
    }
    return intro + entry.symbols.map(symbol => symbolDoc(locale, symbol, entry.name)).join('')
}

function symbolDoc(locale, symbol, owner) {
    const fence = fenceFor(symbol.signature)
    // 类型签名两种语言共用。只在中文页引用原稿里的中文源码说明。
    const summary = locale === 'zh' && symbol.summary
        ? symbol.summary.replace(/[<>{}]/g, character => `&#${character.charCodeAt(0)};`) + '\n\n' : ''
    return `### ${inline(symbol.name)} {#${entryAnchor(owner)}-${symbolAnchor(symbol.name)}}\n\n`
        + summary + `${fence}ts\n${symbol.signature}\n${fence}\n\n`
}

export function renderApi(locale, pkg, entries) {
    const heading = `# ${pkg.manifest.name} · ${text[locale].api}\n\n${text[locale].generated}\n\n`
        + link(text[locale].guides, guideRoute(locale, pkg.id)) + '\n\n'
    if (pkg.id === 'tools') {
        const rootEntry = entries.find(entry => entry.subpath === '.')
        const groups = toolGroups.map(group => `- ${link(group[locale], toolRoute(locale, group.id))}`).join('\n')
        const aliases = entries.filter(entry => entry !== rootEntry && entry.declaration === rootEntry.declaration)
        const shortcuts = aliases.map(entry => `${inline(entry.name)} → ${link(inline(rootEntry.name), '#' + entryAnchor(rootEntry.name))}\n\n`).join('')
        return heading + `## ${text[locale].category}\n\n${groups}\n\n` + shortcuts + entryDoc(locale, rootEntry)
    }
    const css = entries.filter(entry => entry.css)
    const styles = css.length ? `## ${text[locale].styles}\n\n` + css.map(entry => `- ${inline(entry.name)}`).join('\n') + '\n' : ''
    return heading + entries.filter(entry => !entry.css).map(entry => entryDoc(locale, entry)).join('') + styles
}

export function matchTools(entries) {
    const rootEntry = entries.find(entry => entry.subpath === '.')
    const bySource = new Map(entries.filter(entry => entry.subpath !== '.' && entry.symbols.length === 1 && entry.symbols[0].name === 'default')
        .map(entry => [entry.declaration, entry]))
    const assigned = new Set()
    const categories = toolGroups.map(group => {
        const entry = entries.find(value => value.subpath === './' + group.id)
        if (!entry) throw new Error(`Missing tool category: ${group.id}`)
        const leaves = entry.symbols.map(symbol => {
            const leaf = bySource.get(symbol.source)
            const rootName = rootEntry.symbols.find(rootSymbol => rootSymbol.source === symbol.source)?.name
            if (!leaf || !rootName) throw new Error(`Missing public tool import for ${symbol.name}`)
            assigned.add(leaf.name)
            return { leaf, rootName, symbol }
        })
        return { group, entry, leaves }
    })
    if (assigned.size !== bySource.size || assigned.size !== rootEntry.symbols.length || entries.filter(entry => entry.declaration !== rootEntry.declaration).length !== bySource.size + categories.length) {
        throw new Error('Tool categories must cover every root export and public individual entry')
    }
    return categories
}

export function renderToolGroup(locale, { group, entry, leaves }) {
    const table = [
        locale === 'zh' ? '| 分类导出 | 根入口导出 | 单函数导入 |' : '| Category export | Root export | Individual import |',
        '| --- | --- | --- |',
        ...leaves.map(({ leaf, rootName, symbol }) =>
            `| ${link(inline(symbol.name), '#' + entryAnchor(entry.name) + '-' + symbolAnchor(symbol.name))} | ${inline(rootName)} | ${inline(leaf.name)} |`),
    ].join('\n')
    return `# ${group[locale]} · @sugars/tools\n\n${table}\n\n` + entryDoc(locale, entry)
}
