// TangramJS src/dom/Elements.js, data. Keep plugin state off DOM attributes.

/* 按对象保存插件数据，可延迟读取元素的 data 属性。复制和移除 DOM 时由调用方决定如何处理数据。 */

const data = new WeakMap<object, Record<string, unknown>>()
const readAttributes = new WeakSet<object>()
export const camelCase = (name: string) => name.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, char) => char.toUpperCase())
const attributeName = (key: string) => 'data-' + key.replace(/[A-Z]/g, char => '-' + char.toLowerCase())

function storeFor(target: unknown): Record<string, unknown> | undefined {
    if (target == null || typeof target !== 'object' && typeof target !== 'function') return undefined
    let store = data.get(target)
    if (!store) {
        store = Object.create(null)
        data.set(target, store!)
    }
    return store
}

function parse(value: string): unknown {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (String(+value) === value) return +value
    if (/^(?:\{[\s\S]*\}|\[[\s\S]*\])$/.test(value)) {
        try { return JSON.parse(value) } catch { /* 无法解析的 JSON 保留原始文本。 */ }
    }
    return value
}

export function getData(target: unknown, key?: string, attributes = false): unknown {
    const store = storeFor(target)
    if (!store) return undefined
    const element = target as Partial<Element>
    if (key !== undefined) {
        const name = camelCase(key)
        if (!Object.hasOwn(store, name) && attributes && element.getAttribute) {
            const value = element.getAttribute(attributeName(name))
            if (value !== null) store[name] = parse(value)
        }
        return store[name]
    }
    if (attributes && element.attributes && !readAttributes.has(element)) {
        for (const attr of element.attributes) {
            if (!attr.name.startsWith('data-')) continue
            const name = camelCase(attr.name.slice(5))
            if (!Object.hasOwn(store, name)) store[name] = parse(attr.value)
        }
        readAttributes.add(element)
    }
    return store
}

export function setData(target: unknown, key: string | Record<string, unknown>, value?: unknown): unknown {
    const store = storeFor(target)
    if (!store) return
    const entries: [string, unknown][] = typeof key === 'string' ? [[key, value]] : Object.entries(key)
    for (const [name, item] of entries) {
        if (item !== undefined) store[camelCase(name)] = item
    }
    return value
}

export function removeData(target: object, key?: string | readonly string[]) {
    if (key === undefined) {
        data.delete(target)
        return
    }
    const store = data.get(target)
    if (!store) return
    const name = key as string
    const names = Array.isArray(key) ? key : Object.hasOwn(store, camelCase(name)) ? [name] : name.match(/\S+/g) ?? []
    for (const name of names) delete store[camelCase(name)]
}

export function hasData(target: object) { return Object.keys(data.get(target) ?? {}).length > 0 }
export function copyData(source: object, target: object) {
    if (data.has(source)) setData(target, data.get(source)!)
}

import type { RuntimeCollection } from './runtime-types.js'

export const dataMethods = {
    data(key?: string | Record<string, unknown>, value?: unknown) {
        if (key === undefined) return getData(this[0], undefined, true)
        if (typeof key === 'string' && value === undefined) {
            return arguments.length === 1 ? getData(this[0], key, true) : this
        }
        return this.each(function () { setData(this, key, value) })
    },
    removeData(key?: string | string[]) { return this.each(function () { removeData(this, key) }) },
} satisfies ThisType<RuntimeCollection>
