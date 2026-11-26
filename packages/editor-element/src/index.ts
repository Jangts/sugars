/**
 * `@sugars/editor-element` 的公开入口。
 *
 * 将原生编辑器挂到自定义元素的 Light DOM，处理属性映射、编辑事件、断开和重连。
 * `defineEditorElement` 在当前窗口注册标签，`SugarsEditorElement` 描述外部组件使用的契约。
 */

import { createEditor } from '@sugars/editor'
import type { Editor, EditorChange, EditorCommand, CommandValues } from '@sugars/editor'

export const editorTag = 'sugars-editor'

export interface SugarsEditorElement extends HTMLElement {
  /** 编辑后的 HTML。尚未初始化时读取入队值或当前 Light DOM。 */
  value: string
  /** 与 readonly 属性同步的编辑开关。 */
  readOnly: boolean
  /** 当前连接周期创建的编辑器，未连接或尚未初始化时为 undefined。 */
  readonly editor: Editor | undefined
  /**
   * @param command - 交给编辑器实例的命令。
   * @param value - 当前命令的输入值。
   * @returns 当前自定义元素。
   */
  execCommand<K extends EditorCommand>(command: K, value?: CommandValues[K]): this
  /**
   * @param command - 执行的编辑命令。
   * @param value - 当前命令的输入值。
   * @returns 内部实例报告命令生效时为 true。
   */
  execute<K extends EditorCommand>(command: K, value?: CommandValues[K]): boolean
}

declare global {
  interface HTMLElementTagNameMap {
    'sugars-editor': SugarsEditorElement
  }
}

const definitions = new WeakMap<CustomElementRegistry, CustomElementConstructor>()

/**
 * 在当前自定义元素注册表中重复调用时返回同一构造器。
 *
 * @returns sugars-editor 在当前注册表中的构造器。
 * @throws 同名标签已被其他实现定义。
 */
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
      // 等 HTML 解析器加入初始子节点后再读取 Light DOM。
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

    /** 释放当前内部编辑器。再次连接时从元素保留的内容重建。 */
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
