/* 按触发阶段保存高亮回调，渲染和分词路径共享同一个可修改的环境对象。 */

import type { Grammar } from './grammar.js'
import type { TokenStream } from './tokenize.js'

/** 在代码块实际写回 HTML 后调用，this 指向渲染入口收到的元素。 */
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
    /** 模板词法临时用占位符替代嵌入内容，渲染后会恢复。 */
    tokenStack?: string[]
    backupCode?: string
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
    /** 按阶段存放的回调队列，保留登记顺序。 */
    readonly all: HookRegistry
    /**
     * @param name - 回调所属的高亮阶段。
     * @param callback - 读取或更新该阶段环境的函数。
     */
    add<Name extends HookName>(name: Name, callback: Hook<Name>): void
    /**
     * @param name - 当前要触发的阶段。
     * @param environment - 同一阶段的回调共享的可修改环境。
     */
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
