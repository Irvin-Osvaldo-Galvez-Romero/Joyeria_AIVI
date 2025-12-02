'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'
import { Search, X } from 'lucide-react'

interface VentaFormData {
  producto_id: string
  cantidad: number
  precio_unitario: number
  cliente: string
  metodo_pago: string
}

export default function VentaForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductList, setShowProductList] = useState(false)
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
  } = useForm<VentaFormData>({
    defaultValues: {
      cantidad: 1,
      precio_unitario: 0,
      metodo_pago: 'Efectivo',
    },
  })

  const productoId = watch('producto_id')
  const cantidad = watch('cantidad')
  const precioUnitario = watch('precio_unitario')

  useEffect(() => {
    loadProductos()
  }, [])

  async function loadProductos() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, precio_compra, disponible, stock, categoria')
        .eq('disponible', true)
        .gt('stock', 0)
        .order('nombre', { ascending: true })

      if (error) throw error
      setProductos(data || [])
    } catch (error: any) {
      toast.error('Error cargando productos: ' + error.message)
    }
  }

  useEffect(() => {
    if (productoId && productos.length > 0) {
      const producto = productos.find((p) => p.id === productoId)
      if (producto) {
        setValue('precio_unitario', producto.precio_venta)
      }
    }
  }, [productoId, productos, setValue])

  async function onSubmit(data: VentaFormData) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      // Obtener producto para calcular ganancia
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('precio_compra, stock')
        .eq('id', data.producto_id)
        .single()

      if (productoError || !producto) throw new Error('Producto no encontrado')

      if (producto.stock < data.cantidad) {
        toast.error(`Stock insuficiente. Disponible: ${producto.stock}`)
        setLoading(false)
        return
      }

      const precioTotal = data.cantidad * data.precio_unitario
      const ganancia = precioTotal - (producto.precio_compra * data.cantidad)

      const { error } = await supabase.from('ventas').insert([
        {
          producto_id: data.producto_id,
          cantidad: data.cantidad,
          precio_unitario: data.precio_unitario,
          precio_total: precioTotal,
          ganancia,
          cliente: data.cliente || null,
          usuario_id: user.id,
          metodo_pago: data.metodo_pago || null,
        },
      ])

      if (error) throw error
      
      // Mostrar animación de éxito
      setShowSuccess(true)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find((p) => p.id === productoId)
  const gananciaEstimada = productoSeleccionado && precioUnitario > 0 && cantidad > 0
    ? (cantidad * precioUnitario) - (cantidad * productoSeleccionado.precio_compra)
    : 0

  // Filtrar productos por término de búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.precio_venta.toString().includes(searchTerm)
  )

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowProductList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message="Venta registrada exitosamente"
          icon="💰"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="border-b border-gray-200 bg-gradient-to-r from-white to-blue-50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Registrar Venta</h3>
          <CloseButton onClick={handleClose} size="md" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div ref={searchRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar producto por nombre, categoría o precio..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowProductList(true)
                }}
                onFocus={() => setShowProductList(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setShowProductList(false)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {showProductList && searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => {
                        setValue('producto_id', producto.id)
                        setSearchTerm(producto.nombre)
                        setShowProductList(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-600">
                        {producto.categoria && <span>{producto.categoria} • </span>}
                        Stock: {producto.stock} • Precio: ${Number(producto.precio_venta).toFixed(2)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No se encontraron productos
                  </div>
                )}
              </div>
            )}
            
            <input
              type="hidden"
              {...register('producto_id', { required: 'Selecciona un producto' })}
              value={productoId || ''}
            />
            
            {productoSeleccionado && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">{productoSeleccionado.nombre}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      Stock: {productoSeleccionado.stock} • ${Number(productoSeleccionado.precio_venta).toFixed(2)}
                    </span>
                  </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('producto_id', '')
                        setSearchTerm('')
                        setShowProductList(false)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                </div>
              </div>
            )}
            
            {errors.producto_id && (
              <p className="text-red-500 text-sm mt-1">{errors.producto_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                {...register('cantidad', {
                  required: 'La cantidad es requerida',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Mínimo 1' },
                })}
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.cantidad && (
                <p className="text-red-500 text-sm mt-1">{errors.cantidad.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario *
              </label>
              <input
                {...register('precio_unitario', {
                  required: 'El precio es requerido',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Debe ser mayor a 0' },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.precio_unitario && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precio_unitario.message}
                </p>
              )}
            </div>
          </div>

          {precioUnitario > 0 && cantidad > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">
                  ${(precioUnitario * cantidad).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ganancia estimada:</span>
                <span className="font-semibold text-green-600">
                  ${gananciaEstimada.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente (opcional)
            </label>
            <input
              {...register('cliente')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <select
              {...register('metodo_pago')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Otro">Otro</option>
            </select>
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
              {loading ? 'Registrando...' : 'Registrar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
