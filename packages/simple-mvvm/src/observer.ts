type Field<T> = Extract<keyof T, string | number>

export type ObserverCallback<T extends object, K extends Field<T> = Field<T>> =
    (this: T, value: T[K], property: K) => void

interface Subscription {
    subscribe(subscriber: Subscriber): void
    onread(): void
    onwrite(silently: boolean): void
}

// TangramJS src/obj/Observer/Subscriber.js
class Subscriber {
    #listeners = new Set<Subscription>()

    watch(listener: Subscription): () => void {
        this.#listeners.add(listener)
        return () => this.#listeners.delete(listener)
    }

    notify(isWriting: boolean, silentlyWriting: boolean): void {
        for (const listener of [...this.#listeners]) {
            if (isWriting) listener.onwrite(silentlyWriting)
            else listener.onread()
        }
    }
}

// TangramJS src/obj/Observer/Listener.js
export class Listener<T extends object, K extends Field<T> = Field<T>> {
    readonly data: T
    value: T[K]
    #unwatch?: () => void
    #reading = false

    constructor(
        readonly observer: Observer<T>,
        readonly property: K,
        readonly writeCallback?: ObserverCallback<T, K> | null,
        readonly readCallback?: ObserverCallback<T, K> | null,
    ) {
        this.data = observer.data
        const previous = observer.listener
        observer.listener = this
        try {
            this.value = this.data[property]
        } finally {
            observer.listener = previous
        }
    }

    subscribe(subscriber: Subscriber): void {
        this.#unwatch = subscriber.watch(this)
    }

    onread(): void {
        if (!this.#unwatch || !this.readCallback || this.#reading) return
        this.#reading = true
        try {
            this.readCallback.call(this.data, this.value, this.property)
        } finally {
            this.#reading = false
        }
    }

    onwrite(silently: boolean): void {
        if (!this.#unwatch) return
        const previous = this.observer.silently
        this.observer.silently = true
        let value: T[K]
        try {
            value = this.data[this.property]
        } finally {
            this.observer.silently = previous
        }
        if (value !== this.value) {
            this.value = value
            if (!silently) this.writeCallback?.call(this.data, value, this.property)
        }
    }

    disconnect(): void {
        this.#unwatch?.()
        this.#unwatch = undefined
    }
}

// TangramJS src/obj/Observer/Observer.js
const observers = new WeakMap<object, object>()

export function observe<T extends object>(data: T): Observer<T>
export function observe(data: unknown): Observer<object> | false
export function observe(data: unknown): Observer<object> | false {
    return data && typeof data === 'object' ? new Observer(data) : false
}

export class Observer<T extends object> {
    static create = observe
    static Listener = Listener
    static Subscriber = Subscriber

    readonly data: T
    listener: Subscription | null = null
    silently = false
    #observedFields = new Set<string>()

    constructor(data: T) {
        this.data = data
        const existing = observers.get(data)
        if (existing) return existing as Observer<T>
        observers.set(data, this)
        this.walk(data)
        if (!Object.hasOwn(data, '_observer') && Object.isExtensible(data)) {
            Object.defineProperty(data, '_observer', { value: this, configurable: true })
        }
    }

    walk(data: T = this.data): void {
        if (data !== this.data) return
        for (const key of Object.keys(data) as Field<T>[]) {
            if (this.#observedFields.has(String(key))) continue
            const descriptor = Object.getOwnPropertyDescriptor(data, key)
            if (!descriptor?.configurable || !descriptor.writable) continue
            this.#activeListen(key, data[key])
            this.#observedFields.add(String(key))
        }
    }

    #activeListen<K extends Field<T>>(key: K, val: T[K]): void {
        const subscriber = new Subscriber()
        observe(val)
        Object.defineProperty(this.data, key, {
            enumerable: true,
            configurable: true,
            get: () => {
                if (this.listener) {
                    this.listener.subscribe(subscriber)
                } else if (!this.silently) {
                    subscriber.notify(false, false)
                }
                return val
            },
            set: (value: T[K]) => {
                if (value === val) return
                val = value
                observe(value)
                subscriber.notify(true, this.silently)
            },
        })
    }

    listen<K extends Field<T>>(
        property: K,
        writeCallback?: ObserverCallback<T, K> | null,
        readCallback?: ObserverCallback<T, K> | null,
    ): Listener<T, K> | undefined
    listen(writeCallback: ObserverCallback<T>, readCallback?: ObserverCallback<T> | null): void
    listen<K extends Field<T>>(
        property: K | ObserverCallback<T>,
        writeCallback?: ObserverCallback<T, K> | null,
        readCallback?: ObserverCallback<T, K> | null,
    ): Listener<T, K> | undefined {
        if (typeof property === 'function') {
            for (const key of this.#observedFields) {
                new Listener(this, key as Field<T>, property, writeCallback as ObserverCallback<T> | null)
            }
        } else if (this.#observedFields.has(String(property))) {
            return new Listener(this, property, writeCallback, readCallback)
        }
    }

    on<K extends Field<T>>(eventType: 'read' | 'write', property: K, callback: ObserverCallback<T, K>): Listener<T, K> | undefined {
        if (eventType === 'read') return this.listen(property, null, callback)
        if (eventType === 'write') return this.listen(property, callback)
    }
}
