export type Row = Record<string, unknown>
type Value = (row: Row) => unknown
type Filter = (row: Row) => boolean

type Selection = {
    filter: Filter
    order: { field: string; direction: string }[]
    limit?: [offset: number, count: number]
}

type Statement = { table: string } & (
    | { operation: 'select'; columns: string[]; selection: Selection }
    | { operation: 'delete'; selection: Selection }
    | { operation: 'update'; selection: Selection; values: Row }
    | { operation: 'insert'; values: Row[] }
)

export const identifier = /^[a-z_]\w*$/i
const number = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i

const tokenPattern = /\s+|"(?:\\.|[^"\\])*"|'(?:''|\\.|[^'\\])*'|===|!==|==|!=|<=|>=|<>|&&|\|\||[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|[a-z_]\w*|[!<>=(),.*;[\]{}:]/iy
const comparison = new Set(['===', '!==', '==', '!=', '<=', '>=', '<>', '=', '<', '>'])

function tokens(sql: string): string[] {
    const result: string[] = []
    tokenPattern.lastIndex = 0
    while (tokenPattern.lastIndex < sql.length) {
        const match = tokenPattern.exec(sql)
        if (!match) throw new SyntaxError('Unexpected character in Sheet query')
        if (match[0].trim()) result.push(match[0])
    }
    return result
}

