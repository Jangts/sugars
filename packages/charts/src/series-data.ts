/* 封装系列装配共用的遍历、数值范围和配置合并，保留 TangramJS 的回调参数顺序和数组覆盖方式。 */

import { cloneDeep, mergeWith } from 'lodash-es'

// TangramJS 的回调以索引或键为第一参数，接收者可由调用方传入。
export function eachEntry<T>(
  source: ArrayLike<unknown> | object | null | undefined,
  visit: (this: T, key: any, value: any) => unknown,
  receiver?: T,
): void {
  if (!source) return
  const scan = (key: string | number, value: unknown) => visit.call(receiver as T, key, value)
  if (Array.isArray(source)) source.forEach((value, index) => scan(index, value))
  else for (const [key, value] of Object.entries(source)) scan(key, value)
}

export function visitUntil<T>(
  source: readonly unknown[], visit: (this: T, index: number, value: any) => unknown, receiver?: T,
): void {
  for (const [index, value] of source.entries()) {
    if (visit.call(receiver as T, index, value) === false) break
  }
}

export function joinLists<T>(...lists: (readonly T[] | undefined)[]): T[] {
  return lists.flatMap(list => list ?? [])
}

export function minNumber(values: readonly number[]): number {
  return values.reduce((min, value) => Number.isFinite(value) ? Math.min(min, value) : min, Infinity)
}

export function maxNumber(values: readonly number[]): number {
  return values.reduce((max, value) => Number.isFinite(value) ? Math.max(max, value) : max, -Infinity)
}

export function mergeOptions<A extends object, B extends object>(base: A, patch: B): A & B {
  return mergeWith({}, base, patch, (_: unknown, next: unknown) => Array.isArray(next) ? cloneDeep(next) : undefined)
}
