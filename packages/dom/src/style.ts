import type { RuntimeCollection, SelectionValue } from './runtime-types.js'
import type { Offset, Setter } from './index.js'
import { camelCase } from './data.js'
import { isElement, isWindow } from './selection.js'

// TangramJS src/dom/Elements.js, CSS, dimensions and scroll accessors.
export const cssNumber = Object.fromEntries(('animationIterationCount aspectRatio columnCount fillOpacity flexGrow flexShrink ' +
    'fontWeight gridArea gridColumn gridColumnEnd gridColumnStart gridRow gridRowEnd gridRowStart lineHeight opacity order ' +
    'orphans scale strokeOpacity strokeWidth widows zIndex zoom').split(' ').map(name => [name, true]))
type Axis = 'width' | 'height'
type Dimension = 'content' | 'inner' | 'outer' | 'margin'
export type ScrollKey = 'scrollTop' | 'scrollLeft'
type StyleInput = Setter<SelectionValue, string | number | null | undefined>
type SizeInput = Setter<SelectionValue, number | string | undefined>
type ScrollInput = Setter<SelectionValue, number>

const cssName = (name: string) => name.startsWith('--') ? name : name.replace(/[A-Z]/g, char => '-' + char.toLowerCase()).replace(/^ms-/, '-ms-')
const dimensions = {
    width: { client: 'clientWidth', scroll: 'scrollWidth', offset: 'offsetWidth', edges: ['Left', 'Right'] },
    height: { client: 'clientHeight', scroll: 'scrollHeight', offset: 'offsetHeight', edges: ['Top', 'Bottom'] },
} as const
const readNumber = (value: string | number | undefined) => Number.parseFloat(value as string) || 0
export const computed = (element?: Element | null): CSSStyleDeclaration | undefined => element?.ownerDocument?.defaultView?.getComputedStyle(element)

export function readStyle(element: SelectionValue, name: string) {
    if (!isElement(element)) return undefined
    const key = cssName(name)
    return computed(element)?.getPropertyValue(key) || element.style?.getPropertyValue(key) || ''
}

export function writeStyle(element: SelectionValue, name: string, value: unknown) {
    if (!element?.style || value == null || typeof value === 'number' && Number.isNaN(value)) return
    const key = cssName(name)
    const relative = typeof value === 'string' && /^([+-])=(-?[\d.]+)([a-z%]*)$/i.exec(value)
    if (relative) {
        const old = readStyle(element, key)
        const unit = relative[3] || old?.match(/[a-z%]+$/i)?.[0] || ''
        value = String(readNumber(old) + (relative[1] === '+' ? 1 : -1) * Number(relative[2])) + unit
    }
    if (typeof value === 'number' && !name.startsWith('--') && !Object.hasOwn(cssNumber, camelCase(name))) {
        value = value + 'px'
    }
    element.style.setProperty(key, String(value))
}

function extraSize(style: CSSStyleDeclaration, edges: readonly string[], prefix: string, suffix = '') {
    return edges.reduce((sum, edge) => sum + readNumber(Reflect.get(style, prefix + edge + suffix)), 0)
}

function readSize(element: SelectionValue, axis: Axis, kind: Dimension) {
    if (element == null) return undefined
    const { edges, client, scroll, offset } = dimensions[axis]
    if (isWindow(element)) return kind === 'outer' ? element[axis === 'width' ? 'innerWidth' : 'innerHeight'] : element.document.documentElement[client]
    if (element.nodeType === 9) {
        const { documentElement: root, body } = element as Document
        return Math.max(root[client], root[scroll], root[offset], body?.[scroll] ?? 0, body?.[offset] ?? 0)
    }
    if (!isElement(element)) return undefined
    const style = computed(element)
    if (!style) return element.getBoundingClientRect()[axis]
    const padding = extraSize(style, edges, 'padding')
    const border = extraSize(style, edges, 'border', 'Width')
    const margin = extraSize(style, edges, 'margin')
    let content = Number.parseFloat(style[axis])
    if (!Number.isFinite(content) || !/px$/.test(style[axis])) {
        content = element.getBoundingClientRect()[axis] - padding - border
    } else if (style.boxSizing === 'border-box') content -= padding + border
    if (kind === 'inner') return Math.max(0, content) + padding
    if (kind === 'outer') return Math.max(0, content) + padding + border
    if (kind === 'margin') return Math.max(0, content) + padding + border + margin
    return Math.max(0, content)
}

function size(collection: RuntimeCollection, axis: Axis, kind: Dimension, value?: SizeInput) {
    if (value === undefined) return readSize(collection[0], axis, kind)
    return collection.each(function (index) {
        let next = typeof value === 'function' ? value.call(this, index, readSize(this, axis, kind)) : value
        if (typeof next === 'number' || typeof next === 'string' && /^-?[\d.]+(?:px)?$/.test(next)) {
            const style = isElement(this) ? computed(this) : undefined
            if (style) {
                const edges = dimensions[axis].edges
                const padding = extraSize(style, edges, 'padding')
                const border = extraSize(style, edges, 'border', 'Width')
                const margin = extraSize(style, edges, 'margin')
                const adjustment = (style.boxSizing === 'border-box' ? padding + border : 0)
                    - (kind === 'content' ? 0 : padding) - (kind === 'outer' || kind === 'margin' ? border : 0)
                    - (kind === 'margin' ? margin : 0)
                next = Math.max(0, readNumber(next) + adjustment)
            }
        }
        writeStyle(this, axis, next)
    })
}