function stringValue(token: string): string {
    if (token.startsWith('"')) return JSON.parse(token)
    return token.slice(1, -1).replace(/''|\\(?:u[0-9a-f]{4}|['"\\/bfnrt])/gi, char => {
        if (char === "''" || char === "\\'") return "'"
        if (char === '\\"') return '"'
        return JSON.parse('"' + char + '"')
    })
}

function compare(op: string, left: unknown, right: unknown): boolean {
    if (op === '===') return left === right
    if (op === '!==') return left !== right
    if (op === '=' || op === '==') return left == right
    if (op === '!=' || op === '<>') return left != right
    const a = left as string | number
    const b = right as string | number
    switch (op) {
        case '<': return a < b
        case '>': return a > b
        case '<=': return a <= b
        case '>=': return a >= b
        default: return false
    }
}

// Replaces eval and with in TangramJS src/data/data.js and src/data/Sheet.js.
class Parser {
    #position = 0

    constructor(private readonly input: string[]) {}

    peek(): string { return this.input[this.#position] ?? '' }
    take(): string { return this.input[this.#position++] ?? '' }

    accept(keyword: string): boolean {
        if (this.peek().toLowerCase() !== keyword) return false
        this.take()
        return true
    }

    expect(keyword: string): void {
        if (!this.accept(keyword)) throw new SyntaxError('Expected ' + keyword)
    }

    name(): string {
        const name = this.take()
        if (!identifier.test(name)) throw new SyntaxError('Expected a field or table name')
        return name
    }

    list<T>(read: () => T): T[] {
        const list = [read()]
        while (this.accept(',')) list.push(read())
        return list
    }

    literal(): unknown {
        if (this.accept('[')) {
            if (this.accept(']')) return []
            const items = this.list(() => this.literal())
            this.expect(']')
            return items
        }
        if (this.peek() === '{') return this.object()
        const token = this.take()
        if (token.startsWith('"') || token.startsWith("'")) return stringValue(token)
        if (number.test(token) && Number.isFinite(Number(token))) return Number(token)
        switch (token.toLowerCase()) {
            case 'true': return true
            case 'false': return false
            case 'null': return null
        }
        throw new SyntaxError('Expected a literal value')
    }

    object(): Row {
        this.expect('{')
        if (this.accept('}')) return {}
        const fields = this.list(() => {
            const token = this.peek()
            const key = token.startsWith('"') || token.startsWith("'") ? stringValue(this.take()) : this.name()
            this.expect(':')
            return [key, this.literal()] as const
        })
        this.expect('}')
        return Object.fromEntries(fields)
    }

    operand(): Value {
        if (this.accept('(')) {
            const expression = this.expression()
            this.expect(')')
            return expression
        }
        const token = this.peek()
        if (identifier.test(token) && !['true', 'false', 'null'].includes(token.toLowerCase())) {
            const field = this.name()
            return row => Object.hasOwn(row, field) ? row[field] : undefined
        }
        const value = this.literal()
        return () => value
    }

    predicate(): Filter {
        if (this.accept('not') || this.accept('!')) {
            const next = this.predicate()
            return row => !next(row)
        }
        const left = this.operand()
        const op = this.peek()
        if (!comparison.has(op)) return row => Boolean(left(row))
        this.take()
        const right = this.operand()
        return row => compare(op, left(row), right(row))
    }

    conjunction(): Filter {
        const predicates = [this.predicate()]
        while (this.accept('and') || this.accept('&&')) predicates.push(this.predicate())
        return row => predicates.every(test => test(row))
    }

    expression(): Filter {
        const clauses = [this.conjunction()]
        while (this.accept('or') || this.accept('||')) clauses.push(this.conjunction())
        return row => clauses.some(test => test(row))
    }

    nonnegative(): number {
        const token = this.take()
        const value = Number(token)
        if (!/^\d+$/.test(token) || !Number.isSafeInteger(value)) throw new SyntaxError('Invalid LIMIT')
        return value
    }

    selection(requireWhere = false): Selection {
        const where = this.accept('where')
        if (requireWhere && !where) throw new SyntaxError('Expected where')
        const filter = where ? this.expression() : () => true
        let order: Selection['order'] = []
        if (this.accept('order')) {
            this.expect('by')
            order = this.list(() => {
                const field = this.name()
                const next = this.peek().toLowerCase()
                const direction = ['asc', 'desc', 'ascnum', 'descnum'].includes(next) ? this.take().toLowerCase() : 'asc'
                return { field, direction }
            })
        }
        if (!this.accept('limit')) return { filter, order }
        const first = this.nonnegative()
        const limit: Selection['limit'] = this.accept(',') ? [Math.max(0, first - 1), this.nonnegative()] : [0, first]
        return { filter, order, limit }
    }

    statement(): Statement {
        const operation = this.take().toLowerCase()
        switch (operation) {
            case 'select': {
                const columns = this.accept('*') ? ['*'] : this.list(() => this.name())
                this.expect('from')
                const table = this.name()
                return { operation, table, columns, selection: this.selection() }
            }
            case 'delete': {
                this.expect('from')
                const table = this.name()
                return { operation, table, selection: this.selection() }
            }
            case 'update': {
                const table = this.name()
                this.expect('set')
                const values = this.object()
                return { operation, table, values, selection: this.selection(true) }
            }
            case 'insert': {
                this.expect('into')
                const table = this.name()
                this.expect('values')
                return { operation, table, values: this.list(() => this.object()) }
            }
            default: throw new SyntaxError('Unknown Sheet operation')
        }
    }
}

export function parse(sql: string): Statement {
    const parser = new Parser(tokens(sql))
    const statement = parser.statement()
    parser.accept(';')
    if (parser.peek()) throw new SyntaxError('Unexpected token ' + parser.peek())
    return statement
}

// TangramJS src/data/data.js, filter/order/limit followed by projection.
export function selectRows(rows: Row[], selection: Selection): Row[] {
    const result = rows.filter(selection.filter)
    if (selection.order.length) result.sort((left, right) => {
        for (const { field, direction } of selection.order) {
            const a = Object.hasOwn(left, field) ? left[field] : undefined
            const b = Object.hasOwn(right, field) ? right[field] : undefined
            const order = direction.endsWith('num')
                ? Number(a) - Number(b)
                : compare('<', a, b) ? -1 : compare('>', a, b) ? 1 : 0
            if (order) return direction.startsWith('desc') ? -order : order
        }
        return 0
    })
    if (!selection.limit) return result
    const [offset, count] = selection.limit
    return result.slice(offset, offset + count)
}
