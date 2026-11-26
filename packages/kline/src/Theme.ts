/* 为 K 线、成交量、指标和覆盖层集中提供画笔所使用的主题色。 */

import type { ThemeInterface } from './types.js'

const lightBase = {
    Positive: '#53b37b',
    Negative: '#db5542',
    Background: '#fff',
    Indicator0: '#2fd2b2',
    Indicator1: '#ffb400',
    Indicator2: '#e849b9',
    Indicator3: '#1478c8',
    GridX: '#ccc',
    GridY: '#ccc',
    GridC: '#bbb',
    GridS: '#aaa',
    GridTextX: '#555',
    GridTextY: '#555',
    GridTextC: '#bbb',
    SelectedTX: '#333',
    SelectedSX: '#ccc',
    SelectedBGX: '#fff',
    SelectedTY: '#333',
    SelectedSY: '#a6a6a6',
    SelectedBGY: '#fff',
    SelectedTI: '#333',
    SelectedSI: '#ccc',
    SelectedBGI: '#fff',
    SelectedTP: '#53b37b',
    SelectedTN: '#db5542',
    SelectedL: '#aaa',
    SelectedB: '#aaa',
    SelectedP: '#aaa'
}

export class Theme implements ThemeInterface {
    readonly isDark: boolean
    Positive: string = '#19b34c'
    Negative: string = '#990e0e'
    Background: string = '#131e30'
    Indicator0: string = '#ddd'
    Indicator1: string = '#f9ee30'
    Indicator2: string = '#f600ff'
    Indicator3: string = '#6bf'
    Indicator4: string = '#a5cf81'
    Indicator5: string = '#e18b89'
    GridX: string = '#666'
    GridY: string = '#666'
    GridC: string = '#888'
    GridS: string = '#aaa'
    GridTextX: string = '#a1aec1'
    GridTextY: string = '#a1aec1'
    GridTextC: string = '#888'
    SelectedTX: string = '#dce5f2'
    SelectedSX: string = '#666'
    SelectedBGX: string = '#0a0a0a'
    SelectedTY: string = '#dce5f2'
    SelectedSY: string = '#a6a6a6'
    SelectedBGY: string = '#0a0a0a'
    SelectedTI: string = '#666'
    SelectedSI: string = '#666'
    SelectedBGI: string = '#0a0a0a'
    SelectedTP: string = '#1bd357'
    SelectedTN: string = '#ff6f5e'
    SelectedL: string = '#aaa'
    SelectedB: string = '#aaa'
    SelectedP: string = '#aaa'
    FontX: string = '13px Tahoma'
    FontY: string = '12px Tahoma'
    FontI: string = '14px Tahoma'
    FontP: string = '12px Tahoma'
    FontR: string = '15px Tahoma'
    FontS: string = '14px Tahoma'
    FontT: string = '14px Tahoma'
    FontB: string = '13px Tahoma'

    constructor(styles: Partial<ThemeInterface> = {}, isDark: boolean = true) {
        this.isDark = isDark
        if (!isDark) Object.assign(this, lightBase)
        for (const property in styles) {
            if (!Object.hasOwn(styles, property) || property === 'isDark' || !Object.hasOwn(this, property)) continue
            const key = property as keyof ThemeInterface
            const value = styles[key]
            if (typeof value === 'string') this[key] = value
        }
    }
}

export const classicDark = new Theme()
export const classicLight = new Theme({}, false)
export const reverseDark = new Theme({ Positive: '#990e0e', Negative: '#19b34c' })
export const reverseLight = new Theme({ Positive: '#db5542', Negative: '#53b37b' }, false)
