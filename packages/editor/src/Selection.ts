/*! Ported from TangramJS form/SimpleEditor/Selection.js. */

/* 保存属于当前编辑器的选区，工具栏或其他控件移走焦点后仍可恢复命令作用的位置。 */

import { EditorRange } from './Range.js'

export class EditorSelection {
    range?: EditorRange

    constructor(private readonly richareas: readonly HTMLElement[]) {}

    getRange(): EditorRange | undefined {
        return this.restoreSelection()
    }

    /** 保存的 Range 仍属于当前编辑器时才恢复，避免对其他编辑器或已移除区域执行命令。 */
    restoreSelection(): EditorRange | undefined {
        const range = this.range
        const area = range && this.richareas.find(item => range.isBelongTo(item))
        if (!range || !area) return this.createEmptyRange()
        const selection = area.ownerDocument.getSelection()
        if (!selection) return
        area.focus()
        selection.removeAllRanges()
        selection.addRange(range.originRange)
        return range
    }

    saveRange(range?: EditorRange): EditorRange | undefined {
        const document = this.richareas[0]?.ownerDocument
        if (!document) return this.range
        const selection = document.getSelection()
        if (!range && selection?.rangeCount) range = new EditorRange(selection.getRangeAt(0).cloneRange(), document)
        if (range && this.richareas.some(area => range.isBelongTo(area))) this.range = range
        return this.range
    }

    collapseRange(toStart = false): this {
        this.range?.collapse(toStart)
        this.restoreSelection()
        return this
    }

    getSelectionText(): string { return this.range?.text ?? '' }
    getSelectionContainerElem(range = this.range): Element | null { return range?.commonElem ?? null }
    getSelectionStartElem(range = this.range): Element | null {
        const node = range?.startNode
        return node?.nodeType === 1 ? node as Element : node?.parentElement ?? null
    }
    getSelectionEndElem(range = this.range): Element | null {
        const node = range?.endNode
        return node?.nodeType === 1 ? node as Element : node?.parentElement ?? null
    }
    isSelectionEmpty(): boolean { return this.range?.isEmpty() ?? false }

    /** 在编辑区没有可用选区时，建立该区域可用于下一次插入的折叠选区。 */
    createEmptyRange(index = 0): EditorRange | undefined {
        const area = this.richareas[index]
        if (!area) return
        const document = area.ownerDocument
        const selection = document.getSelection()
        if (!selection) return
        const range = document.createRange()
        range.selectNodeContents(area)
        range.collapse(false)
        area.focus()
        selection.removeAllRanges()
        selection.addRange(range)
        return this.saveRange(new EditorRange(range, document))
    }

    createRangeByElem(element: Node, toStart?: boolean, isContent = false): EditorRange | undefined {
        const document = this.richareas[0]?.ownerDocument
        if (!document || !this.richareas.some(area => area.contains(element))) return
        const range = new EditorRange(document.createRange(), document)
        this.saveRange(range.selectElem(element, toStart, isContent))
        return this.restoreSelection()
    }
}
