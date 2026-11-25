/*! Ported from TangramJS form/SimpleEditor/Range.js. */

/** The editor's original range operations, backed by the owner's native Range. */
export class EditorRange {
    constructor(readonly originRange: Range, private readonly document: Document) {}

    get commonNode(): Node { return this.originRange.commonAncestorContainer }
    get commonElem(): Element | null {
        const node = this.commonNode
        return node.nodeType === 1 ? node as Element : node.parentElement
    }
    get startNode(): Node { return this.originRange.startContainer }
    get endNode(): Node { return this.originRange.endContainer }
    get startOffset(): number { return this.originRange.startOffset }
    get endOffset(): number { return this.originRange.endOffset }
    get collapsed(): boolean { return this.originRange.collapsed }
    get type(): 'Caret' | 'Range' { return this.collapsed ? 'Caret' : 'Range' }
    get text(): string { return this.originRange.toString() }
    get html(): string {
        const element = this.document.createElement('div')
        element.append(this.originRange.cloneContents())
        return element.innerHTML
    }

    isBelongTo(element: HTMLElement): boolean {
        return element.contains(this.startNode) && element.contains(this.endNode)
    }

    isEmpty(): boolean { return this.collapsed }

    selectElem(element: Node, toStart?: boolean, isContent = false): this {
        if (isContent) this.originRange.selectNodeContents(element)
        else this.originRange.selectNode(element)
        if (toStart !== undefined) this.collapse(toStart)
        return this
    }

    collapse(toStart = false): this {
        this.originRange.collapse(toStart)
        return this
    }

    setEnd(node: Node, offset: number): this {
        this.originRange.setEnd(node, offset)
        return this
    }

    queryCommandValue(name: string): string { return this.document.queryCommandValue(name) }
    queryCommandState(name: string): boolean { return this.document.queryCommandState(name) }

    execCommand(name: string, value?: string, showUI = false): boolean {
        return this.document.execCommand(name, showUI, value)
    }

    insertHTML(html: string): boolean {
        // Use the native command to retain the browser undo buffer.
        if (this.execCommand('insertHTML', html)) return true
        const fragment = this.originRange.createContextualFragment(html)
        if (!fragment.lastChild) return false
        this.insertElem(fragment)
        return true
    }

    insertElem(element: Node): void {
        const last = element.nodeType === 11 ? element.lastChild : element
        if (!last) return
        this.originRange.deleteContents()
        this.originRange.insertNode(element)
        this.originRange.setStartAfter(last)
        this.originRange.collapse(true)
    }
}
