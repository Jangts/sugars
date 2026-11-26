/*! Ported from TangramJS form/SimpleEditor/SimpleEditor.js. */
import DOMPurify from 'dompurify'
import { commands } from './commands.js'
import { EditorSelection } from './Selection.js'
import type { CommandHandler, CommandValues, EditorCommand, TableOptions, VideoOptions } from './commands.js'

export { defaultEmoticons } from './emoticons.js'
export { EditorRange } from './Range.js'
export { EditorSelection } from './Selection.js'
export type { CommandHandler, CommandValues, EditorCommand, TableOptions, VideoOptions } from './commands.js'

type Field = HTMLTextAreaElement | HTMLInputElement

export interface EditorOptions {
    html?: string
    readOnly?: boolean
    onChange?: (change: EditorChange) => void
    fragments?: readonly { name: string; code: string }[]
    emoticons?: Record<string, Record<string, string>>
    emoticonsType?: 'code' | 'image'
    emoticonsCodeFormat?: string
    aaa?: string
    uploader?: {
        maxsize?: number
        sfixs?: readonly string[]
        transfer: (files: File[], complete: (urls: string[], failed?: number) => void) => void
    }
}

export interface EditorChange {
    html: string
    index: number
    source: 'input' | 'command' | 'api'
}

let nextId = 0
const editors = new Map<string, SimpleEditor>()
const isField = (element: HTMLElement): element is Field =>
    element.localName === 'textarea' || element.localName === 'input'

export class SimpleEditor {
    readonly uid = String(++nextId)
    readonly element: HTMLElement
    readonly options: EditorOptions
    readonly textareas: readonly Field[]
    readonly richareas: readonly HTMLElement[]
    readonly selection: EditorSelection

    private readonly controller: AbortController
    private readonly purifier: ReturnType<typeof DOMPurify>
    private readonly cleanup: Array<() => void> = []
    private readonly initial: string[]
    private readonly current: string[]
    private readonly commandHandlers = new Map<string, CommandHandler<unknown>>()
    private composing = false
    private executing = false
    private readonlyState = false

    constructor(element: HTMLElement, options: EditorOptions = {}, textareas?: Field | ArrayLike<Field>) {
        this.element = element
        this.options = options
        const document = element.ownerDocument
        const window = document.defaultView
        if (!window) throw new Error('The editor needs a document attached to a window')
        this.controller = new window.AbortController()
        this.purifier = DOMPurify(window)
        if (!this.purifier.isSupported) throw new Error('HTML sanitization is unavailable')

        this.textareas = isField(element) ? [element] : textareas
            ? ('length' in textareas ? Array.from(textareas) : [textareas])
            : Array.from(element.querySelectorAll<Field>('textarea, input:not([type]), input[type="text"]'))
        this.richareas = this.textareas.length ? this.textareas.map(field => {
            const surface = document.createElement('div')
            const hidden = field.hidden
            field.after(surface)
            field.hidden = true
            this.cleanup.push(() => {
                field.hidden = hidden
                surface.remove()
            })
            return surface
        }) : [element]

        this.richareas.forEach((area, index) => {
            const previous = area.getAttribute('contenteditable')
            this.cleanup.push(() => {
                if (previous === null) area.removeAttribute('contenteditable')
                else area.setAttribute('contenteditable', previous)
            })
            const original = (index === 0 ? options.html : undefined) ?? this.textareas[index]?.value ?? area.innerHTML
            this.replaceHTML(area, original)
        })
        this.initial = this.richareas.map(area => area.innerHTML)
        this.current = [...this.initial]
        this.syncFields()
        this.selection = new EditorSelection(this.richareas)
        this.readOnly = options.readOnly ?? false
        this.listen(document)
        editors.set(this.uid, this)
    }

    get html(): string { return this.getValue() }
    set html(value: string) { this.setValue(value) }
    get readOnly(): boolean { return this.readonlyState }
    set readOnly(value: boolean) {
        if (this.controller.signal.aborted) return
        this.readonlyState = value
        for (const area of this.richareas) area.contentEditable = String(!value)
    }

    focus(index = 0): void {
        if (!this.controller.signal.aborted) this.selection.createEmptyRange(index)
    }

