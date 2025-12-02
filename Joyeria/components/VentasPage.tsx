'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import VentaForm from './VentaForm'

export default function VentasPage() {
  const [ventas, setVentas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadVentas()
    
    const subscription = supabase
      .channel('ventas-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        loadVentas()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  async function loadVentas() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          productos (
            nombre,
            imagen_url
          )
        `)
        .order('fecha_venta', { ascending: false })
        .limit(100)

      if (error) throw error
      setVentas(data || [])
      setLoading(false)
    } catch (error: any) {
      toast.error('Error cargando ventas: ' + error.message)
      setLoading(false)
    }
  }

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.precio_total), 0)
  const totalGanancias = ventas.reduce((sum, v) => sum + Number(v.ganancia), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Ventas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 btn-success"
        >
          <Plus size={20} />
          Registrar Venta
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Ventas</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {formatCurrency(totalVentas)}
              </p>
            </div>
            <ShoppingCart className="text-blue-500" size={48} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Ganancias</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(totalGanancias)}
              </p>
            </div>
            <ShoppingCart className="text-green-500" size={48} />
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      {loading ? (
        <div className="text-center py-12">Cargando ventas...</div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganancia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {venta.productos?.imagen_url && (
                          <img
                            src={venta.productos.imagen_url}
                            alt={venta.productos.nombre}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {venta.productos?.nombre || 'Producto eliminado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(venta.precio_unitario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(venta.precio_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(venta.ganancia)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(venta.fecha_venta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cliente || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <VentaForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadVentas()
          }}
        />
      )}
    </div>
  )
}
