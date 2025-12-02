'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'
import { formatCurrency } from '@/lib/utils'
import { Search, X } from 'lucide-react'

interface ApartadoFormData {
  producto_id: string
  cliente: string
  telefono: string
  email: string
  monto_apartado: number
  fecha_limite: string
  notas: string
}

export default function ApartadoForm({
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
  } = useForm<ApartadoFormData>({
    defaultValues: {
      monto_apartado: 0,
    },
  })

  const productoId = watch('producto_id')
  const montoApartado = watch('monto_apartado')

  useEffect(() => {
    loadProductos()
  }, [])

  useEffect(() => {
    if (productoId && productos.length > 0) {
      const producto = productos.find((p) => p.id === productoId)
      if (producto) {
        // Sugerir 30% del precio como monto de apartado mínimo
        const sugerido = Number(producto.precio_venta) * 0.3
        if (montoApartado === 0 || montoApartado < sugerido) {
          setValue('monto_apartado', sugerido)
        }
      }
    }
  }, [productoId, productos, setValue, montoApartado])

  async function loadProductos() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, disponible, stock, imagen_url')
        .eq('disponible', true)
        .gt('stock', 0)
        .order('nombre', { ascending: true })

      if (error) throw error
      setProductos(data || [])
    } catch (error: any) {
      toast.error('Error cargando productos: ' + error.message)
    }
  }

  async function onSubmit(data: ApartadoFormData) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      // Obtener producto
      const producto = productos.find((p) => p.id === data.producto_id)
      if (!producto) throw new Error('Producto no encontrado')

      // Verificar que el producto no esté ya apartado
      const { data: existingApartado } = await supabase
        .from('apartados')
        .select('id')
        .eq('producto_id', data.producto_id)
        .eq('estado', 'activo')
        .single()

      if (existingApartado) {
        toast.error('Este producto ya está apartado')
        setLoading(false)
        return
      }

      const montoTotal = Number(producto.precio_venta)

      if (data.monto_apartado >= montoTotal) {
        toast.error('El monto de apartado debe ser menor al precio total')
        setLoading(false)
        return
      }

      if (data.monto_apartado < montoTotal * 0.1) {
        toast.error('El monto de apartado debe ser al menos el 10% del precio total')
        setLoading(false)
        return
      }

      // Crear apartado
      const { error } = await supabase.from('apartados').insert([
        {
          producto_id: data.producto_id,
          cliente: data.cliente,
          telefono: data.telefono || null,
          email: data.email || null,
          monto_apartado: data.monto_apartado,
          monto_total: montoTotal,
          fecha_limite: data.fecha_limite,
          notas: data.notas || null,
          usuario_id: user.id,
        },
      ])

      if (error) throw error

      setShowSuccess(true)
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const productoSeleccionado = productos.find((p) => p.id === productoId)
  const montoRestante = productoSeleccionado && montoApartado > 0
    ? Number(productoSeleccionado.precio_venta) - montoApartado
    : 0

  // Filtrar productos por término de búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.precio_venta.toString().includes(searchTerm) ||
    producto.stock.toString().includes(searchTerm)
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
          message="Producto apartado exitosamente"
          icon="📦"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="border-b border-gray-200 bg-gradient-to-r from-white to-teal-50 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              Nuevo Apartado
            </h3>
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
                  placeholder="Buscar producto por nombre, categoría, precio o stock..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowProductList(true)
                  }}
                  onFocus={() => setShowProductList(true)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{producto.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {producto.categoria && <span>{producto.categoria} • </span>}
                          {formatCurrency(producto.precio_venta)} • Stock: {producto.stock}
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
                <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">{productoSeleccionado.nombre}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {formatCurrency(productoSeleccionado.precio_venta)} • Stock: {productoSeleccionado.stock}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <input
                {...register('cliente', { required: 'El nombre del cliente es requerido' })}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Nombre completo del cliente"
              />
              {errors.cliente && (
                <p className="text-red-500 text-sm mt-1">{errors.cliente.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  {...register('telefono')}
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Teléfono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            {productoSeleccionado && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Total:</span>
                    <span className="font-semibold">{formatCurrency(productoSeleccionado.precio_venta)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mínimo de apartado: {formatCurrency(Number(productoSeleccionado.precio_venta) * 0.1)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto de Apartado *
              </label>
              <input
                {...register('monto_apartado', {
                  required: 'El monto de apartado es requerido',
                  valueAsNumber: true,
                  min: {
                    value: productoSeleccionado ? Number(productoSeleccionado.precio_venta) * 0.1 : 0,
                    message: `Mínimo ${productoSeleccionado ? formatCurrency(Number(productoSeleccionado.precio_venta) * 0.1) : '$0'}`,
                  },
                  max: {
                    value: productoSeleccionado ? Number(productoSeleccionado.precio_venta) * 0.99 : 0,
                    message: 'Debe ser menor al precio total',
                  },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {errors.monto_apartado && (
                <p className="text-red-500 text-sm mt-1">{errors.monto_apartado.message}</p>
              )}
              {productoSeleccionado && montoApartado > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Restante: {formatCurrency(montoRestante)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Límite *
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Notas adicionales sobre este apartado..."
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
                {loading ? 'Apartando...' : 'Apartar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