    execCommand<K extends EditorCommand>(command: K, ...args: undefined extends CommandValues[K]
        ? [value?: CommandValues[K]] : [value: CommandValues[K]]): this
    execCommand(command: string, value?: unknown): this {
        this.runCommand(command, value)
        return this
    }

    execute<K extends EditorCommand>(command: K, value?: CommandValues[K]): boolean {
        return this.runCommand(command, value)
    }

    registerCommand<T>(name: string, handler: CommandHandler<T>): () => void {
        const key = name.toLowerCase()
        if (this.commandHandlers.has(key) || Object.hasOwn(commands, key)) throw new Error(`Command already registered: ${key}`)
        const entry = handler as CommandHandler<unknown>
        this.commandHandlers.set(key, entry)
        return () => {
            if (this.commandHandlers.get(key) === entry) this.commandHandlers.delete(key)
        }
    }

    execCustomCommand(name: string, value?: unknown): this {
        this.runCommand(name, value)
        return this
    }

    getValue(index = 0): string {
        this.syncFields()
        return this.richareas[index]?.innerHTML ?? ''
    }

    setValue(value: string, index = 0): this {
        const area = this.richareas[index]
        if (!area || this.controller.signal.aborted) return this
        this.replaceHTML(area, value)
        if (this.selection.range?.isBelongTo(area)) this.selection.range = undefined
        return this.onchange('api')
    }

    resetValue(): this {
        if (this.controller.signal.aborted) return this
        this.initial.forEach((html, index) => {
            const area = this.richareas[index]
            if (area) this.replaceHTML(area, html)
        })
        this.selection.range = undefined
        return this.onchange('api')
    }

    getContentTxt(index = 0): string { return this.richareas[index]?.textContent ?? '' }
    getText(_index = 0): string { return this.selection.getSelectionText() }
    inForm(form: Element): boolean { return this.richareas.some(area => form.contains(area)) }
    collapse(toStart = false): void {
        if (!this.controller.signal.aborted) this.selection.collapseRange(toStart)
    }

    insertHTM(value: string): this { return this.execCommand('insert', value) }
    createLink(value: CommandValues['createlink']): this { return this.execCommand('createlink', value) }
    insertImage(value: CommandValues['insertimage']): this { return this.execCommand('insertimage', value) }
    insertFile(url: string, name?: string): this { return this.execCommand('insertfile', [name, url]) }
    insertVideo(value: VideoOptions): this { return this.execCommand('insertvideo', value) }
    insertTable(value: TableOptions): this { return this.execCommand('inserttable', value) }
    insertEmoticon(value: CommandValues['insertemoticon']): this { return this.execCommand('insertemoticon', value) }

    uploadFiles(files: readonly File[], kind: 'image' | 'file'): boolean {
        const uploader = this.options.uploader
        if (!uploader || this.readOnly || this.controller.signal.aborted) return false
        const accepted = files.filter(file => file.size <= (uploader.maxsize ?? 20 * 1024 * 1024) &&
            (!uploader.sfixs?.length || uploader.sfixs.some(suffix =>
                file.name.toLowerCase().endsWith('.' + suffix.replace(/^\./, '').toLowerCase()))))
        if (!accepted.length) return false
        const range = this.selection.saveRange()
        const snapshot = this.richareas.map(area => area.innerHTML)
        uploader.transfer(accepted, urls => {
            if (this.controller.signal.aborted || this.readOnly ||
                this.richareas.some((area, index) => area.innerHTML !== snapshot[index])) return
            if (range) {
                this.selection.saveRange(range)
                this.selection.restoreSelection()
            }
            if (kind === 'image') this.insertImage(urls)
            else urls.forEach((url, index) => this.insertFile(url, accepted[index]?.name))
        })
        return true
    }

    onchange(source: EditorChange['source'] = 'input'): this {
        if (this.controller.signal.aborted) return this
        this.syncFields()
        this.richareas.forEach((area, index) => {
            const html = area.innerHTML
            if (this.current[index] === html) return
            this.current[index] = html
            this.options.onChange?.({ html, index, source })
        })
        return this
    }

    destroy(): void {
        if (this.controller.signal.aborted) return
        this.syncFields()
        this.controller.abort()
        editors.delete(this.uid)
        this.selection.range = undefined
        this.commandHandlers.clear()
        for (const cleanup of this.cleanup.reverse()) cleanup()
    }

