/* 按词法表把源码切成文本与 Token，处理跨片段的贪婪匹配、嵌套词法和 HTML 序列化。 */

import type { Grammar, Pattern, Rule } from './grammar.js'

/** 标记的内容可为纯文本，也可为内部词法产生的标记流。 */
export type TokenContent = string | TokenStream
/** 按源码顺序保存纯文本和已识别标记。 */
export type TokenStream = (string | Token)[]

export class Token {
    constructor(
        /** 来自词法表键名的标记类别。 */
        public readonly type: string,
        /** 匹配到的文本或展开后的内部标记流。 */
        public readonly content: TokenContent,
        /** 序列化时额外加入的样式类别。 */
        public readonly alias: string | string[] | undefined,
        /** 用于重新拼接贪婪候选的原始匹配文本。 */
        public readonly matchedStr: string,
        /** 此标记是否由允许跨片段匹配的规则生成。 */
        public readonly greedy: boolean,
    ) {}
}

function isRule(value: unknown): value is Rule {
    return value instanceof RegExp || (
        typeof value === 'object' && value !== null && 'pattern' in value && value.pattern instanceof RegExp
    )
}

function matchPattern(pattern: RegExp, text: string, lookbehind?: boolean) {
    // 规则实例会在多个片段和语言之间复用。每次从新片段开始，清除 RegExp 上一次匹配的游标。
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (!match) return undefined

    // lookbehind 由第一捕获组模拟。上下文负责确定位置，只有其之后的文本进入标记。
    const prefixLength = lookbehind ? match[1]?.length ?? 0 : 0
    const value = match[0].slice(prefixLength)
    return value ? { from: match.index + prefixLength, value } : undefined
}

type ActiveRules = Map<Grammar, Set<string>>

function applyRule(text: string, stream: TokenStream, type: string, rule: Pattern, active: ActiveRules) {
    for (let index = 0; index < stream.length; index++) {
        let segment = stream[index]!
        if (typeof segment !== 'string') continue
        // 每个片段至少消耗一个字符。超过这个上界说明当前规则无法继续安全地细分。
        if (stream.length > text.length) return false

        let match = matchPattern(rule.pattern, segment, rule.lookbehind)
        let replaced = 1

        // TangramJS greedy matching can join the current string with up to two following entries.
        const next = stream[index + 1]
        if (!match && rule.greedy && next !== undefined) {
            const nextText = typeof next === 'string' ? next : next.matchedStr
            const third = stream[index + 2]
            const combined = segment + nextText + (typeof third === 'string' ? third : third?.matchedStr ?? '')
            match = matchPattern(rule.pattern, combined, rule.lookbehind)
            if (!match || match.from >= segment.length) continue

            const nextEnd = segment.length + nextText.length
            if (match.from + match.value.length <= nextEnd) {
                // 跨两段的候选保留已有的贪婪标记，沿用历史重叠规则。
                if (next instanceof Token && next.greedy) continue
                replaced = 2
                segment = combined.slice(0, nextEnd)
            } else {
                replaced = 3
                segment = combined
            }
        }

        if (!match) continue
        const before = segment.slice(0, match.from)
        const after = segment.slice(match.from + match.value.length)
        const content = rule.inside ? tokenizeNested(match.value, rule.inside, active) : match.value
        const replacement: TokenStream = []
        if (before) replacement.push(before)
        replacement.push(new Token(type, content, rule.alias, match.value, !!rule.greedy))
        if (after) replacement.push(after)
        stream.splice(index, replaced, ...replacement)
    }
    return true
}

/**
 * 按词法规则顺序分割源码，返回保持原排列的文本段和 Token。
 *
 * @param text - 待分词源码。
 * @param grammar - 按键的枚举顺序尝试的规则，值可以是单条规则或候选数组。
 * @returns 含未匹配文本与词法标记的有序序列。
 * @throws {TypeError} 同一词法在未缩短的相同输入上递归。
 */
export function tokenize(text: string, grammar: Grammar): TokenStream {
    return tokenizeNested(text, grammar, new Map())
}

function tokenizeNested(text: string, grammar: Grammar, active: ActiveRules): TokenStream {
    let inputs = active.get(grammar)
    if (!inputs) {
        inputs = new Set()
        active.set(grammar, inputs)
    }
    // 按词法对象与当前文本同时判断递归。允许嵌套语言继续处理更小的匹配片段。
    if (inputs.has(text)) throw new TypeError('Highlight grammar recurses without consuming input')
    inputs.add(text)
    try {
        return tokenizeRules(text, grammar, active)
    } finally {
        inputs.delete(text)
        if (!inputs.size) active.delete(grammar)
    }
}

function tokenizeRules(text: string, grammar: Grammar, active: ActiveRules): TokenStream {
    const stream: TokenStream = [text]
    // 在副本视图中展开 rest，让嵌套补充规则覆盖同名项，保留原词法对象供下一次分词。
    const rules = grammar.rest ? { ...grammar, ...grammar.rest } : grammar

    for (const [type, candidates] of Object.entries(rules)) {
        if (type === 'rest') continue
        for (const candidate of Array.isArray(candidates) ? candidates : [candidates]) {
            if (!isRule(candidate)) continue
            const rule = candidate instanceof RegExp ? { pattern: candidate } : candidate
            if (!applyRule(text, stream, type, rule, active)) return stream
        }
    }
    return stream
}
