import anime from 'animejs'

/**
 * Animaciones elegantes para la aplicación usando Anime.js
 */

// Animación de entrada para modales
export function animateModalIn(element: HTMLElement | null) {
  if (!element) return
  
  anime({
    targets: element,
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 400,
    easing: 'easeOutElastic(1, .8)',
  })
}

// Animación de salida para modales
export function animateModalOut(element: HTMLElement | null, onComplete?: () => void) {
  if (!element) {
    onComplete?.()
    return
  }
  
  anime({
    targets: element,
    scale: [1, 0.8],
    opacity: [1, 0],
    duration: 300,
    easing: 'easeInQuad',
    complete: onComplete,
  })
}

// Animación de entrada para tarjetas
export function animateCardIn(element: HTMLElement | null, delay: number = 0) {
  if (!element) return
  
  anime({
    targets: element,
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 600,
    delay: delay,
    easing: 'easeOutExpo',
  })
}

// Animación de hover para botones
export function animateButtonHover(element: HTMLElement | null) {
  if (!element) return
  
  anime({
    targets: element,
    scale: [1, 1.05],
    duration: 200,
    easing: 'easeOutQuad',
  })
}

// Animación de salida para botones
export function animateButtonLeave(element: HTMLElement | null) {
  if (!element) return
  
  anime({
    targets: element,
    scale: [1.05, 1],
    duration: 200,
    easing: 'easeOutQuad',
  })
}

// Animación de entrada para formularios
export function animateFormIn(element: HTMLElement | null) {
  if (!element) return
  
  anime({
    targets: element.querySelectorAll('input, textarea, select, button'),
    translateX: [-20, 0],
    opacity: [0, 1],
    duration: 500,
    delay: anime.stagger(50),
    easing: 'easeOutExpo',
  })
}

// Animación de números contadores
export function animateCounter(element: HTMLElement | null, from: number, to: number) {
  if (!element) return
  
  anime({
    targets: { value: from },
    value: to,
    duration: 1500,
    easing: 'easeOutExpo',
    update: function(anim) {
      element.textContent = Math.floor(anim.animatables[0].target.value).toString()
    },
  })
}

// Animación de éxito (checkmark)
export function animateSuccess(element: HTMLElement | null) {
  if (!element) return
  
  anime({
    targets: element,
    scale: [0, 1.2, 1],
    rotate: [0, 360],
    duration: 600,
    easing: 'easeOutElastic(1, .8)',
  })
}

// Animación de entrada para la página
export function animatePageIn() {
  anime({
    targets: 'main, .card, .stat-card',
    translateY: [50, 0],
    opacity: [0, 1],
    duration: 800,
    delay: anime.stagger(100),
    easing: 'easeOutExpo',
  })
}
