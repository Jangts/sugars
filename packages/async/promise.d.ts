/* 声明旧式 Promise 子入口，可直接从 CommonJS 取得构造器。 */

import type { LegacyPromiseConstructor } from './types.js'

declare const LegacyPromise: LegacyPromiseConstructor

export = LegacyPromise
