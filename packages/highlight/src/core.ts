/* 组织语言选择、分词、HTML 输出和 DOM 渲染，按阶段把环境对象交给扩展钩子。 */

import { getGrammar, languages } from './grammar.js'
import type { Grammar } from './grammar.js'
import { hooks } from './hooks.js'
import type { RenderCallback } from './hooks.js'
import { tokenize } from './tokenize.js'
import type { Token, TokenContent, TokenStream } from './tokenize.js'

const codeSelector = 'code[data-language], [data-language] code, code[data-lang], [data-lang] code'

function encode(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ')
}

function encodeAttribute(value: string): string {
    // 实体提示用字符引用显示解码后的字符。
    return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stringify(content: Token | TokenContent, language: string, parent?: TokenStream): string {
    if (typeof content === 'string') return encode(content)
    if (Array.isArray(content)) return content.map(token => stringify(token, language, content)).join('')

    const attributes: Record<string, string> = Object.create(null)
    const environment = {
        type: content.type,
        content: stringify(content.content, language, parent),
        tag: 'span',
        classes: ['ib-hl', content.type],
        attributes,
        language,
        parent,
    }
    if (content.type === 'comment') attributes.spellcheck = 'true'
    if (content.alias) environment.classes.push(...[content.alias].flat())
    hooks.run('wrap', environment)

    const serialized = Object.entries(environment.attributes)
        .filter(([name]) => /^[\w:.-]+$/.test(name))
        .map(([name, value]) => `${name}="${encodeAttribute(value)}"`)
        .join(' ')
    return `<${environment.tag} class="${encodeAttribute(environment.classes.join(' '))}" ${serialized}>${environment.content}</${environment.tag}>`
}

/**
 * 将纯文本分词并返回转义后的 HTML。语言未登记时只对文本做转义。
 *
 * @param text - 尚未经过 HTML 转义的源码文本。
 * @param language - 已登记的语言名或别名。
 * @returns 由词法标记生成的 HTML，未知语言返回转义后的纯文本。
 * @throws {TypeError} 所选词法在未消耗输入的情况下递归。
 */
export function highlight(text: string, language: string): string
/**
 * 用调用方提供的词法表分词。
 * @param text - 未转义的源码。
 * @param grammar - 将按插入顺序尝试的词法表。
 * @param language - 给 wrap 钩子使用的语言名，默认空字符串。
 * @returns 转义并包装词法标记后的 HTML。
 * @throws {TypeError} 词法在同一输入上递归。
 */
export function highlight(text: string, grammar: Grammar, language?: string): string
export function highlight(text: string, target: Grammar | string, language = ''): string {
    const grammar = typeof target === 'string' ? getGrammar(target) : target
    return grammar ? stringify(tokenize(text, grammar), typeof target === 'string' ? target : language) : encode(text)
}

/**
 * 从元素及祖先的 data-language 或 data-lang 识别语言，以 textContent 为分词输入。
 *
 * @param element - 待高亮的代码元素。标记名来自它或最近的语言属性祖先。
 * @param callback - 仅实际写入高亮内容后调用，this 为原元素。
 */
export function renderElement(element: Element, callback?: RenderCallback): void {
    const source = element.closest('[data-language], [data-lang]')
    const language = source?.getAttribute('data-language') || source?.getAttribute('data-lang') || ''
    element.setAttribute('data-language', language)
    const parent = element.parentElement
    if (parent?.localName === 'pre') parent.setAttribute('data-language', language)

    // 读 textContent 允许对已高亮的节点重新分词，旧 span 标签不会成为源码。
    const grammar = getGrammar(language)
    const environment = { element, language, grammar, code: element.textContent ?? '' }
    if (grammar && environment.code) {
        const input = Object.assign(environment, { grammar })
        hooks.run('before-highlight', input)
        const output = Object.assign(input, { highlightedCode: highlight(input.code, input.grammar, input.language) })
        hooks.run('before-insert', output)
        output.element.innerHTML = output.highlightedCode
        callback?.call(element)
        hooks.run('after-highlight', output)
    }
    // 缺少词法或文本时也进入 complete，允许扩展执行统一收尾。
    hooks.run('complete', environment)
}

/**
 * 扫描根节点下匹配的代码块，根节点缺省使用当前文档。
 *
 * @param callback - 各代码块实际写入高亮内容后调用。
 */
export function renderAll(callback?: RenderCallback): void
/**
 * 限定高亮扫描范围。
 * @param root - 提供候选代码元素的文档、元素或文档片段。
 * @param callback - 各代码块写入后调用。
 */
export function renderAll(root: ParentNode, callback?: RenderCallback): void
export function renderAll(rootOrCallback?: ParentNode | RenderCallback, callback?: RenderCallback): void {
    const root = rootOrCallback && typeof rootOrCallback === 'object' ? rootOrCallback : globalThis.document
    if (!root) return

    const environment: Parameters<typeof hooks.run<'before-highlightall'>>[1] = {
        callback: typeof rootOrCallback === 'function' ? rootOrCallback : callback,
        selector: codeSelector,
    }
    hooks.run('before-highlightall', environment)
    const elements = environment.elements ?? root.querySelectorAll(environment.selector)
    for (const element of Array.from(elements)) renderElement(element, environment.callback)
}

/**
 * 高亮一个代码元素。
 * @param element - 要读取及写回的元素。
 * @param callback - 元素写入高亮内容后调用。
 */
export function render(element: Element, callback?: RenderCallback): void
/**
 * 从当前文档批量查找代码块。
 * @param callback - 对发生写入的代码块逐一调用。
 */
export function render(callback?: RenderCallback): void
export function render(elementOrCallback?: Element | RenderCallback, callback?: RenderCallback): void {
    if (elementOrCallback && typeof elementOrCallback === 'object') {
        renderElement(elementOrCallback, callback)
    } else {
        renderAll(elementOrCallback)
    }
}

export const highlighter = { highlight, tokenize, render, renderElement, renderAll, hooks, languages }
