export interface Pattern {
    pattern: RegExp
    inside?: Grammar
    lookbehind?: boolean
    greedy?: boolean
    alias?: string | string[]
}

export type Rule = RegExp | Pattern

export interface Grammar {
    [token: string]: Rule | Rule[] | Grammar | null | undefined
    rest?: Grammar
}

type GrammarObject = Record<string, unknown>
type GrammarVisitor = (this: GrammarObject, key: string, value: unknown, type: string) => void

function isGrammarObject(value: unknown): value is GrammarObject {
    return value !== null && typeof value === 'object' && !(value instanceof RegExp)
}

export function cloneGrammar<T>(value: T, copies = new WeakMap<object, unknown>()): T {
    if (!isGrammarObject(value)) return value
    if (copies.has(value)) return copies.get(value) as T

    const copy = (Array.isArray(value) ? [] : {}) as GrammarObject
    copies.set(value, copy)
    for (const [key, entry] of Object.entries(value)) {
        Object.defineProperty(copy, key, { value: cloneGrammar(entry, copies), enumerable: true, configurable: true, writable: true })
    }
    return copy as T
}

function walkGrammar(
    object: object,
    visit: GrammarVisitor,
    type?: string,
    visited = new WeakSet<object>(),
): void {
    if (visited.has(object)) return
    visited.add(object)

    const entries = object as GrammarObject
    for (const key of Object.keys(entries)) {
        visit.call(entries, key, entries[key], type || key)
        const value = entries[key]
        if (isGrammarObject(value)) {
            walkGrammar(value, visit, Array.isArray(value) ? key : undefined, visited)
        }
    }
}

interface LanguageMethods {
    extend(name: string, rules: Grammar): Grammar
    insertBefore(name: string, rules: Grammar): Grammar
    insertBefore(name: string, before: string, rules: Grammar, root?: Record<string, Grammar | undefined>): Grammar
    DFS: typeof walkGrammar
}

export type LanguageRegistry = Record<string, Grammar | undefined> & LanguageMethods

export const languages = Object.defineProperties(Object.create(null), {
    extend: { value: extend },
    insertBefore: { value: insertBefore },
    DFS: { value: walkGrammar },
}) as LanguageRegistry

export function getGrammar(name: string): Grammar | undefined {
    const grammar = languages[name]
    return isGrammarObject(grammar) ? grammar : undefined
}

function extend(name: string, rules: Grammar): Grammar {
    const base = getGrammar(name)
    if (!base) throw new TypeError(`Unknown highlight language: ${name}`)
    return { ...cloneGrammar(base), ...rules }
}

function insertBefore(
    name: string,
    before: string | Grammar,
    rules?: Grammar,
    root: Record<string, Grammar | undefined> = languages,
): Grammar {
    const grammar = Object.hasOwn(root, name) ? root[name] : undefined
    if (!isGrammarObject(grammar)) throw new TypeError(`Unknown highlight grammar: ${name}`)
    if (typeof before !== 'string') return Object.assign(grammar, before)

    let updated: Grammar = {}
    for (const [token, rule] of Object.entries(grammar)) {
        if (token === before) updated = { ...updated, ...rules }
        Object.defineProperty(updated, token, { value: rule, enumerable: true, configurable: true, writable: true })
    }

    // Existing aliases and embedded languages follow the replacement grammar.
    walkGrammar(languages, function (key, value) {
        if (value === grammar && (this !== root || key !== name)) this[key] = updated
    })
    root[name] = updated
    return updated
}
