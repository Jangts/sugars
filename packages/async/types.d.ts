export interface AmdPackage {
    name: string
    location?: string
    main?: string
}

export interface AmdConfig {
    baseUrl?: string
    mainUrl?: string
    paths?: Readonly<Record<string, string>>
    packages?: readonly (AmdPackage | string)[]
}

export interface AmdOptions extends AmdConfig {
    document?: Document
}

export interface AmdModule {
    readonly id: string
    readonly uri?: string
    exports: unknown
}

export type AmdFactory<Values extends unknown[] = any[]> = (this: AmdModule, ...dependencies: Values) => unknown

export interface AmdDefine {
    (factory: AmdFactory): void
    (value: unknown): void
    <Values extends unknown[]>(dependencies: readonly string[], factory: AmdFactory<Values>): void
    (dependencies: readonly string[], value: unknown): void
    (id: string, factory: AmdFactory): void
    (id: string, value: unknown): void
    <Values extends unknown[]>(id: string, dependencies: readonly string[], factory: AmdFactory<Values>): void
    (id: string, dependencies: readonly string[], value: unknown): void
    readonly amd: Readonly<Record<string, never>>
}

export interface AmdRequire {
    <Value = unknown>(id: string): Value
    <Values extends unknown[] = unknown[]>(
        dependencies: readonly string[],
        onLoad?: (...modules: Values) => void,
        onError?: (error: unknown) => void,
    ): void
    config(options?: AmdConfig): AmdRequire
}

export interface AmdLoader {
    define: AmdDefine
    require: AmdRequire
    installGlobals(target?: object): () => void
}

export type PromiseStatus = 'pending' | 'resolved' | 'rejected'

export type PromiseExecutor<Value, Reason = unknown> = (
    resolve: (value: Value) => void,
    reject: (reason: Reason) => void,
) => void

type Callback<Value, Reason, Argument> = (this: LegacyPromiseInstance<Value, Reason>, value: Argument) => unknown

export interface LegacyPromiseInstance<Value = unknown, Reason = unknown> {
    PromiseStatus: PromiseStatus
    PromiseValue: Value | Reason | undefined
    then(
        onResolved?: Callback<Value, Reason, Value> | null,
        onRejected?: Callback<Value, Reason, Reason> | null,
    ): LegacyPromiseInstance<Value | Reason>
    done(callback: Callback<Value, Reason, Value>): void
    catch(onRejected: Callback<Value, Reason, Reason>): LegacyPromiseInstance<Value | Reason>
}

type Input<Value> = Value | PromiseLike<Value> | LegacyPromiseInstance<Value>

export interface LegacyPromiseConstructor {
    new <Value = unknown, Reason = unknown>(executor?: PromiseExecutor<Value, Reason>): LegacyPromiseInstance<Value, Reason>
    <Value = unknown, Reason = unknown>(executor?: PromiseExecutor<Value, Reason>): LegacyPromiseInstance<Value, Reason>
    all<Value>(values: readonly Input<Value>[]): LegacyPromiseInstance<Value[]>
    race<Value>(values: readonly Input<Value>[]): LegacyPromiseInstance<Value>
    oneByOne<Value>(executors: readonly PromiseExecutor<Value>[]): LegacyPromiseInstance<Value[]>
}