const scrollingWindow = (element: SelectionValue): Window | null | undefined => isWindow(element) ? element : element?.nodeType === 9 ? element.defaultView : undefined
export function readScroll(element: SelectionValue, key: ScrollKey): number | undefined {
    const view = scrollingWindow(element)
    return view ? view[key === 'scrollTop' ? 'scrollY' : 'scrollX'] : element?.[key]
}

export function writeScroll(element: SelectionValue, key: ScrollKey, value: number) {
    const view = scrollingWindow(element)
    if (view) view.scrollTo(key === 'scrollLeft' ? value : view.scrollX, key === 'scrollTop' ? value : view.scrollY)
    else if (element && key in element) element[key] = value
}

function scroll(collection: RuntimeCollection, key: ScrollKey, value?: ScrollInput) {
    if (value === undefined) return readScroll(collection[0], key)
    return collection.each(function (index) {
        const next = typeof value === 'function' ? value.call(this, index, readScroll(this, key)!) : value
        writeScroll(this, key, next!)
    })
}

function offset(element: SelectionValue): Offset | undefined {
    if (!element?.getBoundingClientRect) return undefined
    if (!element.getClientRects().length) return { top: 0, left: 0 }
    const rect = element.getBoundingClientRect()
    const win = element.ownerDocument.defaultView
    return { top: rect.top + (win?.scrollY ?? 0), left: rect.left + (win?.scrollX ?? 0) }
}

function offsetParent(element: SelectionValue): Element | undefined {
    let parent = element?.offsetParent
    while (parent && computed(parent)?.position === 'static') parent = parent.offsetParent
    return parent ?? element?.ownerDocument?.documentElement
}

export const styleMethods = {
    css(name: string | string[] | Record<string, StyleInput>, value?: StyleInput) {
        if (Array.isArray(name)) return Object.fromEntries(name.map(key => [key, readStyle(this[0], key)]))
        if (typeof name === 'string' && value === undefined) return readStyle(this[0], name)
        const styles = typeof name === 'string' ? { [name]: value } : name
        return this.each(function (index) {
            for (const [key, style] of Object.entries(styles ?? {})) {
                writeStyle(this, key, typeof style === 'function' ? style.call(this, index, readStyle(this, key)) : style)
            }
        })
    },
    width(value?: SizeInput) { return size(this, 'width', 'content', value) },
    height(value?: SizeInput) { return size(this, 'height', 'content', value) },
    innerWidth(value?: SizeInput) { return size(this, 'width', 'inner', value) },
    innerHeight(value?: SizeInput) { return size(this, 'height', 'inner', value) },
    outerWidth(value?: SizeInput | boolean, includeMargin?: boolean) {
        return size(this, 'width', value === true || includeMargin ? 'margin' : 'outer', typeof value === 'boolean' ? undefined : value)
    },
    outerHeight(value?: SizeInput | boolean, includeMargin?: boolean) {
        return size(this, 'height', value === true || includeMargin ? 'margin' : 'outer', typeof value === 'boolean' ? undefined : value)
    },
    widths() { return this.toArray().reduce((total, item) => total + (readSize(item, 'width', 'margin') ?? 0), 0) },
    heights() { return this.toArray().reduce((total, item) => total + (readSize(item, 'height', 'margin') ?? 0), 0) },
    scrollLeft(value?: ScrollInput) { return scroll(this, 'scrollLeft', value) },
    scrollTop(value?: ScrollInput) { return scroll(this, 'scrollTop', value) },
    scrollWidth() { return this[0]?.scrollWidth },
    scrollHeight() { return this[0]?.scrollHeight },
    offsetWidth() { return this[0]?.offsetWidth },
    offsetHeight() { return this[0]?.offsetHeight },
    offsetTop() { return this[0]?.offsetTop },
    offsetLeft() { return this[0]?.offsetLeft },
    offset(value?: Setter<SelectionValue, Partial<Offset>>) {
        if (value === undefined) return offset(this[0])
        return this.each(function (index) {
            const previous = offset(this)
            if (!previous) return
            const next = typeof value === 'function' ? value.call(this, index, previous) : value
            if (!next) return
            if (readStyle(this, 'position') === 'static') writeStyle(this, 'position', 'relative')
            for (const key of ['top', 'left'] as const) {
                if (next[key] != null) writeStyle(this, key, readNumber(readStyle(this, key)) + next[key] - previous[key])
            }
        })
    },
    position() {
        const element = this[0]
        if (!isElement(element)) return undefined
        const style = computed(element)
        if (style?.position === 'fixed') {
            const { top, left } = element.getBoundingClientRect()
            return { top: top - readNumber(style.marginTop), left: left - readNumber(style.marginLeft) }
        }
        const current = offset(element)!
        const parent = offsetParent(element)
        const origin = parent?.tagName === 'HTML' ? { top: 0, left: 0 } : offset(parent)
        const parentStyle = parent?.tagName === 'HTML' ? undefined : computed(parent)
        return {
            top: current.top - (origin?.top ?? 0) - readNumber(parentStyle?.borderTopWidth) - readNumber(style?.marginTop),
            left: current.left - (origin?.left ?? 0) - readNumber(parentStyle?.borderLeftWidth) - readNumber(style?.marginLeft),
        }
    },
    offsetParent() { return this.map(function () { return offsetParent(this) }) },
} satisfies ThisType<RuntimeCollection>
