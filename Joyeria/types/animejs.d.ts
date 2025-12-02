declare module 'animejs' {
  export interface AnimeParams {
    targets?: any
    duration?: number
    delay?: number | ((el: any, i: number) => number) | number[]
    endDelay?: number
    elasticity?: number
    round?: number | boolean
    loop?: number | boolean
    autoplay?: boolean
    direction?: 'normal' | 'reverse' | 'alternate'
    easing?: string | ((el: number) => number)
    [key: string]: any
  }
  
  export interface AnimeInstance {
    play: () => void
    pause: () => void
    restart: () => void
    reverse: () => void
    seek: (time: number) => void
    tick: (t: number) => void
    begin?: (anim: any) => void
    update?: (anim: any) => void
    complete?: (anim: any) => void
  }

  function anime(params: AnimeParams): AnimeInstance
  export default anime
  export { anime }
}
