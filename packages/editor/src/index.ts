/*! Ported from TangramJS form/SimpleEditor/SimpleEditor.js. */

/**
 * `@sugars/editor` 的公开入口。
 *
 * 原生编辑器管理编辑区、关联表单字段、命令和选区，负责 HTML 清理、变更通知及释放。
 * `SimpleEditor` 和 `createEditor` 装配实例，`EditorRange`、`EditorSelection` 为编辑操作提供所属文档范围。
 */

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
    /** 首个编辑区的初始 HTML，优先于关联表单字段和现有 DOM。 */
    html?: string
    /** 是否禁用编辑操作，缺省为 false。 */
    readOnly?: boolean
    /** 区域 HTML 与上次记录不同时收到变更。 */
    onChange?: (change: EditorChange) => void
    /** 可通过命令按索引选择的 HTML 片段。 */
    fragments?: readonly { name: string; code: string }[]
    /** 表情包名到表情名和图片地址的映射。 */
    emoticons?: Record<string, Record<string, string>>
    /** 用文本格式或图片插入表情，未指定时按图片处理。 */
    emoticonsType?: 'code' | 'image'
    /** 文本表情模板，其中 CODE 会按命令规则替换。 */
    emoticonsCodeFormat?: string
    /** 旧命名的附件链接标题缺省值，在插入文件未传名称时读取。 */
    aaa?: string
    uploader?: {
        /** 上传文件的字节数上限，默认 20 MiB。 */
        maxsize?: number
        /** 由上传入口检查的文件后缀白名单。 */
        sfixs?: readonly string[]
        /** 调用方实现的上传函数，完成时按返回 URL 插入文件或图片。 */
        transfer: (files: File[], complete: (urls: string[], failed?: number) => void) => void
    }
}

/** 区域 HTML 实际发生变化时发出的通知，index 对应实例内编辑区顺序。 */
export interface EditorChange {
    html: string
    index: number
    /** 区分原生输入、命令和通过实例写入内容。 */
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

    /**
     * @param element - 编辑容器或单个原生文本字段。
     * @param options - 初始 HTML、只读状态、资源与变更入口。
     * @param textareas - 显式指定一组关联字段。省略时从容器查找。
     * @throws 编辑容器不在带窗口的文档内，或 HTML 清理器不可用。
     */
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
        // 有原生字段时为每个字段创建独立编辑面，提交时仍由原字段持有表单值。
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

    /**
     * 聚焦指定编辑区并建立选区。
     * @param index - 编辑区的从零索引，默认首个。
     */
    focus(index = 0): void {
        if (!this.controller.signal.aborted) this.selection.createEmptyRange(index)
    }

    /**
     * 执行一个内置命令并维持链式调用。
     * @param command - 内置命令名。
     * @param args - 与命令对应的参数元组。
     * @returns 当前编辑器，执行结果可通过 execute() 获取。
     */
    execCommand<K extends EditorCommand>(command: K, ...args: undefined extends CommandValues[K]
        ? [value?: CommandValues[K]] : [value: CommandValues[K]]): this
    /** 从当前实例解析命令，执行后把内容同步到对应表单字段。 */
    execCommand(command: string, value?: unknown): this {
        this.runCommand(command, value)
        return this
    }

    /**
     * @param command - 内置命令名。
     * @param value - 当前命令的参数。
     * @returns 命令报告已应用时为 true，门控拒绝或命令未知时为 false。
     */
    execute<K extends EditorCommand>(command: K, value?: CommandValues[K]): boolean {
        return this.runCommand(command, value)
    }

    /**
     * 在当前实例登记自定义命令。
     * @param name - 不分大小写的命令名。
     * @param handler - 接收编辑器和相应参数的实现。
     * @returns 注销这次登记的函数。
     * @throws 命令名已被内置或自定义命令使用。
     */
    registerCommand<T>(name: string, handler: CommandHandler<T>): () => void {
        const key = name.toLowerCase()
        if (this.commandHandlers.has(key) || Object.hasOwn(commands, key)) throw new Error(`Command already registered: ${key}`)
        const entry = handler as CommandHandler<unknown>
        this.commandHandlers.set(key, entry)
        return () => {
            if (this.commandHandlers.get(key) === entry) this.commandHandlers.delete(key)
        }
    }

    /**
     * @param name - 要执行的自定义命令。
     * @param value - 交给处理器的参数。
     * @returns 当前编辑器。
     */
    execCustomCommand(name: string, value?: unknown): this {
        this.runCommand(name, value)
        return this
    }

    /**
     * 返回对应编辑区的 HTML。省略索引时读取首个编辑区。
     *
     * @param index - 从零计数的编辑区索引。
     * @returns 区域的 HTML，找不到该区域时返回空字符串。
     */
    getValue(index = 0): string {
        this.syncFields()
        return this.richareas[index]?.innerHTML ?? ''
    }

    /**
     * 把 HTML 清理后设到对应编辑区，并按设置来源通知实际变动。
     *
     * @param value - 清理后才会写入的 HTML。
     * @param index - 要更新的编辑区索引，默认首个。
     * @returns 当前编辑器。
     */
    setValue(value: string, index = 0): this {
        const area = this.richareas[index]
        if (!area || this.controller.signal.aborted) return this
        this.replaceHTML(area, value)
        if (this.selection.range?.isBelongTo(area)) this.selection.range = undefined
        return this.onchange('api')
    }

