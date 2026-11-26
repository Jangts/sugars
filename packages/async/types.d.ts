/* AMD 与旧式 Promise 的共享类型。脚本加载、模块执行和 Promise 通知各有独立合同。 */

export interface AmdPackage {
    /** 包的模块 ID 前缀，用于解析包根的简写请求。 */
    name: string
    /** 包脚本的位置，由加载器作为同名前缀路径登记。 */
    location?: string
    /** 加载包名时使用的入口，默认 main，可带 .js。 */
    main?: string
}

export interface AmdConfig {
    /** 相对脚本地址的基址，默认以当前页面为基准。 */
    baseUrl?: string
    /** 基址的历史别名，同时提供时优先使用 baseUrl。 */
    mainUrl?: string
    /**
     * 单个脚本实际开始加载后允许等待的最长时间。
     * 单位为毫秒。默认 15000，须介于 1 与 2147483647 之间。
     */
    timeoutMs?: number
    /** 模块 ID 前缀到脚本路径的映射，较具体的前缀先匹配。 */
    paths?: Readonly<Record<string, string>>
    /** 包配置清单。字符串使用默认位置和入口文件名。 */
    packages?: readonly (AmdPackage | string)[]
}

export interface AmdOptions extends AmdConfig {
    /** 脚本加载和相对地址解析所用文档，默认尝试当前环境的 document。 */
    document?: Document
}

export interface AmdModule {
    /** 加载器内部规范化的模块标识。 */
    readonly id: string
    /** 通过 script 加载时的实际 URL，无外部脚本时可省略。 */
    readonly uri?: string
    /** 初始为空对象。工厂可写入属性或替换该值。 */
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
    /**
     * 同步读取可执行模块。
     * @param id - 规范化前的模块 ID，模块内部调用可用相对 ID。
     * @returns 模块导出。
     * @throws 模块未定义、依赖未就绪或工厂执行失败。
     */
    <Value = unknown>(id: string): Value
    /**
     * 按依赖顺序提供导出，回调在后续任务执行。
     * @param dependencies - 希望加载的模块 ID。
     * @param onLoad - 成功时以依赖顺序收到导出。
     * @param onError - 获取或执行模块失败时接收错误。
     */
    <Values extends unknown[] = unknown[]>(
        dependencies: readonly string[],
        onLoad?: (...modules: Values) => void,
        onError?: (error: unknown) => void,
    ): void
    /**
     * @param options - 加到当前加载器的配置。
     * @returns 当前 require 函数。
     * @throws {RangeError} 超时超出允许的毫秒范围。
     */
    config(options?: AmdConfig): AmdRequire
}

export interface AmdLoader {
    define: AmdDefine
    require: AmdRequire
    /**
     * @param target - 接收 define 与 require 的对象，默认全局对象。
     * @returns 恢复临时接管名称的函数。
     */
    installGlobals(target?: object): () => void
}

export type PromiseStatus = 'pending' | 'resolved' | 'rejected'

export type PromiseExecutor<Value, Reason = unknown> = (
    resolve: (value: Value) => void,
    reject: (reason: Reason) => void,
) => void

type Callback<Value, Reason, Argument> = (this: LegacyPromiseInstance<Value, Reason>, value: Argument) => unknown

export interface LegacyPromiseInstance<Value = unknown, Reason = unknown> {
    /** 实例的当前结算状态，初始为 pending。 */
    PromiseStatus: PromiseStatus
    /** 结算时提交的原值或错误，等待期间为 undefined。 */
    PromiseValue: Value | Reason | undefined
    /**
     * 以同步通知机制接续旧式 Promise。
     * @param onResolved - 成功时接收原结果。
     * @param onRejected - 失败时接收原原因。
     * @returns 新实例。处理器正常返回时传递原结算值，处理器异常时以异常拒绝。
     */
    then(
        onResolved?: Callback<Value, Reason, Value> | null,
        onRejected?: Callback<Value, Reason, Reason> | null,
    ): LegacyPromiseInstance<Value | Reason>
    /**
     * 只订阅成功结算。
     * @param callback - 成功时以原结果通知。已有结果时在登记期间执行。
     */
    done(callback: Callback<Value, Reason, Value>): void
    /**
     * @param onRejected - 原实例失败时调用。
     * @returns 沿用 then(null, onRejected) 的旧链式结果。
     */
    catch(onRejected: Callback<Value, Reason, Reason>): LegacyPromiseInstance<Value | Reason>
}

type Input<Value> = Value | PromiseLike<Value> | LegacyPromiseInstance<Value>

export interface LegacyPromiseConstructor {
    new <Value = unknown, Reason = unknown>(executor?: PromiseExecutor<Value, Reason>): LegacyPromiseInstance<Value, Reason>
    <Value = unknown, Reason = unknown>(executor?: PromiseExecutor<Value, Reason>): LegacyPromiseInstance<Value, Reason>
    /**
     * @param values - 普通值、旧式 Promise 或 thenable。
     * @returns 按输入位置保存所有结果的实例，任一拒绝时拒绝。
     */
    all<Value>(values: readonly Input<Value>[]): LegacyPromiseInstance<Value[]>
    /**
     * @param values - 参与竞争的值或 thenable。
     * @returns 随第一个结算输入结算的实例，空输入保持等待。
     */
    race<Value>(values: readonly Input<Value>[]): LegacyPromiseInstance<Value>
    /**
     * @param executors - 按顺序启动的执行器。
     * @returns 按执行顺序保存结果的实例，一个失败后停止继续启动。
     */
    oneByOne<Value>(executors: readonly PromiseExecutor<Value>[]): LegacyPromiseInstance<Value[]>
}
