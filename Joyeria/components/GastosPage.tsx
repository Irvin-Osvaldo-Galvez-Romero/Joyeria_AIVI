'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, TrendingDown, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import GastoForm from './GastoForm'

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGasto, setEditingGasto] = useState<any>(null)

  useEffect(() => {
    loadGastos()
    
    const subscription = supabase
      .channel('gastos-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => {
        loadGastos()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function loadGastos() {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha_gasto', { ascending: false })
        .limit(100)

      if (error) throw error
      setGastos(data || [])
      setLoading(false)
    } catch (error: any) {
      toast.error('Error cargando gastos: ' + error.message)
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return

    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Gasto eliminado')
      loadGastos()
    } catch (error: any) {
      toast.error('Error eliminando gasto: ' + error.message)
    }
  }

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0)

  // Agrupar por categoría
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    const cat = gasto.categoria || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gastos</h2>
        <button
          onClick={() => {
            setEditingGasto(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 btn-danger"
        >
          <Plus size={20} />
          Registrar Gasto
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Gastos</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(totalGastos)}
              </p>
            </div>
            <TrendingDown className="text-red-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div>
            <p className="text-gray-600 text-sm mb-3">Gastos por Categoría</p>
            <div className="space-y-2">
              {Object.entries(gastosPorCategoria).slice(0, 5).map(([categoria, monto]) => (
                <div key={categoria} className="flex justify-between text-sm">
                  <span className="text-gray-600">{categoria}:</span>
                  <span className="font-semibold">{formatCurrency(monto)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de gastos */}
      {loading ? (
        <div className="text-center py-12">Cargando gastos...</div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <TrendingDown className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {gasto.concepto}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {gasto.categoria || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(gasto.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(gasto.fecha_gasto)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {gasto.descripcion || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingGasto(gasto)
                            setShowForm(true)
                          }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg hover:shadow-md transform hover:scale-110 transition-all duration-200"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(gasto.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg hover:shadow-md transform hover:scale-110 transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <GastoForm
          gasto={editingGasto}
          onClose={() => {
            setShowForm(false)
            setEditingGasto(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingGasto(null)
            loadGastos()
          }}
        />
      )}
    </div>
  )
}
