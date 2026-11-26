import type { Swiper, SwiperPreset } from './index.js'

export type PresetName = 'slide' | 'slide-vert' | 'seamless' | 'seamless-vert' | 'colx3' | 'colx3-vert' | 'fade'

// TangramJS src/see/Slider/options/{slide,seamless,colx3}[-vert].js.
function trackPreset(vertical: boolean, clones: number, duration?: number): SwiperPreset {
    const axis = vertical ? 'top' : 'left'
    const size = vertical ? 'height' : 'width'
    const breadth = vertical ? 'width' : 'height'
    const position = (index: number) => -(index + (clones ? 1 : 0)) * 100 + '%'
    return {
        axis: vertical ? 'vertical' : 'horizontal',
        clones,
        duration,
        easing: clones === 3 ? 'easeInOutBack' : 'linear',
        layout() {
            const count = this.actors.length
            const power = count + count % 2
            const { style } = this.troupe
            style[size] = 100 * power + '%'
            style[breadth] = '100%'
            style.position = 'absolute'
            style[axis] = position(this.curr)
            style[vertical ? 'left' : 'top'] = '0'
            style.display = 'flex'
            style.flexDirection = vertical ? 'column' : 'row'
            for (const actor of this.actors) {
                actor.style[size] = 100 / power + '%'
                actor.style[breadth] = '100%'
                actor.style.flex = 'none'
            }
            for (const stage of this.stages) {
                stage.style.position ||= 'relative'
                if (clones !== 3) stage.style.overflow ||= 'hidden'
            }
        },
        cut(target, from, requested) {
            const { style } = this.troupe
            if (clones && this.loop && requested === -1 && from === 0) {
                style.transition = 'none'
                style[axis] = position(this.actorsNum)
                void this.troupe.offsetWidth
            } else if (clones && this.loop && requested === this.actorsNum && from === this.actorsNum - 1) {
                style.transition = 'none'
                style[axis] = position(-1)
                void this.troupe.offsetWidth
            }
            style.transition = axis + ' ' + this.duration + 'ms ' + this.easing
            style[axis] = position(target)
        },
    }
}

// TangramJS src/see/Slider/options/fade.js.
const fade: SwiperPreset = {
    duration: 800,
    easing: 'easeInOutQuart',
    layout() {
        this.troupe.style.position = 'relative'
        showActor(this, this.curr, 0)
    },
    cut(target) {
        showActor(this, target, this.duration)
    },
}

function showActor(swiper: Swiper, target: number, duration: number): void {
    for (const [index, actor] of swiper.actors.entries()) {
        const active = target === index
        Object.assign(actor.style, {
            position: 'absolute', width: '100%', inset: '0 auto auto 0',
            opacity: active ? '1' : '0', zIndex: active ? '100' : '0',
            transition: 'opacity ' + duration + 'ms ' + swiper.easing,
            pointerEvents: active ? '' : 'none',
        })
    }
}

export const presets: Record<PresetName, SwiperPreset> = {
    slide: trackPreset(false, 0),
    'slide-vert': trackPreset(true, 0, 400),
    seamless: trackPreset(false, 2),
    'seamless-vert': trackPreset(true, 2, 400),
    colx3: trackPreset(false, 3, 500),
    'colx3-vert': trackPreset(true, 3, 500),
    fade,
}
