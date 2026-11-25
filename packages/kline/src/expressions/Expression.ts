export class Expression {
    rid: number = 0

    execute(index: number): number { return 0 }

    reserve(rid: number, count: number): void { }

    clear(): void { }
}

export class ConstExpression extends Expression {
    value: number
    constructor(value: number) {
        super()
        this.value = value
    }

    execute(index: number): number {
        return this.value
    }
}

export class ParameterExpression extends Expression {
    name: string
    value: number
    minValue: number
    maxValue: number
    defaultValue: number

    constructor(name: string, minValue: number, maxValue: number, defaultValue: number) {
        super()
        this.name = name
        this.minValue = minValue
        this.maxValue = maxValue
        this.value = this.defaultValue = defaultValue
    }

    execute(index: number): number {
        return this.value
    }

    getMinValue(): number {
        return this.minValue
    }

    getMaxValue(): number {
        return this.maxValue
    }

    getDefaultValue(): number {
        return this.defaultValue
    }

    getValue(): number {
        return this.value
    }

    setValue(value: number): void {
        if (value === 0)
            this.value = 0
        else if (value < this.minValue)
            this.value = this.minValue
        else if (value > this.maxValue)
            this.value = this.maxValue
        else
            this.value = value
    }
}
