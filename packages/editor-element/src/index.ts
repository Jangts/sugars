import { createEditor } from '@sugars/editor'
import type { Editor, EditorChange, EditorCommand, CommandValues } from '@sugars/editor'

export const editorTag = 'sugars-editor'

export interface SugarsEditorElement extends HTMLElement {
  value: string
  readOnly: boolean
  readonly editor: Editor | undefined
  execCommand<K extends EditorCommand>(command: K, value?: CommandValues[K]): this
  execute<K extends EditorCommand>(command: K, value?: CommandValues[K]): boolean
}

declare global {
  interface HTMLElementTagNameMap {
    'sugars-editor': SugarsEditorElement
  }
}

const definitions = new WeakMap<CustomElementRegistry, CustomElementConstructor>()

export function defineEditorElement(): CustomElementConstructor {
  const registry = globalThis.customElements
  const previous = registry.get(editorTag)
  if (previous) {
    if (definitions.get(registry) !== previous) throw new Error(`Custom element "${editorTag}" is already registered`)
    return previous
  }

  class EditorElement extends HTMLElement implements SugarsEditorElement {
    static readonly observedAttributes = ['readonly']
    private instance?: Editor
    private pendingValue?: string

    get editor(): Editor | undefined { return this.instance }

    get value(): string { return this.pendingValue ?? this.innerHTML }
    set value(html: string) {
      if (this.instance) this.instance.setValue(html)
      else this.pendingValue = html
    }

    get readOnly(): boolean { return this.hasAttribute('readonly') }
    set readOnly(value: boolean) { this.toggleAttribute('readonly', value) }

    connectedCallback(): void {
      if (Object.hasOwn(this, 'value')) {
        const value = this.value
        Reflect.deleteProperty(this, 'value')
        this.value = value
      }
      if (Object.hasOwn(this, 'readOnly')) {
        const value = this.readOnly
        Reflect.deleteProperty(this, 'readOnly')
        this.readOnly = value
      }
      // Let the parser add initial children before reading the Light DOM.
      queueMicrotask(() => {
        if (!this.isConnected || this.instance) return
        this.instance = createEditor(this, {
          html: this.pendingValue,
          readOnly: this.readOnly,
          onChange: (detail: EditorChange) => {
            this.dispatchEvent(new CustomEvent<EditorChange>('editor-change', {
              detail, bubbles: true, composed: true,
            }))
          },
        })
        this.pendingValue = undefined
        this.dispatchEvent(new CustomEvent('editor-ready', { bubbles: true, composed: true }))
      })
    }

    disconnectedCallback(): void {
      this.instance?.destroy()
      this.instance = undefined
    }

    attributeChangedCallback(): void {
      if (this.instance) this.instance.readOnly = this.readOnly
    }

    execCommand<K extends EditorCommand>(command: K, value?: CommandValues[K]): this {
      this.instance?.execute(command, value)
      return this
    }

    execute<K extends EditorCommand>(command: K, value?: CommandValues[K]): boolean {
      return this.instance?.execute(command, value) ?? false
    }
  }

  registry.define(editorTag, EditorElement)
  definitions.set(registry, EditorElement)
  return EditorElement
}
