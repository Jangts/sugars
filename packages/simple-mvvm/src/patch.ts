import type { Move } from './list-diff.js'
import type { VElementProps, VNode } from './v-element.js'

// TangramJS src/dom/VElement/patch.js
export const REPLACE = 0
export const REORDER = 1
export const PROPS = 2
export const TEXT = 3

export type PatchOperation =
    | { type: typeof REPLACE; node: VNode }
    | { type: typeof REORDER; moves: Move[] }
    | { type: typeof PROPS; props: VElementProps }
    | { type: typeof TEXT; content: string }

export type Patches = Record<number, PatchOperation[]>

const skippedChildren = new WeakMap<Patches, Map<number, number>>()

export function skipPatchChildren(patches: Patches, index: number, count: number): void {
    let skips = skippedChildren.get(patches)
    if (!skips) {
        skips = new Map()
        skippedChildren.set(patches, skips)
    }
    skips.set(index, count)
}

// Style and form values follow TangramJS src/dom/dom.js, set and removeAttr.
export function setProps(node: HTMLElement, props: VElementProps): void {
    for (const [key, value] of Object.entries(props)) {
        const name = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key
        if (name === 'style') {
            node.style.cssText = value == null ? '' : String(value)
        } else if (name === 'value' && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
            (node as HTMLInputElement | HTMLTextAreaElement).value = value == null ? '' : String(value)
        } else if (typeof Reflect.get(node.style, name) === 'string') {
            Reflect.set(node.style, name, value == null ? '' : String(value))
        } else if (typeof value === 'boolean' && typeof Reflect.get(node, key) === 'boolean') {
            node.toggleAttribute(name, value)
            Reflect.set(node, key, value)
        } else if (value == null) {
            node.removeAttribute(name)
            if (key === 'checked' || key === 'selected') Reflect.set(node, key, false)
        } else {
            node.setAttribute(name, String(value))
        }
    }
}

function renderNode(node: VNode, doc: Document): Node {
    return typeof node === 'string' ? doc.createTextNode(node) : node.render(doc)
}

function reorderChildren(node: Node, moves: Move[], doc: Document): void {
    for (const move of moves) {
        const { index } = move
        if (move.type === 0) {
            const child = node.childNodes[index]
            if (child) node.removeChild(child)
        } else {
            const existing = move.from === undefined ? undefined : node.childNodes[move.from]
            const insertNode = existing ?? renderNode(move.item, doc)
            node.insertBefore(insertNode, node.childNodes[index] ?? null)
        }
    }
}

function applyPatches(node: Node, currentPatches: PatchOperation[], doc: Document): Node {
    for (const currentPatch of currentPatches) {
        switch (currentPatch.type) {
            case REPLACE: {
                const newNode = renderNode(currentPatch.node, doc)
                node.parentNode?.replaceChild(newNode, node)
                node = newNode
                break
            }
            case REORDER:
                reorderChildren(node, currentPatch.moves, doc)
                break
            case PROPS:
                setProps(node as HTMLElement, currentPatch.props)
                break
            case TEXT:
                node.nodeValue = currentPatch.content
                break
            default:
                throw new Error('Unknown VElement patch type')
        }
    }
    return node
}

function dfsWalk(node: Node, walker: { index: number }, patches: Patches, doc: Document, skips?: Map<number, number>): Node {
    const currentPatches = patches[walker.index]
    const skip = skips?.get(walker.index)
    if (skip !== undefined) {
        walker.index += skip
    } else {
        for (const child of Array.from(node.childNodes)) {
            walker.index++
            dfsWalk(child, walker, patches, doc, skips)
        }
    }
    return currentPatches ? applyPatches(node, currentPatches, doc) : node
}

function apply(node: Node, patches: Patches): Node {
    return dfsWalk(node, { index: 0 }, patches, node.ownerDocument ?? document, skippedChildren.get(patches))
}

export const patch = Object.assign(apply, { REPLACE, REORDER, PROPS, TEXT })
