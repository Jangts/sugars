/* 用 key 与无 key 项的相对顺序对齐前后列表，算出可复用节点和插入、移除动作。 */

import type { VNode } from './v-element.js'

export type Move =
    | { index: number; type: 0 }
    | { index: number; type: 1; item: VNode; from?: number }

function getItemKey(item: VNode | null | undefined): string | undefined {
    return typeof item === 'object' && item?.key != null && item.key !== '' ? String(item.key) : undefined
}

function makeKeyIndexAndFree(list: readonly VNode[]) {
    const keyIndex = new Map<string, number>()
    const free: number[] = []
    for (const [index, item] of list.entries()) {
        const itemKey = getItemKey(item)
        if (itemKey !== undefined) keyIndex.set(itemKey, index)
        else free.push(index)
    }
    return { keyIndex, free }
}

// TangramJS src/arr/diff.js. Align old children to their new counterparts, then
// 逐次模拟重排，让每一步的索引相对于上一步结果计算。
/**
 * @param oldList - 已存在的子节点序列。
 * @param newList - 下一次渲染需要的子节点序列。
 * @returns 与旧节点对齐的 children 映射以及按应用顺序排列的 moves。
 */
export function listDiff(oldList: readonly VNode[], newList: readonly VNode[]) {
    const { keyIndex: newKeyIndex, free: newFree } = makeKeyIndexAndFree(newList)
    const moves: Move[] = []
    let freeIndex = 0
    const simulateList = oldList.map(item => {
        const key = getItemKey(item)
        return key === undefined ? newFree[freeIndex++] : newKeyIndex.get(key)
    })
    const children = simulateList.map(index => index === undefined ? null : newList[index] ?? null)

    for (let i = 0; i < simulateList.length;) {
        if (simulateList[i] === undefined) {
            moves.push({ index: i, type: 0 })
            simulateList.splice(i, 1)
        } else {
            i++
        }
    }

    // 为每个匹配项记录目标索引，防止移走的无 key 节点与后续无 key 项错配。
    for (const [i, item] of newList.entries()) {
        if (simulateList[i] === i) continue
        const from = simulateList.indexOf(i, i + 1)
        if (from >= 0) {
            moves.push({ index: i, type: 1, item, from })
            simulateList.splice(from, 1)
        } else {
            moves.push({ index: i, type: 1, item })
        }
        simulateList.splice(i, 0, i)
    }

    return { moves, children }
}
