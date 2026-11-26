import { diff } from './diff.js'
import { patch, setProps } from './patch.js'

export type VElementProps = Record<string, string | number | boolean | null | undefined> & {
    key?: string | number
}
export type VNode = VElement | string
export type VChild = VNode | number | boolean | null | undefined

// TangramJS src/dom/VElement/VElement.js
export class VElement {
    static diff = diff
    static patch = patch
    static create = createVElement

    readonly tagName: string
    readonly props: VElementProps
    readonly children: VNode[]
    readonly key?: string | number
    readonly count: number

    constructor(tagName: string, props?: VElementProps | readonly VChild[] | null, children?: readonly VChild[]) {
        if (Array.isArray(props)) {
            children = props
            props = null
        }
        this.tagName = tagName
        this.props = (props as VElementProps | null | undefined) ?? {}
        this.key = this.props.key

        let count = 0
        this.children = Array.from(children ?? [], child => {
            count++
            if (child instanceof VElement) {
                count += child.count
                return child
            }
            return String(child)
        })
        this.count = count
    }

    render(doc: Document = document): HTMLElement {
        const element = doc.createElement(this.tagName)
        setProps(element, this.props)
        for (const child of this.children) {
            element.appendChild(child instanceof VElement ? child.render(doc) : doc.createTextNode(child))
        }
        return element
    }
}

export function createVElement(tagName: string, props?: VElementProps | readonly VChild[] | null, children?: readonly VChild[]): VElement {
    return new VElement(tagName, props, children)
}

export { diff, patch }
export type { PatchOperation, Patches } from './patch.js'
