/* 把可观察字段与自定义渲染或虚拟 DOM 渲染关联，持有挂载目标并管理更新与释放。 */

import { observe } from './observer.js'
import type { Listener, Observer } from './observer.js'
import { diff, patch } from './v-element.js'
import type { VElement } from './v-element.js'

interface RenderOptions<T extends object> {
    data: T
    useVElement?: boolean
    beforeRender?(): void
    afterRender?(): void
}

export interface CustomRenderOptions<T extends object> extends RenderOptions<T> {
    /** 由调用方直接操作视图。钩子以相同的选项对象为 this。 */
    render(this: CustomRenderOptions<T>): void
}

export interface VirtualRenderOptions<T extends object> extends RenderOptions<T> {
    /** 返回下一棵虚拟树，由实例比较并更新真实 DOM。this 能访问被代理的字段。 */
    render(this: ViewModelState<T>): VElement
}

export type ViewModelOptions<T extends object> = CustomRenderOptions<T> | VirtualRenderOptions<T>

export interface ViewModel<T extends object> {
    readonly id: string
    readonly options: ViewModelOptions<T>
    readonly data: T
    readonly observer: Observer<T>
    destroy(): void
}

export type ViewModelState<T extends object> = ViewModel<T> & Omit<T, keyof ViewModel<T> | '_observer'>

interface ViewModelConstructor {
    /**
     * @param options - 可观察的数据和返回虚拟节点的渲染器。
     * @param useVElement - true 选择虚拟 DOM 路径。
     * @returns 会在字段变更后重新渲染的 ViewModel。
     */
    new <T extends object>(options: VirtualRenderOptions<T>, useVElement: true): ViewModelState<T>
    new <T extends object>(options: VirtualRenderOptions<T> & { useVElement: true }): ViewModelState<T>
    /**
     * @param options - 可观察的数据和调用方自己的 DOM 渲染函数。
     * @param useVElement - false 选择自定义渲染。
     * @returns 已完成初次渲染的 ViewModel。
     */
    new <T extends object>(options: CustomRenderOptions<T>, useVElement: false): ViewModelState<T>
    new <T extends object>(options: CustomRenderOptions<T> & { useVElement?: false }): ViewModelState<T>
    new <T extends object>(options: ViewModelOptions<T>, useVElement?: boolean): ViewModelState<T>
}

let nextId = 0

// TangramJS src/dom/ViewModel.js
class ViewModelImplementation<T extends object> implements ViewModel<T> {
    readonly id = String(++nextId)
    readonly data: T
    readonly observer: Observer<T>
    #listeners: Listener<T>[] = []
    #root?: HTMLElement
    #tree?: VElement
    #destroyed = false

    constructor(readonly options: ViewModelOptions<T>, useVElement = options.useVElement) {
        this.data = options.data
        this.observer = observe(this.data)
        const update = useVElement
            ? () => this.#updateByVElement(options as VirtualRenderOptions<T>)
            : () => this.#updateByCustomRenderer(options as CustomRenderOptions<T>)

        for (const key of Object.keys(this.data) as Extract<keyof T, string | number>[]) {
            if (key !== '_observer' && !Object.hasOwn(this, key) && key !== 'destroy') {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => this.data[key],
                    set: (value: T[typeof key]) => { this.data[key] = value },
                })
            }
            const listener = this.observer.listen(key, () => {
                // 旧 ViewModel 同步响应字段写入。销毁后保留原数据对象，但不再调度渲染。
                if (!this.#destroyed) update()
            })
            if (listener) this.#listeners.push(listener)
        }

        try {
            update()
        } catch (error) {
            this.destroy()
            throw error
        }
    }

    #updateByCustomRenderer(options: CustomRenderOptions<T>): void {
        options.beforeRender?.()
        options.render()
        options.afterRender?.()
    }

    /** 保留上一棵虚拟树做差量更新。根节点替换时表单 change 监听随真实根节点转移。 */
    #updateByVElement(options: VirtualRenderOptions<T>): void {
        const tree = options.render.call(this as unknown as ViewModelState<T>)
        if (this.#destroyed) return
        if (this.#tree && this.#root) {
            const root = patch(this.#root, diff(this.#tree, tree)) as HTMLElement
            if (root !== this.#root) {
                this.#root.removeEventListener('change', this.#onChange)
                root.addEventListener('change', this.#onChange)
                this.#root = root
            }
        } else {
            const root = tree.render()
            root.addEventListener('change', this.#onChange)
            this.#root = root
            document.body.appendChild(root)
        }
        this.#tree = tree
    }

    /** 保留旧表单回写入口，把控件当前值交给视图模型的 input 字段。 */
    #onChange = (event: Event): void => {
        const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
        if (target?.matches?.('input, select, textarea')) Reflect.set(this, 'input', target.value)
    }

    /** 解除字段订阅，并移除由虚拟渲染路径挂载的根节点。 */
    destroy(): void {
        this.#destroyed = true
        for (const listener of this.#listeners) listener.disconnect()
        this.#listeners = []
        this.#root?.removeEventListener('change', this.#onChange)
        this.#root?.remove()
        this.#root = undefined
        this.#tree = undefined
    }
}

/** 根据选项选择自定义渲染或虚拟 DOM，初次渲染在构造期间同步完成。 */
export const ViewModel = ViewModelImplementation as unknown as ViewModelConstructor