    /** Used by the content insertion commands after their editor-specific work. */
    insertHTML(html: string): boolean {
        if (this.readOnly || typeof html !== 'string' || this.controller.signal.aborted) return false
        const clean = this.sanitize(html)
        return clean !== '' && (this.selection.getRange()?.insertHTML(clean) ?? false)
    }

    private runCommand(command: string, value: unknown): boolean {
        if (this.readOnly || this.composing || this.executing || this.controller.signal.aborted) return false
        const key = command.toLowerCase()
        const handler = this.commandHandlers.get(key) ?? (Object.hasOwn(commands, key)
            ? commands[key as EditorCommand] as CommandHandler<unknown> : undefined)
        if (!handler) return false
        this.selection.saveRange()
        this.executing = true
        let applied: boolean
        try {
            applied = handler(this, value)
        } finally {
            this.executing = false
        }
        this.selection.saveRange()
        this.onchange('command')
        return applied
    }

    private listen(document: Document): void {
        const { signal } = this.controller
        document.addEventListener('selectionchange', () => this.selection.saveRange(), { signal })
        for (const area of this.richareas) {
            area.addEventListener('input', this.onInput, { signal })
            area.addEventListener('compositionstart', () => { this.composing = true }, { signal })
            area.addEventListener('compositionend', () => {
                this.composing = false
                this.onInput()
            }, { signal })
            area.addEventListener('paste', event => {
                if (event.defaultPrevented || this.readOnly || !event.clipboardData) return
                event.preventDefault()
                this.insertTransfer(event.clipboardData)
            }, { signal })
            area.addEventListener('drop', event => {
                if (event.defaultPrevented || this.readOnly || !event.dataTransfer) return
                event.preventDefault()
                const position = document.caretPositionFromPoint?.(event.clientX, event.clientY)
                const native = position ? document.createRange() : document.caretRangeFromPoint?.(event.clientX, event.clientY)
                if (position && native) {
                    native.setStart(position.offsetNode, position.offset)
                    native.collapse(true)
                }
                if (!native || !area.contains(native.startContainer)) return
                const selection = document.getSelection()
                selection?.removeAllRanges()
                selection?.addRange(native)
                this.insertTransfer(event.dataTransfer)
            }, { signal })
        }
        for (const form of new Set(this.textareas.map(field => field.form))) {
            form?.addEventListener('submit', () => this.syncFields(), { signal })
            form?.addEventListener('reset', event => queueMicrotask(() => {
                if (!event.defaultPrevented && !signal.aborted) this.resetValue()
            }), { signal })
        }
    }

    private insertTransfer(transfer: DataTransfer): void {
        const html = transfer.getData('text/html')
        const text = transfer.getData('text/plain')
        if (html && this.execute('insert', html)) return
        if (text) this.execute('inserttext', text)
    }

    private onInput = (): void => {
        this.selection.saveRange()
        if (!this.composing && !this.executing) this.onchange()
    }

    private syncFields(): void {
        if (this.controller.signal.aborted) return
        this.textareas.forEach((field, index) => {
            field.value = this.richareas[index]?.innerHTML ?? ''
        })
    }

    private sanitize(html: string): string {
        return this.purifier.sanitize(html, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option', 'template', 'dialog'],
            FORBID_ATTR: ['autofocus', 'contenteditable', 'srcset'],
        })
    }

    private replaceHTML(area: HTMLElement, html: string): void {
        const clean = this.sanitize(html)
        if (area.innerHTML !== clean) area.innerHTML = clean
    }
}

export { SimpleEditor as Editor }

export function createEditor(element: HTMLElement, options?: EditorOptions, textareas?: Field | ArrayLike<Field>): SimpleEditor {
    return new SimpleEditor(element, options, textareas)
}

export function createEditors(selector: string, options?: EditorOptions, root: ParentNode = document): SimpleEditor[] {
    return Array.from(root.querySelectorAll<HTMLElement>(selector), element => createEditor(element, options))
}

export const careatEditor = createEditor
export const careatEditors = createEditors
export const getEditorById = (id: string): SimpleEditor | undefined => editors.get(id)
