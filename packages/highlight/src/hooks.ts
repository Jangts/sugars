import type { Grammar } from './grammar.js'
import type { TokenStream } from './tokenize.js'

export type RenderCallback = (this: Element) => void

interface RenderAllEnvironment {
    callback: RenderCallback | undefined
    selector: string
    elements?: Iterable<Element> | ArrayLike<Element>
}

interface ElementEnvironment {
    element: Element
    language: string
    code: string
    grammar: Grammar | undefined
    highlightedCode?: string
}

interface HighlightEnvironment extends ElementEnvironment {
    grammar: Grammar
}

type InsertEnvironment = HighlightEnvironment & { highlightedCode: string }

interface WrapEnvironment {
    type: string
    content: string
    tag: string
    classes: string[]
    attributes: Record<string, string>
    language: string
    parent?: TokenStream
}

interface HookEnvironments {
    'before-highlightall': RenderAllEnvironment
    'before-highlight': HighlightEnvironment
    'before-insert': InsertEnvironment
    'after-highlight': InsertEnvironment
    complete: ElementEnvironment
    wrap: WrapEnvironment
}

type HookName = keyof HookEnvironments
type Hook<Name extends HookName> = (environment: HookEnvironments[Name]) => void
type HookRegistry = { [Name in HookName]?: Hook<Name>[] }

export interface Hooks {
    readonly all: HookRegistry
    add<Name extends HookName>(name: Name, callback: Hook<Name>): void
    run<Name extends HookName>(name: Name, environment: HookEnvironments[Name]): void
}

const all: HookRegistry = Object.create(null)

export const hooks: Hooks = {
    all,
    add<Name extends HookName>(name: Name, callback: Hook<Name>): void {
        const callbacks: Hook<Name>[] = all[name] ??= []
        callbacks.push(callback)
    },
    run<Name extends HookName>(name: Name, environment: HookEnvironments[Name]): void {
        const callbacks: Hook<Name>[] | undefined = all[name]
        callbacks?.forEach(callback => callback(environment))
    },
}
