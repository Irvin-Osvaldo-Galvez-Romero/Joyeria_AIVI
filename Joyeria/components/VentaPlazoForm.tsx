'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'
import { Search, X } from 'lucide-react'

interface VentaPlazoFormData {
  venta_id: string
  numero_pagos: number
  fecha_limite: string
  notas: string
}

export default function VentaPlazoForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [ventas, setVentas] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showVentaList, setShowVentaList] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  
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
  } = useForm<VentaPlazoFormData>({
    defaultValues: {
      numero_pagos: 3,
    },
  })

  const ventaId = watch('venta_id')
  const numeroPagos = watch('numero_pagos')
  const fechaLimite = watch('fecha_limite')

  useEffect(() => {
    loadVentas()
  }, [])

  async function loadVentas() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          precio_total,
          cliente,
          productos (
            nombre
          )
        `)
        .order('fecha_venta', { ascending: false })
        .limit(100)

      if (error) throw error
      setVentas(data || [])
    } catch (error: any) {
      toast.error('Error cargando ventas: ' + error.message)
    }
  }

  async function onSubmit(data: VentaPlazoFormData) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      // Obtener venta para calcular montos
      const venta = ventas.find(v => v.id === data.venta_id)
      if (!venta) throw new Error('Venta no encontrada')

      // Verificar que la venta no tenga ya un plan de pago
      const { data: existingPlazo } = await supabase
        .from('ventas_plazos')
        .select('id')
        .eq('venta_id', data.venta_id)
        .single()

      if (existingPlazo) {
        toast.error('Esta venta ya tiene un plan de pago a plazos')
        setLoading(false)
        return
      }

      const montoTotal = Number(venta.precio_total)
      const montoPorPago = montoTotal / data.numero_pagos

      // Crear venta_plazo
      const { data: ventaPlazo, error: ventaPlazoError } = await supabase
        .from('ventas_plazos')
        .insert([
          {
            venta_id: data.venta_id,
            numero_pagos: data.numero_pagos,
            monto_total: montoTotal,
            monto_por_pago: montoPorPago,
            fecha_limite: data.fecha_limite,
            notas: data.notas || null,
            usuario_id: user.id,
          },
        ])
        .select()
        .single()

      if (ventaPlazoError) throw ventaPlazoError

      // Crear pagos individuales
      const fechaInicio = new Date()
      const fechaLimiteDate = new Date(data.fecha_limite)
      const diasEntrePagos = Math.ceil((fechaLimiteDate.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) / data.numero_pagos

      const pagos = Array.from({ length: data.numero_pagos }, (_, i) => {
        const fechaVencimiento = new Date(fechaInicio)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + Math.ceil((i + 1) * diasEntrePagos))
        
        return {
          venta_plazo_id: ventaPlazo.id,
          numero_pago: i + 1,
          monto: montoPorPago,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          estado: 'pendiente',
        }
      })

      const { error: pagosError } = await supabase
        .from('pagos_plazos')
        .insert(pagos)

      if (pagosError) throw pagosError

      setShowSuccess(true)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const ventaSeleccionada = ventas.find(v => v.id === ventaId)
  const montoPorPago = ventaSeleccionada && numeroPagos > 0
    ? Number(ventaSeleccionada.precio_total) / numeroPagos
    : 0

  // Filtrar ventas por término de búsqueda
  const ventasFiltradas = ventas.filter(venta =>
    venta.productos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.precio_total.toString().includes(searchTerm)
  )

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowVentaList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message="Plan de pago a plazos creado exitosamente"
          icon="📅"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white to-indigo-50 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Nueva Venta a Plazos
            </h3>
            <CloseButton onClick={handleClose} size="md" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div ref={searchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venta *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar venta por producto, cliente o monto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowVentaList(true)
                  }}
                  onFocus={() => setShowVentaList(true)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setShowVentaList(false)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {showVentaList && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {ventasFiltradas.length > 0 ? (
                    ventasFiltradas.map((venta) => (
                      <button
                        key={venta.id}
                        type="button"
                        onClick={() => {
                          setValue('venta_id', venta.id)
                          setSearchTerm(`${venta.productos?.nombre || 'Producto'} - ${venta.cliente || 'Sin cliente'}`)
                          setShowVentaList(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{venta.productos?.nombre || 'Producto'}</div>
                        <div className="text-sm text-gray-600">
                          Cliente: {venta.cliente || 'Sin cliente'} • Total: ${Number(venta.precio_total).toFixed(2)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      No se encontraron ventas
                    </div>
                  )}
                </div>
              )}
              
              <input
                type="hidden"
                {...register('venta_id', { required: 'Selecciona una venta' })}
                value={ventaId || ''}
              />
              
              {ventaSeleccionada && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">{ventaSeleccionada.productos?.nombre || 'Producto'}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        Cliente: {ventaSeleccionada.cliente || 'Sin cliente'} • ${Number(ventaSeleccionada.precio_total).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('venta_id', '')
                        setSearchTerm('')
                        setShowVentaList(false)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
              
              {errors.venta_id && (
                <p className="text-red-500 text-sm mt-1">{errors.venta_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pagos *
              </label>
              <input
                {...register('numero_pagos', {
                  required: 'El número de pagos es requerido',
                  valueAsNumber: true,
                  min: { value: 2, message: 'Mínimo 2 pagos' },
                  max: { value: 24, message: 'Máximo 24 pagos' },
                })}
                type="number"
                min="2"
                max="24"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.numero_pagos && (
                <p className="text-red-500 text-sm mt-1">{errors.numero_pagos.message}</p>
              )}
            </div>

            {ventaSeleccionada && numeroPagos > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto Total:</span>
                    <span className="font-semibold">${Number(ventaSeleccionada.precio_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto por Pago:</span>
                    <span className="font-semibold text-indigo-600">${montoPorPago.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Límite (Último Pago) *
              </label>
              <input
                {...register('fecha_limite', {
                  required: 'La fecha límite es requerida',
                  validate: (value) => {
                    const fecha = new Date(value)
                    const hoy = new Date()
                    hoy.setHours(0, 0, 0, 0)
                    if (fecha <= hoy) {
                      return 'La fecha límite debe ser futura'
                    }
                    return true
                  },
                })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.fecha_limite && (
                <p className="text-red-500 text-sm mt-1">{errors.fecha_limite.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                {...register('notas')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Notas adicionales sobre este plan de pago..."
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
                className="flex-1 btn-success"
              >
                {loading ? 'Creando...' : 'Crear Plan de Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

