/* 持有行情存储和窗口数据，集中处理历史数据、实时更新及时间索引。 */

import type { KLine } from './index.js'

export type KLineTuple = readonly [time: number, open: number, high: number, low: number, close: number, volume: number, turnover?: number]
export interface KLineServerBar {
    unixts: number
    openpx: number
    highpx: number
    lowpx: number
    newpx: number
    vol: number
    money?: number
}

export class Data {
    constructor(
        readonly t: number,
        readonly o: number,
        readonly h: number,
        readonly l: number,
        readonly n: number,
        readonly v: number,
        readonly m?: number,
    ) {}
}

export type KLineBar = Data | KLineTuple | KLineServerBar

/** 把服务端秒时间戳转换成毫秒，元组和 Data 输入使用已有的毫秒时间戳。 */
function normalize(bar: KLineBar): Data {
    if (!bar || typeof bar !== 'object') throw new TypeError('Expected a K-line bar')
    let values: KLineTuple
    if ('unixts' in bar) {
        values = [bar.unixts * 1000, bar.openpx, bar.highpx, bar.lowpx, bar.newpx, bar.vol, bar.money]
    } else if ('t' in bar) {
        values = [bar.t, bar.o, bar.h, bar.l, bar.n, bar.v, bar.m]
    } else {
        values = bar
    }
    const [t, o, h, l, n, v, m] = values
    if (![t, o, h, l, n, v].every(Number.isFinite) || Math.abs(t) > 8.64e15 ||
        (m !== undefined && !Number.isFinite(m)) || h < Math.max(o, l, n) || l > Math.min(o, n) || v < 0) {
        throw new TypeError('Invalid K-line bar')
    }
    return new Data(t, o, h, l, n, v, m)
}

export class DataProvider {
    storage: Data[] = []
    firstIndex = -1
    revision = 0

    constructor(readonly kline: KLine, data: readonly KLineBar[] = []) {
        this.reset(data)
    }

    /**
     * 校验后按时间排序。同一时间戳重复出现时，取最后一条记录。
     *
     * @param items - 新的数据集。先规范化全部记录，再发布新的有序存储。
     * @throws {TypeError} 任一行情记录无效。
     */
    reset(items: readonly KLineBar[]): void {
        const indexed = new Map(items.map(item => {
            const bar = normalize(item)
            return [bar.t, bar] as const
        }))
        this.storage = [...indexed.values()].sort((a, b) => a.t - b.t)
        this.firstIndex = this.storage.length ? 0 : -1
        this.revision++
    }

    indexAtOrAfter(time: number): number {
        let lo = 0
        let hi = this.storage.length
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2)
            if (this.storage[mid]!.t < time) lo = mid + 1
            else hi = mid
        }
        return lo
    }

    append(item: KLineBar): void {
        const bar = normalize(item)
        const index = this.indexAtOrAfter(bar.t)
        if (this.storage[index]?.t === bar.t) this.storage[index] = bar
        else this.storage.splice(index, 0, bar)
        this.firstIndex = 0
        this.revision++
    }

    getDataAt(index: number): Data | undefined {
        return this.storage[index]
    }
}