    /**
     * 将各编辑区还原为实例初始化后的内容。
     * @returns 当前编辑器。
     */
    resetValue(): this {
        if (this.controller.signal.aborted) return this
        this.initial.forEach((html, index) => {
            const area = this.richareas[index]
            if (area) this.replaceHTML(area, html)
        })
        this.selection.range = undefined
        return this.onchange('api')
    }

    /**
     * @param index - 编辑区索引。
     * @returns 该区域的纯文本，无此区域时为空字符串。
     */
    getContentTxt(index = 0): string { return this.richareas[index]?.textContent ?? '' }
    /**
     * @param _index - 保留的旧参数。
     * @returns 当前保存选区内的文本。
     */
    getText(_index = 0): string { return this.selection.getSelectionText() }
    /**
     * @param form - 需要检查是否包含编辑区的元素。
     * @returns 至少一个编辑区位于该元素内部时为 true。
     */
    inForm(form: Element): boolean { return this.richareas.some(area => form.contains(area)) }
    /** @param toStart - true 折叠到范围起始端，默认折叠到末端。 */
    collapse(toStart = false): void {
        if (!this.controller.signal.aborted) this.selection.collapseRange(toStart)
    }

    /**
     * @param value - 需要清理后插入的 HTML。
     * @returns 当前编辑器。
     */
    insertHTM(value: string): this { return this.execCommand('insert', value) }
    /**
     * @param value - 链接地址和可选打开方式，显示内容来自当前选区。
     * @returns 当前编辑器。
     */
    createLink(value: CommandValues['createlink']): this { return this.execCommand('createlink', value) }
    /**
     * @param value - 单张或多张图片的命令参数。
     * @returns 当前编辑器。
     */
    insertImage(value: CommandValues['insertimage']): this { return this.execCommand('insertimage', value) }
    /**
     * @param url - 文件链接。
     * @param name - 可选显示名称，缺省可走附件标题配置。
     * @returns 当前编辑器。
     */
    insertFile(url: string, name?: string): this { return this.execCommand('insertfile', [name, url]) }
    /**
     * @param value - 视频地址与可选的尺寸及播放选项。
     * @returns 当前编辑器。
     */
    insertVideo(value: VideoOptions): this { return this.execCommand('insertvideo', value) }
    /**
     * @param value - 表格行列数和可选表头。
     * @returns 当前编辑器。
     */
    insertTable(value: TableOptions): this { return this.execCommand('inserttable', value) }
    /**
     * @param value - 表情包名和表情名。
     * @returns 当前编辑器。
     */
    insertEmoticon(value: CommandValues['insertemoticon']): this { return this.execCommand('insertemoticon', value) }

    /**
     * 把文件交给调用方提供的上传入口。异步结束后使用当初保存的选区插入结果。
     *
     * @param files - 待验证和交给配置上传函数的文件。
     * @param kind - 决定返回链接按图片或附件插入。
     * @returns 本次文件是否进入配置的上传流程。
     */
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

    /** 先同步表单字段，再对比每个区域的 HTML，避免同值重复触发变更。 */
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

    /** 同步最终值并释放监听、命令和实例索引，随后按逆序恢复挂载时接管的内容和属性。 */
    destroy(): void {
        if (this.controller.signal.aborted) return
        this.syncFields()
        this.controller.abort()
        editors.delete(this.uid)
        this.selection.range = undefined
        this.commandHandlers.clear()
        for (const cleanup of this.cleanup.reverse()) cleanup()
    }

    /**
     * 各插入命令准备好内容后，经此入口清理 HTML 并写入选区。
     *
     * @param html - 将交给实例清理和写入的内容。
     * @returns 内容已写入有效选区时为 true。
     */
    insertHTML(html: string): boolean {
        if (this.readOnly || typeof html !== 'string' || this.controller.signal.aborted) return false
        const clean = this.sanitize(html)
        return clean !== '' && (this.selection.getRange()?.insertHTML(clean) ?? false)
    }

    private runCommand(command: string, value: unknown): boolean {
        // 组合输入尚未结束时浏览器拥有编辑缓冲。同步命令也禁止重入，以免破坏该实例的选区。
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

/**
 * @param element - 编辑容器或表单字段。
 * @param options - 实例配置。
 * @param textareas - 可选的关联字段。
 * @returns 新建并绑定到元素的编辑器。
 * @throws 容器所属文档或 HTML 清理器不可用。
 */
export function createEditor(element: HTMLElement, options?: EditorOptions, textareas?: Field | ArrayLike<Field>): SimpleEditor {
    return new SimpleEditor(element, options, textareas)
}

/**
 * @param selector - 用于定位各独立编辑容器的 CSS 选择器。
 * @param options - 传给每个实例的配置。
 * @param root - 指定查找范围，默认当前文档。
 * @returns 与命中节点顺序一致的实例数组。
 */
export function createEditors(selector: string, options?: EditorOptions, root: ParentNode = document): SimpleEditor[] {
    return Array.from(root.querySelectorAll<HTMLElement>(selector), element => createEditor(element, options))
}

export const careatEditor = createEditor
export const careatEditors = createEditors
export const getEditorById = (id: string): SimpleEditor | undefined => editors.get(id)
