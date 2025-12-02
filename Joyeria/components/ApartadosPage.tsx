'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Package, AlertCircle, CheckCircle, Clock, XCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import ApartadoForm from './ApartadoForm'

type EstadoApartado = 'activo' | 'completado' | 'vencido' | 'cancelado'

interface Apartado {
  id: string
  producto_id: string
  cliente: string
  telefono: string | null
  email: string | null
  monto_apartado: number
  monto_total: number
  monto_restante: number
  fecha_apartado: string
  fecha_limite: string
  estado: EstadoApartado
  notas: string | null
  productos: {
    nombre: string
    imagen_url: string | null
    precio_venta: number
  } | null
}

export default function ApartadosPage() {
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterEstado, setFilterEstado] = useState<EstadoApartado | 'todos'>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadApartados()
    
    const subscription = supabase
      .channel('apartados-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apartados' }, () => {
        loadApartados()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        loadApartados()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function loadApartados() {
    try {
      const { data, error } = await supabase
        .from('apartados')
        .select(`
          *,
          productos (
            nombre,
            imagen_url,
            precio_venta
          )
        `)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      // Marcar apartados vencidos
      const apartadosActualizados = (data || []).map(async (apartado: any) => {
        if (apartado.estado === 'activo' && new Date(apartado.fecha_limite) < new Date()) {
          await supabase
            .from('apartados')
            .update({ estado: 'vencido' })
            .eq('id', apartado.id)
          apartado.estado = 'vencido'
        }
        return apartado
      })

      const resultados = await Promise.all(apartadosActualizados)
      setApartados(resultados)
      setLoading(false)
    } catch (error: any) {
      toast.error('Error cargando apartados: ' + error.message)
      setLoading(false)
    }
  }

  const apartadosFiltrados = apartados.filter(apartado => {
    const matchEstado = filterEstado === 'todos' || apartado.estado === filterEstado
    const matchSearch = searchTerm === '' || 
      apartado.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apartado.productos?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apartado.telefono && apartado.telefono.includes(searchTerm)) ||
      (apartado.email && apartado.email.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchEstado && matchSearch
  })

  const totalActivos = apartados
    .filter(a => a.estado === 'activo')
    .reduce((sum, a) => sum + Number(a.monto_apartado), 0)

  const totalCompletados = apartados
    .filter(a => a.estado === 'completado')
    .reduce((sum, a) => sum + Number(a.monto_total), 0)

  const getEstadoColor = (estado: EstadoApartado) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 border-green-300'
      case 'activo': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'vencido': return 'bg-red-100 text-red-800 border-red-300'
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEstadoIcon = (estado: EstadoApartado) => {
    switch (estado) {
      case 'completado': return <CheckCircle size={16} />
      case 'activo': return <Clock size={16} />
      case 'vencido': return <AlertCircle size={16} />
      case 'cancelado': return <XCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const handleCompletarApartado = async (apartado: Apartado) => {
    if (!confirm('¿Marcar este apartado como completado? Esto liberará el producto.')) return

    try {
      const { error } = await supabase
        .from('apartados')
        .update({ estado: 'completado' })
        .eq('id', apartado.id)

      if (error) throw error
      toast.success('Apartado completado')
      loadApartados()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleCancelarApartado = async (apartado: Apartado) => {
    if (!confirm('¿Cancelar este apartado? El producto quedará disponible nuevamente.')) return

    try {
      const { error } = await supabase
        .from('apartados')
        .update({ estado: 'cancelado' })
        .eq('id', apartado.id)

      if (error) throw error
      toast.success('Apartado cancelado')
      loadApartados()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Productos Apartados</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 btn-success"
        >
          <Plus size={20} />
          Nuevo Apartado
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Apartados Activos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {formatCurrency(totalActivos)}
              </p>
            </div>
            <Package className="text-blue-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Completados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(totalCompletados)}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Apartados Activos</p>
              <p className="text-3xl font-bold text-teal-600 mt-2">
                {apartados.filter(a => a.estado === 'activo').length}
              </p>
            </div>
            <Clock className="text-teal-500" size={48} />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente, producto, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterEstado('todos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterEstado === 'todos'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterEstado('activo')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterEstado === 'activo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos
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
      </div>

      {/* Lista de apartados */}
      {loading ? (
        <div className="text-center py-12">Cargando apartados...</div>
      ) : apartadosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No hay apartados registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartadosFiltrados.map((apartado) => {
            const porcentaje = (Number(apartado.monto_apartado) / Number(apartado.monto_total)) * 100
            const diasRestantes = Math.ceil(
              (new Date(apartado.fecha_limite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            
            return (
              <div key={apartado.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {apartado.productos?.imagen_url ? (
                  <img
                    src={apartado.productos.imagen_url}
                    alt={apartado.productos.nombre}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <Package className="text-gray-400" size={48} />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">
                      {apartado.productos?.nombre || 'Producto eliminado'}
                    </h3>
                    <div className={`px-2 py-1 rounded-full border flex items-center gap-1 text-xs ${getEstadoColor(apartado.estado)}`}>
                      {getEstadoIcon(apartado.estado)}
                      <span className="capitalize">{apartado.estado}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente:</p>
                      <p className="font-semibold text-gray-900">{apartado.cliente}</p>
                    </div>
                    {apartado.telefono && (
                      <div>
                        <p className="text-sm text-gray-600">Teléfono:</p>
                        <p className="text-gray-900">{apartado.telefono}</p>
                      </div>
                    )}
                    {apartado.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email:</p>
                        <p className="text-gray-900">{apartado.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-semibold">{porcentaje.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          apartado.estado === 'completado' ? 'bg-green-500' :
                          apartado.estado === 'vencido' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Apartado: {formatCurrency(apartado.monto_apartado)}</span>
                      <span>Total: {formatCurrency(apartado.monto_total)}</span>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="text-sm space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Apartado:</span>
                      <span className="font-medium">{formatDate(apartado.fecha_apartado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Límite:</span>
                      <span className={`font-medium ${
                        diasRestantes < 0 ? 'text-red-600' :
                        diasRestantes <= 3 ? 'text-orange-600' :
                        ''
                      }`}>
                        {formatDate(apartado.fecha_limite)}
                        {apartado.estado === 'activo' && (
                          <span className="ml-1 text-xs">
                            ({diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  {apartado.estado === 'activo' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleCompletarApartado(apartado)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Completar
                      </button>
                      <button
                        onClick={() => handleCancelarApartado(apartado)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ApartadoForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadApartados()
          }}
        />
      )}
    </div>
  )
}

