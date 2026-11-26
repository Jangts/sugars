/* 保存虚拟节点的标签、属性、子节点与比较所需的后代数量，并可渲染成真实 DOM。 */

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

    /**
     * @param tagName - 创建真实元素时使用的标签名。
     * @param props - 节点属性。传入子节点数组时用作简写。
     * @param children - 子节点列表。值会归一为虚拟节点或文本。
     */
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

    /**
     * @param doc - 创建真实节点所用的文档，默认当前文档。
     * @returns 组装完成但尚未挂载的 DOM 元素。
     */
    render(doc: Document = document): HTMLElement {
        const element = doc.createElement(this.tagName)
        setProps(element, this.props)
        for (const child of this.children) {
            element.appendChild(child instanceof VElement ? child.render(doc) : doc.createTextNode(child))
        }
        return element
    }
}

/**
 * @param tagName - 要渲染的标签名。
 * @param props - 属性或简写的子节点数组。
 * @param children - 显式指定的子节点。
 * @returns 可供 diff 或 render 使用的 VElement。
 */
export function createVElement(tagName: string, props?: VElementProps | readonly VChild[] | null, children?: readonly VChild[]): VElement {
    return new VElement(tagName, props, children)
}

export { diff, patch }
export type { PatchOperation, Patches } from './patch.js'
