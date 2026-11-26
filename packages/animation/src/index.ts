/**
 * `@sugars/animation` 的公开入口。
 *
 * 按场景与帧推进时间轴。播放器管理定位、循环和完成通知，渲染交给场景回调，时钟可由调用方提供。
 * `Animation` 负责定位、播放与结束通知，`AnimationScene`、`AnimationFrame` 和 `AnimationClock` 约定调用方的渲染和计时接口。
 */

/** 一次渲染对应的只读位置。场景、帧和循环轮次从零开始，进度为 0 到 1。 */
export interface AnimationFrame {
    /** 场景在构造时传入序列里的从零索引。 */
    readonly scene: number
    /** 场景内从 0 到 lastFrame 的帧号，两个端点均可定位。 */
    readonly frame: number
    /** 场景时长乘以目标帧率后向上取整得到的末帧号。 */
    readonly lastFrame: number
    /** 从零计数的完整播放轮次。 */
    readonly iteration: number
    /** 当前帧在本场景的位置，单位为毫秒。 */
    readonly elapsed: number
    /** frame 与 lastFrame 的比值，范围为 0 到 1。 */
    readonly progress: number
}

type FrameCallback = (frame: AnimationFrame) => void

/** 以毫秒描述一个场景，并提供其渲染与完成回调。 */
export interface AnimationScene {
    /** 场景时长，单位为毫秒。 */
    duration: number
    /** 初始位置与后续帧均交给此回调绘制。 */
    render: FrameCallback
    /** 播放到当前场景的末帧后调用。 */
    onComplete?: FrameCallback
}

/** 时钟的 now() 和帧回调时间戳须采用同一时间基准。 */
export interface AnimationClock {
    now(): number
    request(callback: (timestamp: number) => void): number
    cancel(handle: number): void
}

export interface AnimationOptions {
    /** 场景每秒帧数，默认 36。RAF 间隔长时仍可能跳帧。 */
    fps?: number
    /** 播放完整场景序列的次数，默认 1。Infinity 表示持续循环。 */
    iterations?: number
    /** 完成全部轮次后调用，参数为最终场景末帧位置。 */
    onComplete?: FrameCallback
    /** 提供调度、取消和统一时间基准。缺省使用浏览器的 RAF 时钟。 */
    clock?: AnimationClock
}

interface Scene extends AnimationScene {
    lastFrame: number
}

const browserClock: AnimationClock = {
    now: () => performance.now(),
    request: callback => requestAnimationFrame(callback),
    cancel: handle => cancelAnimationFrame(handle),
}

export class Animation {
    private readonly scenes: Scene[]
    private readonly iterations: number
    private readonly clock: AnimationClock
    private readonly onComplete: FrameCallback | undefined
    private current: AnimationFrame
    private frameRequest: number | undefined
    private startTime = 0
    private playback = 0
    private running = false
    private completed = false

    /**
     * 创建播放器，初始位置为第一个场景的第 0 帧。
     * @param scenes - 非空场景序列，时长须为正的有限毫秒数。
     * @param options - 控制帧率、播放轮次、时钟与完成回调。
     * @throws {RangeError} 场景、帧数、帧率或轮次无效。
     */
    constructor(scenes: readonly AnimationScene[], { fps = 36, iterations = 1, clock = browserClock, onComplete }: AnimationOptions = {}) {
        if (!Number.isFinite(fps) || fps <= 0) throw new RangeError('fps must be a positive finite number')
        if (iterations !== Infinity && (!Number.isSafeInteger(iterations) || iterations < 1)) {
            throw new RangeError('iterations must be a positive integer or Infinity')
        }
        if (scenes.length === 0) throw new RangeError('Animation requires at least one scene')
        this.scenes = Array.from(scenes, scene => {
            const { duration } = scene
            if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Scene duration must be a positive finite number')
            const lastFrame = Math.ceil(duration * (fps / 1000))
            if (!Number.isSafeInteger(lastFrame) || lastFrame < 1) throw new RangeError('Invalid scene duration or frame count')
            return { ...scene, lastFrame }
        })
        this.iterations = iterations
        this.clock = clock
        this.onComplete = onComplete
        this.current = this.makeFrame(0, 0, 0)
    }

    get position(): AnimationFrame {
        return this.current
    }

    get playing(): boolean {
        return this.running
    }

    /**
     * 从当前场景和帧恢复。完整播放结束后再次调用会回到起点。
     *
     * @returns 当前播放器，供连续调用。回调异常会向调用方传播。
     */
    play(): this {
        if (this.running) return this
        if (this.completed) {
            this.current = this.makeFrame(0, 0, 0)
            this.completed = false
        }
        const playback = ++this.playback
        this.startTime = this.clock.now() - this.current.elapsed
        this.running = true
        this.notify(this.scenes[this.current.scene]!.render)
        this.schedule(playback)
        return this
    }

