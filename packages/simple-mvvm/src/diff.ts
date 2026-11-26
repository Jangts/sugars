/* 按旧虚拟树的先序节点编号产生补丁。子列表先对齐身份，再比较内容并记录重排。 */

import { listDiff } from './list-diff.js'
import { PROPS, REORDER, REPLACE, TEXT, skipPatchChildren } from './patch.js'
import type { PatchOperation, Patches } from './patch.js'
import type { VElement, VElementProps, VNode } from './v-element.js'

// TangramJS src/dom/VElement/diff.js
function diffProps(oldNode: VElement, newNode: VElement): VElementProps | undefined {
    const oldProps = oldNode.props
    const newProps = newNode.props
    const changes: VElementProps = Object.create(null)
    for (const key of Object.keys(oldProps)) {
        const value = Object.hasOwn(newProps, key) ? newProps[key] : undefined
        if (value !== oldProps[key]) changes[key] = value
    }
    for (const key of Object.keys(newProps)) {
        if (!Object.hasOwn(oldProps, key)) changes[key] = newProps[key]
    }
    if (Object.keys(changes).length) return changes
}

function diffChildren(oldNode: VElement, newNode: VElement, index: number, patches: Patches, currentPatch: PatchOperation[]): void {
    const { moves, children } = listDiff(oldNode.children, newNode.children)
    if (moves.length) currentPatch.push({ type: REORDER, moves })

    let currentNodeIndex = index + 1
    for (const [i, child] of oldNode.children.entries()) {
        dfsWalk(child, children[i] ?? null, currentNodeIndex, patches)
        currentNodeIndex += typeof child === 'string' ? 1 : child.count + 1
    }
}

function dfsWalk(oldNode: VNode, newNode: VNode | null, index: number, patches: Patches): void {
    if (newNode === null) {
        // 父节点的重排操作会删除整个子树，包括由外部管理的子节点。
        if (typeof oldNode !== 'string') skipPatchChildren(patches, index, oldNode.count)
        return
    }
    const currentPatch: PatchOperation[] = []
    if (typeof oldNode === 'string' && typeof newNode === 'string') {
        if (newNode !== oldNode) currentPatch.push({ type: TEXT, content: newNode })
    } else if (typeof oldNode !== 'string' && typeof newNode !== 'string' &&
        oldNode.tagName === newNode.tagName && oldNode.key?.toString() === newNode.key?.toString()) {
        const ignored = Object.hasOwn(newNode.props, 'ignore')
        if (!ignored && Object.hasOwn(oldNode.props, 'ignore')) {
            currentPatch.push({ type: REPLACE, node: newNode })
            skipPatchChildren(patches, index, oldNode.count)
        } else {
            const props = diffProps(oldNode, newNode)
            if (props) currentPatch.push({ type: PROPS, props })
            if (ignored) skipPatchChildren(patches, index, oldNode.count)
            else diffChildren(oldNode, newNode, index, patches, currentPatch)
        }
    } else {
        currentPatch.push({ type: REPLACE, node: newNode })
        if (typeof oldNode !== 'string') skipPatchChildren(patches, index, oldNode.count)
    }

    if (currentPatch.length) patches[index] = currentPatch
}

/**
 * 补丁索引沿用旧树顺序。应用补丁时须从旧树对应的真实根节点开始。
 *
 * @param oldTree - 当前真实 DOM 对应的旧虚拟树。
 * @param newTree - 期望渲染的新虚拟树。
 * @returns 按旧树节点编号分组的补丁。
 */
export function diff(oldTree: VNode, newTree: VNode): Patches {
    const patches: Patches = {}
    dfsWalk(oldTree, newTree, 0, patches)
    return patches
}
