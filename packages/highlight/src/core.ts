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
    // Entity tooltips use HTML character references to show the decoded character.
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

export function highlight(text: string, language: string): string
export function highlight(text: string, grammar: Grammar, language?: string): string
export function highlight(text: string, target: Grammar | string, language = ''): string {
    const grammar = typeof target === 'string' ? getGrammar(target) : target
    return grammar ? stringify(tokenize(text, grammar), typeof target === 'string' ? target : language) : encode(text)
}

export function renderElement(element: Element, callback?: RenderCallback): void {
    const source = element.closest('[data-language], [data-lang]')
    const language = source?.getAttribute('data-language') || source?.getAttribute('data-lang') || ''
    element.setAttribute('data-language', language)
    const parent = element.parentElement
    if (parent?.localName === 'pre') parent.setAttribute('data-language', language)

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
    hooks.run('complete', environment)
}

export function renderAll(callback?: RenderCallback): void
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

export function render(element: Element, callback?: RenderCallback): void
export function render(callback?: RenderCallback): void
export function render(elementOrCallback?: Element | RenderCallback, callback?: RenderCallback): void {
    if (elementOrCallback && typeof elementOrCallback === 'object') {
        renderElement(elementOrCallback, callback)
    } else {
        renderAll(elementOrCallback)
    }
}

export const highlighter = { highlight, tokenize, render, renderElement, renderAll, hooks, languages }
