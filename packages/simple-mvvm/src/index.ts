/**
 * `@sugars/simple-mvvm` 的公开入口。
 *
 * 汇总数据监听、ViewModel 和虚拟 DOM 操作，应用可分别使用这些能力。
 * `observe`、`Observer` 和 `Listener` 处理字段订阅，`ViewModel` 管理渲染，`VElement`、`diff` 和 `patch` 可独立使用。
 */

export { Listener, Observer, observe } from './observer.js'
export type { ObserverCallback } from './observer.js'
export { ViewModel } from './view-model.js'
export type { CustomRenderOptions, VirtualRenderOptions, ViewModelOptions, ViewModelState } from './view-model.js'
export { VElement, createVElement, diff, patch } from './v-element.js'
export type { PatchOperation, Patches, VChild, VElementProps, VNode } from './v-element.js'
