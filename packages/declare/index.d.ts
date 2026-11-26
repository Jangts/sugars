/* 描述原型类工厂的调用重载，包括可选的类名、父构造器与多段成员定义。 */

interface DeclareInstance {
    /** 工厂创建实例后调用的初始化方法。 */
    _init(...args: any[]): void
    /** 供旧初始化调用使用的父级方法视图。 */
    _parent: Partial<DeclareInstance>
    /** 当前构造器声明的共享原型成员。 */
    _p: Record<string, unknown>
    /**
     * @param members - 要扩展到当前实例的字段。
     * @param strict - 为真时只更新当前值不为 undefined 的成员。
     * @returns 已扩展的当前实例。
     */
    _x(members: object, strict?: boolean): this
    /** @returns 根据旧复制规则建立的实例副本。 */
    _c(): object
}

type InitializerArgs<Members, Fallback extends unknown[]> = Members extends { _init: (...args: infer Args) => unknown }
    ? Args
    : Fallback

interface DeclaredClass<Instance extends object, Args extends unknown[]> {
    new (...args: Args): Instance
    (...args: Args): Instance
    readonly prototype: Instance
    readonly name?: string
    readonly displayName?: string
}

type BaseClass<Instance extends object, Args extends unknown[]> = abstract new (...args: Args) => Instance
type MergeMembers<Blocks extends object[], Result extends object = object> =
    Blocks extends [infer First extends object, ...infer Rest extends object[]]
        ? MergeMembers<Rest, Omit<Result, keyof First> & First>
        : Result
type InstanceOf<Blocks extends object[], Base extends object> =
    Omit<Base, keyof MergeMembers<Blocks> | '_parent'> & MergeMembers<Blocks> & DeclareInstance & { _parent: Base }
type MemberBlocks<Blocks extends object[], Base extends object> = {
    [Index in keyof Blocks]: Blocks[Index] & ThisType<InstanceOf<Blocks, Base>>
}

/** 通过可选类名、父构造器和一个或多个成员段创建构造器。成员在声明顺序靠后的定义覆盖靠前项。 */
interface Declare {
    <Base extends object, Args extends unknown[], Blocks extends object[]>(
        base: BaseClass<Base, Args>,
        ...members: MemberBlocks<Blocks, Base>
    ): DeclaredClass<InstanceOf<Blocks, Base>, InitializerArgs<MergeMembers<Blocks>, Args>>
    <Base extends object, Args extends unknown[], Blocks extends object[]>(
        name: string,
        base: BaseClass<Base, Args>,
        ...members: MemberBlocks<Blocks, Base>
    ): DeclaredClass<InstanceOf<Blocks, Base>, InitializerArgs<MergeMembers<Blocks>, Args>>
    <Blocks extends object[]>(
        ...members: MemberBlocks<Blocks, object>
    ): DeclaredClass<InstanceOf<Blocks, object>, InitializerArgs<MergeMembers<Blocks>, unknown[]>>
    <Blocks extends object[]>(
        name: string,
        ...members: MemberBlocks<Blocks, object>
    ): DeclaredClass<InstanceOf<Blocks, object>, InitializerArgs<MergeMembers<Blocks>, unknown[]>>
    readonly declare: Declare
    readonly declareClass: Declare
}

declare const declare: Declare

export = declare
