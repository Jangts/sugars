import type { Grammar, Pattern, Rule } from './grammar.js'

export type TokenContent = string | TokenStream
export type TokenStream = (string | Token)[]

export class Token {
    constructor(
        public readonly type: string,
        public readonly content: TokenContent,
        public readonly alias: string | string[] | undefined,
        public readonly matchedStr: string,
        public readonly greedy: boolean,
    ) {}
}

function isRule(value: unknown): value is Rule {
    return value instanceof RegExp || (
        typeof value === 'object' && value !== null && 'pattern' in value && value.pattern instanceof RegExp
    )
}

function matchPattern(pattern: RegExp, text: string, lookbehind?: boolean) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (!match) return undefined

    const prefixLength = lookbehind ? match[1]?.length ?? 0 : 0
    const value = match[0].slice(prefixLength)
    return value ? { from: match.index + prefixLength, value } : undefined
}

function applyRule(text: string, stream: TokenStream, type: string, rule: Pattern) {
    for (let index = 0; index < stream.length; index++) {
        let segment = stream[index]!
        if (typeof segment !== 'string') continue
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
        const content = rule.inside ? tokenize(match.value, rule.inside) : match.value
        const replacement: TokenStream = []
        if (before) replacement.push(before)
        replacement.push(new Token(type, content, rule.alias, match.value, !!rule.greedy))
        if (after) replacement.push(after)
        stream.splice(index, replaced, ...replacement)
    }
    return true
}

export function tokenize(text: string, grammar: Grammar): TokenStream {
    const stream: TokenStream = [text]
    const rules = grammar.rest ? { ...grammar, ...grammar.rest } : grammar

    for (const [type, candidates] of Object.entries(rules)) {
        if (type === 'rest') continue
        for (const candidate of Array.isArray(candidates) ? candidates : [candidates]) {
            if (!isRule(candidate)) continue
            const rule = candidate instanceof RegExp ? { pattern: candidate } : candidate
            if (!applyRule(text, stream, type, rule)) return stream
        }
    }
    return stream
}
