/*! Adapted from TangramJS form/SimpleEditor/commands. */

/* 集中登记编辑命令和值类型，具体插入操作负责构造和校验本命令使用的内容。 */

import { defaultEmoticons } from './emoticons.js'
import type { SimpleEditor } from './index.js'

const native = [
    'bold', 'italic', 'insertorderedlist', 'insertunorderedlist', 'justifycenter',
    'justifyfull', 'justifyleft', 'justifyright', 'removeformat', 'strikethrough',
    'underline', 'unlink', 'undo', 'redo',
] as const
const fonts = ['fontsize', 'forecolor', 'backcolor'] as const
const headers = ['blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

export interface TableOptions {
    rows?: string | number
    columns?: string | number
    width?: string | number | null
    unit?: '' | '%'
}

export interface VideoOptions {
    url?: string
    code?: string
    type?: string
    width?: string | number
    height?: string | number
}

type EmptyCommand = typeof native[number] | typeof headers[number]
type StringCommand = typeof fonts[number] | 'insert' | 'inserttext' | 'header'

export type CommandValues = Record<EmptyCommand, undefined> & Record<StringCommand, string> & {
    createlink: { url: string; isNew?: boolean }
    insertimage: string | readonly string[]
    insertfile: readonly [text: string | undefined, url: string]
    insertvideo: VideoOptions
    inserttable: TableOptions
    insertemoticon: { pack: string; name: string }
    insertfragments: number | string
}

export type EditorCommand = keyof CommandValues
export type CommandHandler<T> = (editor: SimpleEditor, value: T) => boolean

const edit = (editor: SimpleEditor, name: string, value?: string) =>
    editor.selection.getRange()?.execCommand(name, value) ?? false

function safeURL(element: HTMLElement, value: string, allowImage = false): string | undefined {
    const url = value.trim()
    if (!url) return
    if (allowImage && /^data:image\/(?:png|gif|jpe?g|webp|avif);base64,/i.test(url)) return url
    try {
        if (['http:', 'https:'].includes(new URL(url, element.baseURI).protocol)) return url
    } catch {
        return
    }
}

const dimensions = (value?: number | string | null) => Math.max(0, Number.parseInt(String(value), 10) || 0)

function insertTable(editor: SimpleEditor, value: TableOptions): boolean {
    if (!value) return false
    const rows = dimensions(value.rows) || 1
    const columns = dimensions(value.columns) || 1
    if (rows * columns > 1000) return false
    const table = editor.element.ownerDocument.createElement('table')
    const width = dimensions(value.width)
    if (width) table.setAttribute('width', String(width) + (value.unit === '%' ? '%' : ''))
    table.setAttribute('data-se-temp', editor.uid)
    const body = table.createTBody()
    for (let i = 0; i < rows; i++) {
        const row = body.insertRow()
        for (let column = 0; column < columns; column++) row.insertCell().textContent = '\u00a0'
    }
    if (!editor.insertHTML(table.outerHTML)) return false
    const inserted = editor.richareas.map(area => area.querySelector(`table[data-se-temp="${editor.uid}"]`)).find(Boolean)
    inserted?.removeAttribute('data-se-temp')
    const cell = inserted?.querySelector('td')
    if (cell) editor.selection.createRangeByElem(cell, true, true)
    return true
}

function insertLink(editor: SimpleEditor, url: string, text?: string, isNew = false, attachment = false): boolean {
    const href = safeURL(editor.element, url)
    if (!href) return false
    const range = editor.selection.getRange()
    if (!range) return false
    const anchor = editor.element.ownerDocument.createElement('a')
    anchor.setAttribute('href', href)
    if (isNew) {
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
    }
    if (attachment) anchor.className = 'se-attachment'
    if (text !== undefined || range.collapsed) anchor.textContent = text ?? href
    else anchor.innerHTML = range.html
    return editor.insertHTML(anchor.outerHTML)
}

function insertImages(editor: SimpleEditor, value: CommandValues['insertimage']): boolean {
    const document = editor.element.ownerDocument
    const container = document.createElement('div')
    for (const url of typeof value === 'string' ? [value] : value) {
        const src = safeURL(editor.element, url, true)
        if (!src) continue
        const image = document.createElement('img')
        image.setAttribute('src', src)
        image.alt = ''
        container.append(image)
    }
    return editor.insertHTML(container.innerHTML)
}

function insertVideo(editor: SimpleEditor, value: VideoOptions): boolean {
    if (!value) return false
    if (value.code) return editor.insertHTML(value.code)
    if (!value.url || value.type === 'swf') return false
    const src = safeURL(editor.element, value.url)
    if (!src) return false
    const video = editor.element.ownerDocument.createElement('video')
    video.setAttribute('src', src)
    video.controls = true
    if (value.width) video.width = dimensions(value.width)
    if (value.height) video.height = dimensions(value.height)
    video.textContent = '您的浏览器不支持 video 标签。'
    return editor.insertHTML(video.outerHTML)
}

function insertEmoticon(editor: SimpleEditor, value: CommandValues['insertemoticon']): boolean {
    if (!value?.pack || !value.name) return false
    const pack = editor.options.emoticons?.[value.pack] ?? (value.pack === 'default' ? defaultEmoticons : undefined)
    const src = pack && Object.hasOwn(pack, value.name) ? pack[value.name] : undefined
    if (!src) return false
    if (editor.options.emoticonsType === 'code') {
        const format = editor.options.emoticonsCodeFormat ?? '[CODE]'
        return edit(editor, 'insertText', format.replace('CODE', `${value.pack}/${value.name}`))
    }
    return insertImages(editor, src)
}

export const commands: { [K in EditorCommand]: CommandHandler<CommandValues[K]> } = {
    ...Object.fromEntries(native.map(name => [name, (editor: SimpleEditor) => edit(editor, name)])) as unknown as
        Record<typeof native[number], CommandHandler<undefined>>,
    ...Object.fromEntries(fonts.map(name => [name, (editor: SimpleEditor, value: string) => edit(editor, name, value)])) as unknown as
        Record<typeof fonts[number], CommandHandler<string>>,
    ...Object.fromEntries(headers.map(tag => [tag, (editor: SimpleEditor) => edit(editor, 'formatBlock', `<${tag}>`)])) as unknown as
        Record<typeof headers[number], CommandHandler<undefined>>,
    header: (editor, value) => /^h[1-6]$/i.test(value) && edit(editor, 'formatBlock', `<${value}>`),
    insert: (editor, value) => editor.insertHTML(value),
    inserttext: (editor, value) => edit(editor, 'insertText', value),
    createlink: (editor, value) => Boolean(value && insertLink(editor, value.url, undefined, value.isNew)),
    insertfile: (editor, value) => Boolean(value && insertLink(editor, value[1], value[0] ?? editor.options.aaa, true, true)),
    insertimage: insertImages,
    insertvideo: insertVideo,
    inserttable: insertTable,
    insertemoticon: insertEmoticon,
    insertfragments: (editor, value) => {
        const fragment = editor.options.fragments?.[Number(value)]
        return fragment ? editor.insertHTML(fragment.code) : false
    },
}
