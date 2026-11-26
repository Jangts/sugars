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
// simulate the reorder so each move is relative to the preceding moves.
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

    // Track each matched child's destination so a moved unkeyed child cannot
    // get confused with a later unkeyed child in the same list.
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
