export interface AnimationFrame {
    readonly scene: number
    readonly frame: number
    readonly lastFrame: number
    readonly iteration: number
    readonly elapsed: number
    readonly progress: number
}

type FrameCallback = (frame: AnimationFrame) => void

export interface AnimationScene {
    /** Scene duration in milliseconds. */
    duration: number
    render: FrameCallback
    onComplete?: FrameCallback
}

export interface AnimationClock {
    now(): number
    request(callback: (timestamp: number) => void): number
    cancel(handle: number): void
}

export interface AnimationOptions {
    fps?: number
    iterations?: number
    onComplete?: FrameCallback
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

    stop(): this {
        this.playback++
        this.running = false
        if (this.frameRequest !== undefined) {
            this.clock.cancel(this.frameRequest)
            this.frameRequest = undefined
        }
        return this
    }

    gotoAndPlay(scene: number, frame = 0): this {
        this.seek(scene, frame)
        return this.play()
    }

    gotoAndStop(scene: number, frame = 0): this {
        this.seek(scene, frame)
        this.notify(this.scenes[scene]!.render)
        return this
    }

    next(): this {
        return this.gotoAndStop(this.current.scene, this.current.frame + 1)
    }

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
