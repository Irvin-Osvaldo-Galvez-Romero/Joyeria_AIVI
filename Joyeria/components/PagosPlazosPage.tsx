'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import VentaPlazoForm from './VentaPlazoForm'
import PagoForm from './PagoForm'

type EstadoVentaPlazo = 'pendiente' | 'en_proceso' | 'completado' | 'vencido' | 'cancelado'
type EstadoPago = 'pendiente' | 'pagado' | 'parcial' | 'vencido'

interface VentaPlazo {
  id: string
  venta_id: string
  numero_pagos: number
  monto_total: number
  monto_por_pago: number
  fecha_inicio: string
  fecha_limite: string
  estado: EstadoVentaPlazo
  notas: string | null
  ventas: {
    id: string
    cliente: string | null
    productos: {
      nombre: string
      imagen_url: string | null
    } | null
  } | null
  pagos_plazos: PagoPlazo[]
}

interface PagoPlazo {
  id: string
  numero_pago: number
  monto: number
  fecha_vencimiento: string
  fecha_pago: string | null
  monto_pagado: number
  estado: EstadoPago
  metodo_pago: string | null
}

export default function PagosPlazosPage() {
  const [ventasPlazos, setVentasPlazos] = useState<VentaPlazo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPagoForm, setShowPagoForm] = useState(false)
  const [selectedVentaPlazo, setSelectedVentaPlazo] = useState<VentaPlazo | null>(null)
  const [filterEstado, setFilterEstado] = useState<EstadoVentaPlazo | 'todos'>('todos')

  useEffect(() => {
    // Llamar loadVentasPlazos sin await (está bien, es fire-and-forget)
    void loadVentasPlazos().catch((error) => {
      console.error('Error en loadVentasPlazos:', error)
    })
    
    const subscription = supabase
      .channel('ventas-plazos-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_plazos' }, () => {
        void loadVentasPlazos().catch((error) => {
          console.error('Error en loadVentasPlazos (ventas_plazos changes):', error)
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos_plazos' }, () => {
        void loadVentasPlazos().catch((error) => {
          console.error('Error en loadVentasPlazos (pagos_plazos changes):', error)
        })
      })
      .subscribe()

    return (): void => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadVentasPlazos(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ventas_plazos')
        .select(`
          *,
          ventas (
            id,
            cliente,
            productos (
              nombre,
              imagen_url
            )
          ),
          pagos_plazos (
            id,
            numero_pago,
            monto,
            fecha_vencimiento,
            fecha_pago,
            monto_pagado,
            estado,
            metodo_pago
          )
        `)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      // Calcular estados y marcar vencidos
      const ventasConEstados = (data || []).map((vp: any) => {
        const pagos = vp.pagos_plazos || []
        const pagosVencidos = pagos.filter((p: PagoPlazo) => 
          p.estado === 'pendiente' && new Date(p.fecha_vencimiento) < new Date()
        )
        
        // Marcar pagos vencidos
        pagosVencidos.forEach(async (pago: PagoPlazo) => {
          if (pago.estado === 'pendiente') {
            await supabase
              .from('pagos_plazos')
              .update({ estado: 'vencido' })
              .eq('id', pago.id)
          }
        })

        return vp
      })

      setVentasPlazos(ventasConEstados)
      setLoading(false)
    } catch (error: any) {
      toast.error('Error cargando pagos a plazos: ' + error.message)
      setLoading(false)
    }
  }

  const ventasFiltradas = filterEstado === 'todos' 
    ? ventasPlazos 
    : ventasPlazos.filter(vp => vp.estado === filterEstado)

  const totalPendiente = ventasPlazos
    .filter(vp => vp.estado !== 'completado' && vp.estado !== 'cancelado')
    .reduce((sum, vp) => {
      const pagado = vp.pagos_plazos?.reduce((s, p) => s + Number(p.monto_pagado), 0) || 0
      return sum + (Number(vp.monto_total) - pagado)
    }, 0)

  const totalCompletado = ventasPlazos
    .filter(vp => vp.estado === 'completado')
    .reduce((sum, vp) => sum + Number(vp.monto_total), 0)

  const getEstadoColor = (estado: EstadoVentaPlazo) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 border-green-300'
      case 'en_proceso': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'vencido': return 'bg-red-100 text-red-800 border-red-300'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEstadoIcon = (estado: EstadoVentaPlazo) => {
    switch (estado) {
      case 'completado': return <CheckCircle size={16} />
      case 'en_proceso': return <Clock size={16} />
      case 'vencido': return <AlertCircle size={16} />
      case 'pendiente': return <Clock size={16} />
      case 'cancelado': return <XCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const getProgresoPago = (ventaPlazo: VentaPlazo) => {
    const totalPagado = ventaPlazo.pagos_plazos?.reduce((sum, p) => sum + Number(p.monto_pagado), 0) || 0
    const porcentaje = (totalPagado / Number(ventaPlazo.monto_total)) * 100
    const pagosCompletados = ventaPlazo.pagos_plazos?.filter(p => p.estado === 'pagado').length || 0
    return { totalPagado, porcentaje, pagosCompletados }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Pagos a Plazos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 btn-success"
        >
          <Plus size={20} />
          Nueva Venta a Plazos
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Pendiente</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {formatCurrency(totalPendiente)}
              </p>
            </div>
            <DollarSign className="text-orange-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Completado</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(totalCompletado)}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ventas Activas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {ventasPlazos.filter(vp => vp.estado !== 'completado' && vp.estado !== 'cancelado').length}
              </p>
            </div>
            <Calendar className="text-blue-500" size={48} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterEstado('todos')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterEstado('pendiente')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'pendiente'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterEstado('en_proceso')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'en_proceso'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En Proceso
          </button>
          <button
            onClick={() => setFilterEstado('completado')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'completado'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFilterEstado('vencido')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'vencido'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vencidos
          </button>
        </div>
      </div>

      {/* Lista de ventas a plazos */}
      {loading ? (
        <div className="text-center py-12">Cargando pagos a plazos...</div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No hay ventas a plazos registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ventasFiltradas.map((ventaPlazo) => {
            const progreso = getProgresoPago(ventaPlazo)
            const pagosOrdenados = [...(ventaPlazo.pagos_plazos || [])].sort((a, b) => a.numero_pago - b.numero_pago)
            
            return (
              <div key={ventaPlazo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {ventaPlazo.ventas?.productos?.imagen_url && (
                        <img
                          src={ventaPlazo.ventas.productos.imagen_url}
                          alt={ventaPlazo.ventas.productos.nombre}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {ventaPlazo.ventas?.productos?.nombre || 'Producto eliminado'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Cliente: {ventaPlazo.ventas?.cliente || 'Sin cliente'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {ventaPlazo.numero_pagos} pagos de {formatCurrency(ventaPlazo.monto_por_pago)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-1 ${getEstadoColor(ventaPlazo.estado)}`}>
                      {getEstadoIcon(ventaPlazo.estado)}
                      <span className="text-xs font-medium capitalize">{ventaPlazo.estado.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso de pago</span>
                      <span className="font-semibold">
                        {progreso.pagosCompletados} / {ventaPlazo.numero_pagos} pagos
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          ventaPlazo.estado === 'completado' ? 'bg-green-500' :
                          ventaPlazo.estado === 'vencido' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progreso.porcentaje, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pagado: {formatCurrency(progreso.totalPagado)}</span>
                      <span>Total: {formatCurrency(ventaPlazo.monto_total)}</span>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Inicio:</span>
                      <span className="ml-2 font-medium">{formatDate(ventaPlazo.fecha_inicio)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Límite:</span>
                      <span className={`ml-2 font-medium ${
                        new Date(ventaPlazo.fecha_limite) < new Date() ? 'text-red-600' : ''
                      }`}>
                        {formatDate(ventaPlazo.fecha_limite)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de pagos */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Pagos:</h4>
                    <div className="space-y-2">
                      {pagosOrdenados.map((pago) => (
                        <div
                          key={pago.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            pago.estado === 'pagado' ? 'bg-green-50 border-green-200' :
                            pago.estado === 'vencido' ? 'bg-red-50 border-red-200' :
                            pago.estado === 'parcial' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">Pago #{pago.numero_pago}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                pago.estado === 'pagado' ? 'bg-green-200 text-green-800' :
                                pago.estado === 'vencido' ? 'bg-red-200 text-red-800' :
                                pago.estado === 'parcial' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {pago.estado}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Vence: {formatDate(pago.fecha_vencimiento)}
                              {pago.fecha_pago && ` • Pagado: ${formatDate(pago.fecha_pago)}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {formatCurrency(pago.monto_pagado)} / {formatCurrency(pago.monto)}
                            </div>
                            {pago.metodo_pago && (
                              <div className="text-xs text-gray-500">{pago.metodo_pago}</div>
                            )}
                          </div>
                          {pago.estado !== 'pagado' && (
                            <button
                              onClick={() => {
                                setSelectedVentaPlazo(ventaPlazo)
                                setShowPagoForm(true)
                              }}
                              className="ml-4 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Registrar Pago
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <VentaPlazoForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadVentasPlazos()
          }}
        />
      )}

      {showPagoForm && selectedVentaPlazo && (
        <PagoForm
          ventaPlazo={selectedVentaPlazo}
          onClose={() => {
            setShowPagoForm(false)
            setSelectedVentaPlazo(null)
          }}
          onSuccess={() => {
            setShowPagoForm(false)
            setSelectedVentaPlazo(null)
            loadVentasPlazos()
          }}
        />
      )}
    </div>
  )
}

