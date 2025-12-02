'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'
import Logo from './Logo'

interface SuccessAnimationProps {
  message: string
  icon?: string
  onComplete?: () => void
}

export default function SuccessAnimation({ message, icon = '✅', onComplete }: SuccessAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Animación del contenedor
    anime({
      targets: containerRef.current,
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutElastic(1, .8)',
    })

    // Animación del logo
    if (logoRef.current) {
      anime({
        targets: logoRef.current,
        scale: [0, 1.2, 1],
        rotate: [0, 360],
        duration: 800,
        delay: 200,
        easing: 'easeOutElastic(1, .6)',
      })
    }

    // Animación del check/icono
    if (checkRef.current) {
      anime({
        targets: checkRef.current,
        scale: [0, 1.5, 1],
        rotate: [0, 360],
        duration: 600,
        delay: 400,
        easing: 'easeOutElastic(1, .8)',
      })
    }

    // Animación del mensaje
    if (messageRef.current) {
      anime({
        targets: messageRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 500,
        delay: 600,
        easing: 'easeOutExpo',
        complete: () => {
          // Después de la animación, esperar un poco y llamar al callback
          setTimeout(() => {
            if (containerRef.current) {
              anime({
                targets: containerRef.current,
                scale: [1, 0.9],
                opacity: [1, 0],
                duration: 400,
                easing: 'easeInQuad',
                complete: onComplete,
              })
            } else {
              onComplete?.()
            }
          }, 1500)
        },
      })
    }

    // Partículas de éxito
    if (containerRef.current) {
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div')
        particle.style.position = 'absolute'
        particle.style.width = '8px'
        particle.style.height = '8px'
        particle.style.borderRadius = '50%'
        particle.style.background = '#10b981'
        particle.style.left = '50%'
        particle.style.top = '50%'
        particle.style.opacity = '0'
        containerRef.current.appendChild(particle)

        const angle = (i / 12) * Math.PI * 2
        const distance = 100

        anime({
          targets: particle,
          translateX: [0, Math.cos(angle) * distance],
          translateY: [0, Math.sin(angle) * distance],
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          duration: 1000,
          delay: 500 + i * 50,
          easing: 'easeOutExpo',
        })
      }
    }
  }, [onComplete])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4 text-center relative overflow-hidden">
        {/* Efecto de brillo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 opacity-50"></div>
        
        <div className="relative z-10">
          {/* Logo animado */}
          <div ref={logoRef} className="mb-6 flex justify-center">
            <Logo size="lg" showText={false} />
          </div>

          {/* Icono de éxito */}
          <div ref={checkRef} className="text-6xl mb-4">
            {icon}
          </div>

          {/* Mensaje */}
          <div ref={messageRef} className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Éxito!
            </h3>
            <p className="text-lg text-gray-600">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
