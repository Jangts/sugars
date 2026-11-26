/* 描述可独立加载的 AMD 工厂，类型从共享的加载器合同导出。 */

import type { AmdLoader, AmdOptions } from './types.js'

/**
 * 创建拥有独立模块表、路径配置和脚本队列的 AMD 加载器。
 *
 * @param options - 相对路径、包映射、加载超时及可选脚本文档。
 * @returns 可独立使用的 define、require 和全局名称接管入口。
 * @throws {RangeError} 脚本超时设置超出支持的范围。
 */
declare function createAmdLoader(options?: AmdOptions): AmdLoader

export = createAmdLoader
