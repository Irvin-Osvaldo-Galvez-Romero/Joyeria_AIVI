'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductForm from './ProductForm'
import { animateCardIn } from '@/lib/animations'

// Componente de tarjeta de producto con animación
function ProductCard({ producto, index, onEdit, onDelete }: { 
  producto: any
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (cardRef.current) {
      animateCardIn(cardRef.current, index * 50)
    }
  }, [index])
  
  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
        !producto.disponible ? 'opacity-60' : ''
      }`}
    >
      {producto.imagen_url ? (
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          className="w-full h-48 object-cover rounded-t-xl"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center">
          <ImageIcon className="text-gray-400" size={48} />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {producto.nombre}
          </h3>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              producto.disponible
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {producto.disponible ? 'Disponible' : 'Vendido'}
          </span>
        </div>

        {producto.descripcion && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {producto.descripcion}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio de compra:</span>
            <span className="font-semibold">{formatCurrency(producto.precio_compra)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio de venta:</span>
            <span className="font-semibold text-purple-600">
              {formatCurrency(producto.precio_venta)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ganancia estimada:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(producto.precio_venta - producto.precio_compra)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Stock:</span>
            <span className="font-semibold">{producto.stock || 0}</span>
          </div>
          {producto.categoria && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Categoría:</span>
              <span className="font-semibold">{producto.categoria}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 btn-icon"
          >
            <Edit size={16} />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 btn-icon-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDisponible, setFilterDisponible] = useState<boolean | null>(null)

  useEffect(() => {
    // Llamar loadProductos sin await (está bien, es fire-and-forget)
    void loadProductos().catch((error) => {
      console.error('Error en loadProductos:', error)
    })
    
    // Suscripción en tiempo real
    const subscription = supabase
      .channel('productos-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        void loadProductos().catch((error) => {
          console.error('Error en loadProductos (productos changes):', error)
        })
      })
      .subscribe()

    return (): void => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadProductos(): Promise<void> {
    try {
      let query = supabase
        .from('productos')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (filterDisponible !== null) {
        query = query.eq('disponible', filterDisponible)
      }

      const { data, error } = await query

      if (error) throw error
      setProductos(data || [])
      setLoading(false)
    } catch (error: any) {
      toast.error('Error cargando productos: ' + error.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProductos()
  }, [filterDisponible])

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Producto eliminado')
      loadProductos()
    } catch (error: any) {
      toast.error('Error eliminando producto: ' + error.message)
    }
  }

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Productos</h2>
        <button
          onClick={() => {
            setEditingProduct(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus size={20} />
          Agregar Producto
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterDisponible === null ? 'all' : filterDisponible.toString()}
            onChange={(e) => {
              const val = e.target.value
              setFilterDisponible(val === 'all' ? null : val === 'true')
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="true">Disponibles</option>
            <option value="false">No disponibles</option>
          </select>
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="text-center py-12">Cargando productos...</div>
      ) : filteredProductos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No hay productos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProductos.map((producto, index) => (
            <ProductCard 
              key={producto.id} 
              producto={producto} 
              index={index}
              onEdit={() => {
                setEditingProduct(producto)
                setShowForm(true)
              }}
              onDelete={() => handleDelete(producto.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingProduct(null)
            loadProductos()
          }}
        />
      )}
    </div>
  )
}
