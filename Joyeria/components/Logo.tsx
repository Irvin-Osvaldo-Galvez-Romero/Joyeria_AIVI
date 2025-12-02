'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  animate?: boolean
  continuousRotate?: boolean
  onPageChange?: boolean
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  className = '', 
  animate = false,
  continuousRotate = false,
  onPageChange = false
}: LogoProps) {
  const logoRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const flowerRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!animate || !logoRef.current) return

    // Animación de entrada del logo
    anime({
      targets: logoRef.current,
      scale: [0, 1.2, 1],
      rotate: [0, 360],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutElastic(1, .6)',
    })

    // Animación del texto
    if (textRef.current && showText) {
      anime({
        targets: textRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 600,
        easing: 'easeOutExpo',
      })
    }

    // Animación continua sutil del logo (pulso suave)
    if (logoRef.current && !continuousRotate) {
      anime({
        targets: logoRef.current,
        scale: [1, 1.05, 1],
        duration: 2000,
        delay: 1500,
        easing: 'easeInOutSine',
        loop: true,
      })
    }
  }, [animate, showText, continuousRotate])

  // Rotación continua de la flor
  useEffect(() => {
    if (continuousRotate && flowerRef.current) {
      let rotation = 0
      let lastTime = performance.now()
      const rotationSpeed = 0.02 // Grados por frame - velocidad más lenta y constante
      
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime
        lastTime = currentTime
        
        // Velocidad constante: ~15 segundos por vuelta completa (360 grados)
        // 360 grados / 15000 ms * deltaTime ms = velocidad constante
        rotation += (360 / 15000) * deltaTime
        
        if (rotation >= 360) {
          rotation = rotation - 360 // Mantener el valor bajo para precisión
        }
        
        flowerRef.current?.setAttribute('transform', `rotate(${rotation})`)
        requestAnimationFrame(animate)
      }
      
      const animationId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationId)
    }
  }, [continuousRotate])

  // Rotación al cambiar de página
  useEffect(() => {
    if (onPageChange && flowerRef.current) {
      let startTime: number | null = null
      const duration = 1000
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const rotation = progress * 360
        const ease = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2 // easeInOutQuad
        
        flowerRef.current?.setAttribute('transform', `rotate(${ease * 360})`)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [onPageChange])
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div ref={logoRef} className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {/* Fondo con gradiente */}
          <defs>
            <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c0c0c0" stopOpacity="1" />
              <stop offset="50%" stopColor="#e8e8e8" stopOpacity="1" />
              <stop offset="100%" stopColor="#a0a0a0" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="silverGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#808080" stopOpacity="1" />
              <stop offset="50%" stopColor="#c0c0c0" stopOpacity="1" />
              <stop offset="100%" stopColor="#606060" stopOpacity="1" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Círculo doble */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="url(#silverGradient)"
            strokeWidth="2"
            filter="url(#shadow)"
          />
          <circle
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="url(#silverGradientDark)"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />

          {/* Flor de loto - centrada y rotable */}
          <g transform="translate(100, 100)">
            <g 
              ref={flowerRef}
              transformOrigin="0 0"
            >
              {/* Pétalos exteriores */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <ellipse
                  key={`outer-${i}`}
                  cx="0"
                  cy="-45"
                  rx="20"
                  ry="35"
                  fill="url(#silverGradient)"
                  stroke="url(#silverGradientDark)"
                  strokeWidth="1"
                  transform={`rotate(${angle})`}
                  filter="url(#shadow)"
                />
              ))}
              
              {/* Pétalos medios */}
              {[30, 90, 150, 210, 270, 330].map((angle, i) => (
                <ellipse
                  key={`mid-${i}`}
                  cx="0"
                  cy="-35"
                  rx="18"
                  ry="28"
                  fill="url(#silverGradient)"
                  stroke="url(#silverGradientDark)"
                  strokeWidth="1"
                  transform={`rotate(${angle})`}
                  filter="url(#shadow)"
                />
              ))}

              {/* Pétalos internos - forma de corazón */}
              <path
                d="M 0,-25 Q -15,-15 -15,0 Q -15,10 0,15 Q 15,10 15,0 Q 15,-15 0,-25"
                fill="url(#silverGradientDark)"
                stroke="url(#silverGradient)"
                strokeWidth="1.5"
                filter="url(#shadow)"
              />

              {/* Diamante central */}
              <polygon
                points="0,-8 -6,0 0,8 6,0"
                fill="url(#silverGradient)"
                stroke="url(#silverGradientDark)"
                strokeWidth="1.5"
                filter="url(#shadow)"
              />
            </g>
          </g>

          {/* Estrella decorativa (esquina inferior derecha) */}
          <polygon
            points="170,170 175,160 180,170 190,175 180,180 175,190 170,180 160,175"
            fill="url(#silverGradient)"
            stroke="url(#silverGradientDark)"
            strokeWidth="1"
            opacity="0.7"
          />
        </svg>
      </div>

      {showText && (
        <div ref={textRef} className={`mt-2 text-center ${textSizes[size]}`}>
          <div 
            className="font-extrabold tracking-wider" 
            style={{
              color: '#1a202c',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(45, 55, 72, 0.5), 0 0 20px rgba(45, 55, 72, 0.3)',
              fontWeight: '900',
              letterSpacing: '0.15em',
              fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1rem' : '0.75rem',
            }}
          >
            AIVI
          </div>
          <div className="text-gray-500 font-medium text-xs mt-0.5">
            SILVER HOUSE
          </div>
        </div>
      )}
    </div>
  )
}
