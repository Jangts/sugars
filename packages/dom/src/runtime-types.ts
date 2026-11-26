import type { Elements } from './index.js'

// A selection can contain primitives, browser nodes, or plugin-owned objects.
// Reflective member access stays at this boundary. The public collection is generic.
export type SelectionValue = any
export type RuntimeCollection = Elements<SelectionValue>
export type SelectionPredicate = (this: SelectionValue, index: number, item: SelectionValue) => unknown
