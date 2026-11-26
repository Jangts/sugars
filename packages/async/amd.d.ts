import type { AmdLoader, AmdOptions } from './types.js'

declare function createAmdLoader(options?: AmdOptions): AmdLoader

export = createAmdLoader
