'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'
import { formatCurrency } from '@/lib/utils'

interface PagoFormData {
  pago_id: string
  monto_pagado: number
  metodo_pago: string
  notas: string
}

interface VentaPlazo {
  id: string
  monto_total: number
  pagos_plazos: Array<{
    id: string
    numero_pago: number
    monto: number
    monto_pagado: number
    estado: string
    fecha_vencimiento: string
    fecha_pago?: string | null
  }>
}

export default function PagoForm({
  ventaPlazo,
  onClose,
  onSuccess,
}: {
  ventaPlazo: VentaPlazo
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
    watch,
    setValue,
  } = useForm<PagoFormData>({
    defaultValues: {
      metodo_pago: 'Efectivo',
    },
  })

  const pagoId = watch('pago_id')
  const montoPagado = watch('monto_pagado')

  const pagoSeleccionado = ventaPlazo.pagos_plazos?.find(p => p.id === pagoId)
  const montoPendiente = pagoSeleccionado
    ? Number(pagoSeleccionado.monto) - Number(pagoSeleccionado.monto_pagado)
    : 0

  useEffect(() => {
    if (pagoSeleccionado && montoPendiente > 0) {
      setValue('monto_pagado', montoPendiente)
    }
  }, [pagoId, pagoSeleccionado, montoPendiente, setValue])

  async function onSubmit(data: PagoFormData) {
    setLoading(true)
    try {
      const pago = ventaPlazo.pagos_plazos?.find(p => p.id === data.pago_id)
      if (!pago) throw new Error('Pago no encontrado')

      const nuevoMontoPagado = Number(pago.monto_pagado) + Number(data.monto_pagado)
      const montoTotal = Number(pago.monto)

      if (nuevoMontoPagado > montoTotal) {
        toast.error(`El monto pagado no puede exceder ${formatCurrency(montoTotal)}`)
        setLoading(false)
        return
      }

      let nuevoEstado = 'parcial'
      if (nuevoMontoPagado >= montoTotal) {
        nuevoEstado = 'pagado'
      } else if (nuevoMontoPagado > 0) {
        nuevoEstado = 'parcial'
      }

      const updateData: any = {
        monto_pagado: nuevoMontoPagado,
        estado: nuevoEstado,
        metodo_pago: data.metodo_pago || null,
        notas: data.notas || null,
      }

      if (nuevoEstado === 'pagado' && !pago.fecha_pago) {
        updateData.fecha_pago = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('pagos_plazos')
        .update(updateData)
        .eq('id', data.pago_id)

      if (error) throw error

      setShowSuccess(true)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const pagosPendientes = ventaPlazo.pagos_plazos?.filter(
    p => p.estado !== 'pagado'
  ) || []

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message="Pago registrado exitosamente"
          icon="💰"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white to-indigo-50 px-6 py-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Registrar Pago
            </h3>
            <CloseButton onClick={handleClose} size="md" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Pago *
              </label>
              <select
                {...register('pago_id', { required: 'Selecciona un pago' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecciona un pago</option>
                {pagosPendientes.map((pago) => {
                  const pendiente = Number(pago.monto) - Number(pago.monto_pagado)
                  return (
                    <option key={pago.id} value={pago.id}>
                      Pago #{pago.numero_pago} - Pendiente: {formatCurrency(pendiente)} / Total: {formatCurrency(pago.monto)}
                    </option>
                  )
                })}
              </select>
              {errors.pago_id && (
                <p className="text-red-500 text-sm mt-1">{errors.pago_id.message}</p>
              )}
            </div>

            {pagoSeleccionado && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto Total del Pago:</span>
                    <span className="font-semibold">{formatCurrency(pagoSeleccionado.monto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ya Pagado:</span>
                    <span className="font-semibold">{formatCurrency(pagoSeleccionado.monto_pagado)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-gray-700 font-medium">Pendiente:</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(montoPendiente)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a Pagar *
              </label>
              <input
                {...register('monto_pagado', {
                  required: 'El monto es requerido',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                  max: { value: montoPendiente, message: `No puede exceder ${formatCurrency(montoPendiente)}` },
                })}
                type="number"
                step="0.01"
                max={montoPendiente}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.monto_pagado && (
                <p className="text-red-500 text-sm mt-1">{errors.monto_pagado.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                {...register('metodo_pago')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                {...register('notas')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Notas sobre este pago..."
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
                disabled={loading || !pagoSeleccionado}
                className="flex-1 btn-success"
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

