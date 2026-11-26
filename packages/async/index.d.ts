import createAmdLoader = require('./amd.js')
import LegacyPromise = require('./promise.js')

export { createAmdLoader, LegacyPromise, LegacyPromise as Promise }
export type {
    AmdConfig, AmdDefine, AmdFactory, AmdLoader, AmdModule, AmdOptions, AmdPackage, AmdRequire,
    LegacyPromiseConstructor, LegacyPromiseInstance, PromiseExecutor, PromiseStatus,
} from './types.js'
