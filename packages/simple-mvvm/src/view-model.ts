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
    render(this: CustomRenderOptions<T>): void
}

export interface VirtualRenderOptions<T extends object> extends RenderOptions<T> {
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
    new <T extends object>(options: VirtualRenderOptions<T>, useVElement: true): ViewModelState<T>
    new <T extends object>(options: VirtualRenderOptions<T> & { useVElement: true }): ViewModelState<T>
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

    #onChange = (event: Event): void => {
        const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
        if (target?.matches?.('input, select, textarea')) Reflect.set(this, 'input', target.value)
    }

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

export const ViewModel = ViewModelImplementation as unknown as ViewModelConstructor
