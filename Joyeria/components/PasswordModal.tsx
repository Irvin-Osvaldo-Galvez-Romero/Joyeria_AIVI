'use client'

import { useState, useRef, useEffect } from 'react'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import CloseButton from './CloseButton'
import { animateModalIn, animateModalOut } from '@/lib/animations'

interface PasswordModalProps {
  onSuccess: () => void
  onClose: () => void
  correctPassword: string
  title?: string
  description?: string
}

export default function PasswordModal({
  onSuccess,
  onClose,
  correctPassword,
  title = 'Acceso Restringido',
  description = 'Ingresa la contraseña para acceder a esta sección',
}: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (modalRef.current) {
      animateModalIn(modalRef.current)
      // Focus en el input al abrir
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [])

  const handleClose = () => {
    if (modalRef.current) {
      animateModalOut(modalRef.current, onClose)
    } else {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simular verificación (en producción debería ser más seguro)
    setTimeout(() => {
      if (password === correctPassword) {
        toast.success('Acceso autorizado')
        setLoading(false)
        onSuccess()
        handleClose()
      } else {
        setError('Contraseña incorrecta')
        setPassword('')
        setLoading(false)
        toast.error('Contraseña incorrecta')
        inputRef.current?.focus()
      }
    }, 300)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-700">{title}</h3>
              <p className="text-sm text-red-600">{description}</p>
            </div>
          </div>
          <CloseButton onClick={handleClose} size="md" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-red-300 focus:ring-red-500'
              }`}
              placeholder="Ingresa la contraseña"
              required
              disabled={loading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

