/* 汇总 AMD 与旧式 Promise 的声明，公开的 Promise 别名沿用同一个构造器类型。 */

import createAmdLoader = require('./amd.js')
import LegacyPromise = require('./promise.js')

export { createAmdLoader, LegacyPromise, LegacyPromise as Promise }
export type {
    AmdConfig, AmdDefine, AmdFactory, AmdLoader, AmdModule, AmdOptions, AmdPackage, AmdRequire,
    LegacyPromiseConstructor, LegacyPromiseInstance, PromiseExecutor, PromiseStatus,
} from './types.js'
