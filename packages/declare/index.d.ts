interface DeclareInstance {
    _init(...args: any[]): void
    _parent: Partial<DeclareInstance>
    _p: Record<string, unknown>
    _x(members: object, strict?: boolean): this
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
