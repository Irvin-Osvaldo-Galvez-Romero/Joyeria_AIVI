'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'

interface GastoFormData {
  concepto: string
  monto: number
  categoria: string
  descripcion: string
  fecha_gasto: string
}

export default function GastoForm({
  gasto,
  onClose,
  onSuccess,
}: {
  gasto?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (modalRef.current) {
      animateModalIn(modalRef.current)
    }
  }, [])
  
  const handleClose = () => {
    if (modalRef.current) {
      animateModalOut(modalRef.current, onClose)
    } else {
      onClose()
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GastoFormData>({
    defaultValues: {
      concepto: gasto?.concepto || '',
      monto: gasto?.monto || 0,
      categoria: gasto?.categoria || '',
      descripcion: gasto?.descripcion || '',
      fecha_gasto: gasto?.fecha_gasto || new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: GastoFormData) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      const gastoData = {
        ...data,
        usuario_id: user.id,
      }

      if (gasto) {
        const { error } = await supabase
          .from('gastos')
          .update(gastoData)
          .eq('id', gasto.id)

        if (error) throw error
        setShowSuccess(true)
      } else {
        const { error } = await supabase.from('gastos').insert([gastoData])

        if (error) throw error
        setShowSuccess(true)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const categoriasComunes = [
    'Transporte',
    'Alimentación',
    'Suministros',
    'Mantenimiento',
    'Publicidad',
    'Servicios',
    'Otros',
  ]

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message={gasto ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente'}
          icon="📝"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white to-red-50 px-6 py-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              {gasto ? 'Editar Gasto' : 'Registrar Gasto'}
            </h3>
            <CloseButton onClick={handleClose} size="md" />
          </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              {...register('concepto', { required: 'El concepto es requerido' })}
              type="text"
              placeholder="Ej: Transporte, Suministros..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {errors.concepto && (
              <p className="text-red-500 text-sm mt-1">{errors.concepto.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto *
              </label>
              <input
                {...register('monto', {
                  required: 'El monto es requerido',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Debe ser mayor a 0' },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {errors.monto && (
                <p className="text-red-500 text-sm mt-1">{errors.monto.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                {...register('categoria')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Selecciona una categoría</option>
                {categoriasComunes.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Gasto
            </label>
            <input
              {...register('fecha_gasto', { required: 'La fecha es requerida' })}
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-danger"
            >
              {loading ? 'Guardando...' : gasto ? 'Actualizar' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
