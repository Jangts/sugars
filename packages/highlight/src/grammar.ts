/* 维护语言词法表、深复制和规则插入。别名与嵌套语言持有的同一词法表引用随替换更新。 */

export interface Pattern {
    /** 作用于当前文本片段的正则。 */
    pattern: RegExp
    /** 用于继续切分匹配内容的词法表。 */
    inside?: Grammar
    /** 用第一捕获组识别前缀上下文，该组不会进入标记内容。 */
    lookbehind?: boolean
    /** 局部匹配失败时允许尝试后续片段，仍按分词器的旧重叠规则选择范围。 */
    greedy?: boolean
    /** 序列化时加到标记上的额外样式类。 */
    alias?: string | string[]
}

export type Rule = RegExp | Pattern

export interface Grammar {
    [token: string]: Rule | Rule[] | Grammar | null | undefined
    /** 分词时展开的附加词法。同名规则以这里的定义为准。 */
    rest?: Grammar
}

/**
 * 取出已登记的对象规则。
 * @param rule - 单个词法表成员。
 * @returns 包含 RegExp 的对象形式规则。
 * @throws {TypeError} 成员是裸正则、规则数组或其他类型。
 */
export function grammarPattern(rule: Grammar[string]): Pattern {
    if (!rule || Array.isArray(rule) || !('pattern' in rule) || !(rule.pattern instanceof RegExp)) {
        throw new TypeError('Expected a token pattern in the bundled grammar')
    }
    return rule as Pattern
}

/**
 * 取得对象规则的内部词法。
 * @param rule - 预期含 inside 的词法表成员。
 * @returns 正在使用的内部词法对象，可用于继续装配规则。
 * @throws {TypeError} 成员缺少可用的 inside。
 */
export function insideGrammar(rule: Grammar[string]): Grammar {
    const { inside } = grammarPattern(rule)
    if (!inside) throw new TypeError('Expected a nested bundled grammar')
    return inside
}

/**
 * @param rule - 应由多个候选组成的词法表成员。
 * @returns 原候选数组。
 * @throws {TypeError} 成员类型与预期不符。
 */
export function grammarRules(rule: Grammar[string]): Rule[] {
    if (!Array.isArray(rule)) throw new TypeError('Expected an array of bundled grammar rules')
    return rule
}

type GrammarObject = Record<string, unknown>
type GrammarVisitor = (this: GrammarObject, key: string, value: unknown, type: string) => void

function isGrammarObject(value: unknown): value is GrammarObject {
    return value !== null && typeof value === 'object' && !(value instanceof RegExp)
}

/**
 * 复制词法表的可遍历结构，保留 RegExp 对象及嵌套引用关系。
 *
 * @param value - 词法表或其中的成员。
 * @param copies - 本轮复制前后对象的登记表，用于保留环和共享关系。
 * @returns 复制后的结构，正则等非词法容器沿用原值。
 */
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

type GrammarTarget = Record<string, Grammar | undefined> | Grammar | Pattern

interface LanguageMethods {
    extend(name: string, rules: Grammar): Grammar
    insertBefore(name: string, rules: Grammar): Grammar
    insertBefore(name: string, before: string, rules: Grammar, root?: GrammarTarget): Grammar
    DFS: typeof walkGrammar
}

export type LanguageRegistry = Record<string, Grammar | undefined> & LanguageMethods

export const languages = Object.defineProperties(Object.create(null), {
    extend: { value: extend },
    insertBefore: { value: insertBefore },
    DFS: { value: walkGrammar },
}) as LanguageRegistry

/**
 * @param name - 语言名或别名。
 * @returns 已登记的词法，缺少项目时返回 undefined。
 */
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
    root: GrammarTarget = languages,
): Grammar {
    const entries = root as Record<string, unknown>
    const grammar = Object.hasOwn(entries, name) ? entries[name] : undefined
    if (!isGrammarObject(grammar)) throw new TypeError(`Unknown highlight grammar: ${name}`)
    if (typeof before !== 'string') return Object.assign(grammar, before)

    let updated: Grammar = {}
    for (const [token, rule] of Object.entries(grammar)) {
        if (token === before) updated = { ...updated, ...rules }
        Object.defineProperty(updated, token, { value: rule, enumerable: true, configurable: true, writable: true })
    }

    // 替换词法表时，更新仍引用原表的别名和内嵌规则。
    walkGrammar(languages, function (key, value) {
        if (value === grammar && (this !== root || key !== name)) this[key] = updated
    })
    entries[name] = updated
    return updated
}
