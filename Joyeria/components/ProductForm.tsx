'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { Upload, Sparkles } from 'lucide-react'
import CloseButton from './CloseButton'
import toast from 'react-hot-toast'
import { extractProductInfo } from '@/lib/ai/huggingface'
import { animateModalIn, animateModalOut } from '@/lib/animations'
import SuccessAnimation from './SuccessAnimation'

interface ProductFormData {
  nombre: string
  descripcion: string
  precio_compra: number
  precio_venta: number
  categoria: string
  proveedor: string
  stock: number
  disponible: boolean
}

export default function ProductForm({
  product,
  onClose,
  onSuccess,
}: {
  product?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState(product?.imagen_url || '')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    defaultValues: {
      nombre: product?.nombre || '',
      descripcion: product?.descripcion || '',
      precio_compra: product?.precio_compra || 0,
      precio_venta: product?.precio_venta || 0,
      categoria: product?.categoria || '',
      proveedor: product?.proveedor || '',
      stock: product?.stock || 1,
      disponible: product?.disponible ?? true,
    },
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('productos').getPublicUrl(filePath)

      setImageUrl(publicUrl)
      toast.success('Imagen cargada exitosamente')
    } catch (error: any) {
      toast.error('Error subiendo imagen: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleTextAI(text: string) {
    if (!text.trim()) return

    setAiProcessing(true)
    try {
      const aiInfo = await extractProductInfo(text, 'text')
      if (aiInfo) {
        if (aiInfo.nombre) setValue('nombre', aiInfo.nombre)
        if (aiInfo.categoria) setValue('categoria', aiInfo.categoria)
        if (aiInfo.descripcion) setValue('descripcion', aiInfo.descripcion)
        if (aiInfo.precio_compra !== undefined && aiInfo.precio_compra > 0) {
          setValue('precio_compra', aiInfo.precio_compra)
        }
        // Priorizar precio_venta explícito, luego precio_sugerido
        if (aiInfo.precio_venta !== undefined && aiInfo.precio_venta > 0) {
          setValue('precio_venta', aiInfo.precio_venta)
        } else if (aiInfo.precio_sugerido !== undefined && aiInfo.precio_sugerido > 0) {
          setValue('precio_venta', aiInfo.precio_sugerido)
        }
        toast.success('Información extraída con IA! ✨')
      } else {
        toast.error('No se pudo extraer información. Intenta ser más específico.')
      }
    } catch (error) {
      toast.error('Error procesando con IA')
    } finally {
      setAiProcessing(false)
    }
  }

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

  async function onSubmit(data: ProductFormData) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay usuario autenticado')

      const productData = {
        ...data,
        imagen_url: imageUrl || null,
        usuario_id: user.id,
      }

      if (product) {
        const { error } = await supabase
          .from('productos')
          .update(productData)
          .eq('id', product.id)

        if (error) throw error
        setShowSuccess(true)
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productData])

        if (error) throw error
        setShowSuccess(true)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message={product ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente'}
          icon="✨"
          onComplete={() => {
            setShowSuccess(false)
            onSuccess()
          }}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <CloseButton onClick={handleClose} size="md" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* IA Assist */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-purple-600" size={20} />
              <h4 className="font-semibold text-purple-900">Asistente IA</h4>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              Describe tu producto o sube una imagen para que la IA lo procese automáticamente
            </p>
            <textarea
              placeholder="Ejemplo: Anillo de oro de 18k, comprado en $300, lo vendo en $800..."
              className="w-full p-2 border border-purple-300 rounded text-sm mb-2"
              rows={2}
              onBlur={(e) => {
                if (e.target.value) handleTextAI(e.target.value)
              }}
            />
            {aiProcessing && (
              <p className="text-xs text-purple-600">Procesando con IA...</p>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del Producto
            </label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <div className="absolute top-2 right-2">
                  <CloseButton 
                    onClick={() => setImageUrl('')} 
                    size="sm"
                    className="bg-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  />
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500">
                    {uploadingImage ? 'Subiendo...' : 'Haz clic para subir imagen'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              {...register('nombre', { required: 'El nombre es requerido' })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Precios y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Compra *
              </label>
              <input
                {...register('precio_compra', {
                  required: 'El precio de compra es requerido',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Debe ser mayor a 0' },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.precio_compra && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precio_compra.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta *
              </label>
              <input
                {...register('precio_venta', {
                  required: 'El precio de venta es requerido',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Debe ser mayor a 0' },
                })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.precio_venta && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precio_venta.message}
                </p>
              )}
            </div>
          </div>

          {/* Categoría y Proveedor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <input
                {...register('categoria')}
                type="text"
                placeholder="Ej: Anillos, Collares, Aretes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                {...register('proveedor')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Stock y Disponible */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                {...register('stock', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Debe ser mayor o igual a 0' },
                })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('disponible')}
                  type="checkbox"
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Disponible para venta
                </span>
              </label>
            </div>
          </div>

          {/* Botones */}
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
              className="flex-1 btn-primary"
            >
              {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
