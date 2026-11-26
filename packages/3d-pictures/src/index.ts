import { observe } from '@sugars/simple-mvvm/observer'
import type { Listener } from '@sugars/simple-mvvm/observer'

export interface PictureFolder {
    imagePath: string
    totalImages?: number
    defaultImageNumber?: number
    imageExtension?: string
}

export type PictureSource = readonly string[] | PictureFolder | string

// TangramJS src/see/Photos/{ThreeDimensionalEyes,Photos}.js
export class Pictures3D {
    readonly Element: HTMLElement
    readonly ready: Promise<void>
    #images: string[] = []
    #active = { cur: 0 }
    #listener: Listener<{ cur: number }, 'cur'> | undefined
    #events = new AbortController()
    #pointer?: number
    #preload?: Promise<void>
    #loadingArea?: HTMLElement
    #owned: HTMLElement[] = []
    #hidden: [HTMLElement, string][] = []
    #initialStyle: { backgroundImage: string; position: string; cursor: string; touchAction: string }
    start = 0

    constructor(stage: HTMLElement | string, source?: PictureSource) {
        const element = typeof stage === 'string' ? document.getElementById(stage) : stage
        if (!element) throw new TypeError('Pictures3D needs a stage element')
        this.Element = element
        const { backgroundImage, position, cursor, touchAction } = element.style
        this.#initialStyle = { backgroundImage, position, cursor, touchAction }
        element.style.cursor = 'default'
        this.#listener = observe(this.#active).on('write', 'cur', () => this.play())

        if (source === undefined) {
            this.#images = Array.from(element.querySelectorAll<HTMLImageElement>('img.ib-3deyes-item'), image => {
                this.#hidden.push([image, image.style.display])
                image.style.display = 'none'
                return image.src
            })
            this.play().bind()
            this.ready = Promise.resolve()
        } else {
            this.#loadBox()
            if (typeof source === 'string') {
                this.ready = this.#loadJson(source)
            } else {
                if ('imagePath' in source) {
                    const { imagePath, totalImages = 36, imageExtension = 'png', defaultImageNumber = 0 } = source
                    this.#images = Array.from({ length: totalImages }, (_, i) => imagePath + (i + 1) + '.' + imageExtension)
                    this.#active.cur = this.#normalize(defaultImageNumber)
                } else {
                    this.#images = [...source]
                }
                this.play()
                if (!this.length && this.#loadingArea) this.#loadingArea.hidden = true
                this.ready = Promise.resolve()
            }
            this.#loadingArea?.addEventListener('click', () => { void this.loading().catch(() => {}) }, { signal: this.#events.signal, once: true })
        }
    }

    get images(): readonly string[] { return this.#images }
    get length(): number { return this.#images.length }
    get cur(): number { return this.#active.cur }
    set cur(index: number) { this.#active.cur = this.#normalize(index) }

    #normalize(index: number): number {
        if (!this.length || !Number.isFinite(index)) return 0
        return (Math.trunc(index) % this.length + this.length) % this.length
    }

    async #loadJson(url: string): Promise<void> {
        try {
            const response = await fetch(url, { signal: this.#events.signal })
            if (!response.ok) throw new Error('Unable to load picture manifest with status ' + response.status)
            const manifest: unknown = await response.json()
            if (!Array.isArray(manifest) || !manifest.every(item => typeof item === 'string')) {
                throw new TypeError('The picture manifest must be an array of URL strings')
            }
            if (this.#events.signal.aborted) return
            this.#images = manifest.map(src => new URL(src, response.url).href)
            this.play()
            if (!this.length && this.#loadingArea) this.#loadingArea.hidden = true
        } catch (error) {
            if (this.#events.signal.aborted) return
            if (this.#loadingArea) this.#loadingArea.hidden = true
            throw error
        }
    }

    #loadBox(): void {
        const element = this.Element
        const existing = element.querySelector<HTMLElement>('.ib-3deyes-loading')
        const box = existing ?? element.ownerDocument.createElement('div')
        if (existing) {
            const style = box.style.cssText
            const hidden = box.hidden
            this.#events.signal.addEventListener('abort', () => {
                box.style.cssText = style
                box.hidden = hidden
            }, { once: true })
        } else {
            box.className = 'ib-3deyes-loading'
            this.#owned.push(box)
            element.append(box)
        }
        Object.assign(box.style, { position: 'absolute', width: '100%', height: '100%', left: '0', bottom: '0' })
        element.style.position = 'relative'
        this.#loadingArea = box
    }

    loading(): Promise<void> {
        return this.#preload ??= this.#loadFrames()
    }

    async #loadFrames(): Promise<void> {
        await this.ready
        const box = this.#loadingArea
        const signal = this.#events.signal
        if (!box || !this.length || signal.aborted) return
        Object.assign(box.style, { width: '0', height: '5px', backgroundColor: '#000', opacity: '.8' })
        let complete = 0
        await Promise.all(this.#images.map(src => new Promise<void>(resolve => {
            const image = this.Element.ownerDocument.createElement('img')
            const done = () => {
                signal.removeEventListener('abort', done)
                image.onload = image.onerror = null
                complete++
                if (!signal.aborted) box.style.width = complete / this.length * 100 + '%'
                resolve()
            }
            image.className = 'ib-3deyes-item'
            image.hidden = true
            image.onload = image.onerror = done
            signal.addEventListener('abort', done, { once: true })
            image.src = src
            this.#owned.push(image)
            this.Element.append(image)
        })))
        if (signal.aborted) return
        box.hidden = true
        this.bind()
    }

    #bound = false

    bind(): this {
        const signal = this.#events.signal
        if (this.#bound || signal.aborted || !this.length) return this
        this.#bound = true
        const element = this.Element
        element.style.touchAction = 'none'
        element.addEventListener('pointerdown', event => {
            if (this.#pointer !== undefined || event.button !== 0) return
            this.#pointer = event.pointerId
            this.start = event.clientX
        }, { signal })
        const doc = element.ownerDocument
        doc.addEventListener('pointermove', event => {
            if (this.#pointer === event.pointerId) this.change(event.clientX)
        }, { signal })
        const release = (event: PointerEvent) => {
            if (this.#pointer === event.pointerId) this.#pointer = undefined
        }
        doc.addEventListener('pointerup', release, { signal })
        doc.addEventListener('pointercancel', release, { signal })
        doc.defaultView?.addEventListener('blur', () => { this.#pointer = undefined }, { signal })
        element.addEventListener('dragstart', event => event.preventDefault(), { signal })
        return this
    }

    change(end: number): this {
        const distance = end - this.start
        if (!Number.isFinite(distance)) return this
        this.start = end
        const steps = Math.max(0, Math.ceil(Math.abs(distance) / 25) - 1)
        if (steps) this.cur += Math.sign(distance) * steps
        return this
    }

    play(): this {
        const frame = this.#images[this.cur]
        if (frame !== undefined && !this.#events.signal.aborted) {
            this.Element.style.backgroundImage = 'url(' + JSON.stringify(frame) + ')'
            this.Element.style.position = 'relative'
        }
        return this
    }

    destroy(): void {
        if (this.#events.signal.aborted) return
        this.#events.abort()
        this.#listener?.disconnect()
        for (const node of this.#owned) node.remove()
        for (const [node, display] of this.#hidden) node.style.display = display
        Object.assign(this.Element.style, this.#initialStyle)
    }
}

export { Pictures3D as ThreeDimensionalEyes }
