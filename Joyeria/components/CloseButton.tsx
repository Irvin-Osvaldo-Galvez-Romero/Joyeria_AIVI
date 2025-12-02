'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'

interface CloseButtonProps {
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function CloseButton({ onClick, size = 'md', className = '' }: CloseButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutElastic(1, .6)',
      })
    }
  }, [])

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  }

  const handleClick = () => {
    if (buttonRef.current) {
      anime({
        targets: buttonRef.current,
        rotate: 90,
        scale: [1, 0.8, 1],
        duration: 300,
        easing: 'easeInOutQuad',
        complete: () => {
          onClick()
        },
      })
    } else {
      onClick()
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        ${className}
        flex items-center justify-center
        bg-gradient-to-br from-gray-100 to-gray-200
        hover:from-red-500 hover:to-red-600
        text-gray-700 hover:text-white
        rounded-full
        shadow-md hover:shadow-lg
        transition-all duration-300
        font-bold
        relative
        overflow-hidden
        group
      `}
      aria-label="Cerrar"
    >
      <span className="relative z-10">×</span>
      <span className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
    </button>
  )
}