    /**
     * 取消已排队的帧并保留当前播放位置。
     *
     * @returns 保留当前播放位置的播放器。
     */
    stop(): this {
        this.playback++
        this.running = false
        if (this.frameRequest !== undefined) {
            this.clock.cancel(this.frameRequest)
            this.frameRequest = undefined
        }
        return this
    }

    /**
     * 定位到指定场景后开始播放，越界帧号按该场景的首末帧收敛。
     *
     * @param scene - 从零计数的场景索引。
     * @param frame - 场景内的位置，默认 0。
     * @returns 当前播放器。
     * @throws {RangeError} 场景不存在或帧值非有限。
     */
    gotoAndPlay(scene: number, frame = 0): this {
        this.seek(scene, frame)
        return this.play()
    }

    /**
     * 定位后同步渲染一次，不触发场景完成通知。
     *
     * @param scene - 从零计数的场景索引。
     * @param frame - 要同步渲染的帧，默认 0。
     * @returns 已停止于目标位置的当前播放器。
     * @throws {RangeError} 场景不存在或帧值非有限。
     */
    gotoAndStop(scene: number, frame = 0): this {
        this.seek(scene, frame)
        this.notify(this.scenes[scene]!.render)
        return this
    }

    /**
     * 在当前场景内前进一帧并停止，末帧之后仍停在末帧。
     * @returns 当前播放器。
     */
    next(): this {
        return this.gotoAndStop(this.current.scene, this.current.frame + 1)
    }

    /**
     * 在当前场景内后退一帧并停止，第 0 帧之前仍停在起点。
     * @returns 当前播放器。
     */
    prev(): this {
        return this.gotoAndStop(this.current.scene, this.current.frame - 1)
    }

    private seek(scene: number, frame: number): void {
        const position = this.makeFrame(scene, frame, this.completed ? 0 : this.current.iteration)
        this.stop()
        this.completed = false
        this.current = position
    }

    private makeFrame(sceneIndex: number, frame: number, iteration: number): AnimationFrame {
        const scene = this.scenes[sceneIndex]
        if (!Number.isInteger(sceneIndex) || !scene) throw new RangeError(`Unknown scene: ${sceneIndex}`)
        if (!Number.isFinite(frame)) throw new RangeError('Frame must be finite')
        const index = Math.max(0, Math.min(scene.lastFrame, Math.trunc(frame)))
        const progress = index / scene.lastFrame
        return Object.freeze({ scene: sceneIndex, frame: index, lastFrame: scene.lastFrame, iteration, elapsed: progress * scene.duration, progress })
    }

    private notify(callback?: FrameCallback): void {
        const playback = this.playback
        try {
            callback?.(this.current)
        } catch (error) {
            if (this.playback === playback) this.stop()
            throw error
        }
    }

    /** 渲染与完成回调可能重入并定位或停止。用播放序号阻止旧回调继续调度。 */
    private isPlaying(playback: number): boolean {
        return this.running && playback === this.playback
    }

    private schedule(playback: number): void {
        if (!this.isPlaying(playback)) return
        try {
            this.frameRequest = this.clock.request(timestamp => this.tick(timestamp, playback))
        } catch (error) {
            this.stop()
            throw error
        }
    }

    /** RAF 间隔长时可跳过中间帧，仍会先绘制末帧再通知场景完成。 */
    private tick(timestamp: number, playback: number): void {
        if (!this.isPlaying(playback)) return
        this.frameRequest = undefined
        const { scene: sceneIndex, iteration } = this.current
        const scene = this.scenes[sceneIndex]!
        const elapsed = Math.max(0, timestamp - this.startTime)
        const frame = elapsed >= scene.duration
            ? scene.lastFrame
            : Math.max(this.current.frame, Math.floor(elapsed / scene.duration * scene.lastFrame))
        if (frame !== this.current.frame) {
            this.current = this.makeFrame(sceneIndex, frame, iteration)
            this.notify(scene.render)
        }

        if (!this.isPlaying(playback)) return
        if (frame === scene.lastFrame) this.advance(timestamp, playback)
        this.schedule(playback)
    }

    private advance(timestamp: number, playback: number): void {
        const { scene, iteration } = this.current
        this.notify(this.scenes[scene]!.onComplete)
        if (!this.isPlaying(playback)) return

        const nextScene = (scene + 1) % this.scenes.length
        const nextIteration = nextScene === 0 ? iteration + 1 : iteration
        if (nextIteration === this.iterations) {
            this.running = false
            this.completed = true
            this.notify(this.onComplete)
            return
        }
        this.startTime = timestamp
        this.current = this.makeFrame(nextScene, 0, nextIteration)
        this.notify(this.scenes[nextScene]!.render)
    }
}
