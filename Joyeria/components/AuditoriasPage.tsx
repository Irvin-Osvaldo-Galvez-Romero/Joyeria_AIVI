'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FileText, Search, Filter, Download, Shield } from 'lucide-react'
import PasswordModal from './PasswordModal'
import toast from 'react-hot-toast'
import { registrarLogin } from '@/lib/utils/loginTracker'

interface AuditoriaEntry {
  id: string
  tipo: 'producto' | 'venta' | 'gasto' | 'usuario' | 'login'
  accion: 'crear' | 'actualizar' | 'eliminar' | 'login'
  tabla: string
  registro_id: string
  usuario_nombre: string
  usuario_email: string
  fecha: string
  detalles: any
}

// Contraseña para acceder a auditorías (deberías cambiarla)
const AUDITORIA_PASSWORD = 'AIVI2025Audit'

export default function AuditoriasPage() {
  const [auditorias, setAuditorias] = useState<AuditoriaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  useEffect(() => {
    if (authenticated) {
      // Registrar acceso a auditorías
      registrarLogin('acceso_auditorias')
      loadAuditorias()
    }
  }, [authenticated])

  async function loadAuditorias() {
    setLoading(true)
    try {
      // Obtener productos
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('*, usuarios(nombre, email)')
        .order('fecha_creacion', { ascending: false })

      if (productosError) console.error('Error productos:', productosError)

      // Obtener ventas
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('*, usuarios(nombre, email), productos(nombre)')
        .order('fecha_creacion', { ascending: false })

      if (ventasError) console.error('Error ventas:', ventasError)

      // Obtener gastos
      const { data: gastos, error: gastosError } = await supabase
        .from('gastos')
        .select('*, usuarios(nombre, email)')
        .order('fecha_creacion', { ascending: false })

      if (gastosError) console.error('Error gastos:', gastosError)

      // Obtener usuarios
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (usuariosError) console.error('Error usuarios:', usuariosError)

      // Obtener logins
      const { data: logins, error: loginsError } = await supabase
        .from('logins')
        .select('*')
        .order('fecha_login', { ascending: false })

      if (loginsError) {
        console.error('Error cargando logins:', loginsError)
        console.error('Detalles del error:', {
          message: loginsError.message,
          details: loginsError.details,
          hint: loginsError.hint,
          code: loginsError.code
        })
        
        // Si la tabla no existe, mostrar un mensaje más claro
        if (loginsError.message.includes('does not exist') || loginsError.message.includes('no existe')) {
          toast.error('La tabla de logins no existe. Ejecuta el script SQL en Supabase.')
        } else if (loginsError.message.includes('permission') || loginsError.message.includes('policy')) {
          toast.error('Error de permisos. Verifica las políticas RLS en Supabase.')
        } else {
          toast.error('Error cargando logins: ' + loginsError.message)
        }
      } else {
        console.log('Logins cargados exitosamente:', logins?.length || 0)
        if (!logins || logins.length === 0) {
          console.log('No hay logins registrados en la base de datos aún')
          console.log('Esto es normal si es la primera vez que usas el sistema')
        } else {
          console.log('Ejemplo de login:', logins[0])
        }
      }

      const entries: AuditoriaEntry[] = []

      // Procesar productos
      productos?.forEach((producto) => {
        entries.push({
          id: `prod-${producto.id}`,
          tipo: 'producto',
          accion: 'crear',
          tabla: 'productos',
          registro_id: producto.id,
          usuario_nombre: (producto.usuarios as any)?.nombre || 'N/A',
          usuario_email: (producto.usuarios as any)?.email || 'N/A',
          fecha: producto.fecha_creacion,
          detalles: {
            nombre: producto.nombre,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            categoria: producto.categoria,
            stock: producto.stock,
          },
        })

        // Si fue actualizado después de creado
        if (producto.fecha_actualizacion && producto.fecha_actualizacion !== producto.fecha_creacion) {
          entries.push({
            id: `prod-upd-${producto.id}-${producto.fecha_actualizacion}`,
            tipo: 'producto',
            accion: 'actualizar',
            tabla: 'productos',
            registro_id: producto.id,
            usuario_nombre: (producto.usuarios as any)?.nombre || 'N/A',
            usuario_email: (producto.usuarios as any)?.email || 'N/A',
            fecha: producto.fecha_actualizacion,
            detalles: {
              nombre: producto.nombre,
              precio_compra: producto.precio_compra,
              precio_venta: producto.precio_venta,
              categoria: producto.categoria,
              stock: producto.stock,
            },
          })
        }
      })

      // Procesar ventas
      ventas?.forEach((venta) => {
        entries.push({
          id: `venta-${venta.id}`,
          tipo: 'venta',
          accion: 'crear',
          tabla: 'ventas',
          registro_id: venta.id,
          usuario_nombre: (venta.usuarios as any)?.nombre || 'N/A',
          usuario_email: (venta.usuarios as any)?.email || 'N/A',
          fecha: venta.fecha_creacion,
          detalles: {
            producto: (venta.productos as any)?.nombre || 'Producto eliminado',
            cantidad: venta.cantidad,
            precio_total: venta.precio_total,
            ganancia: venta.ganancia,
            cliente: venta.cliente,
            metodo_pago: venta.metodo_pago,
          },
        })
      })

      // Procesar gastos
      gastos?.forEach((gasto) => {
        entries.push({
          id: `gasto-${gasto.id}`,
          tipo: 'gasto',
          accion: 'crear',
          tabla: 'gastos',
          registro_id: gasto.id,
          usuario_nombre: (gasto.usuarios as any)?.nombre || 'N/A',
          usuario_email: (gasto.usuarios as any)?.email || 'N/A',
          fecha: gasto.fecha_creacion,
          detalles: {
            concepto: gasto.concepto,
            monto: gasto.monto,
            categoria: gasto.categoria,
            descripcion: gasto.descripcion,
          },
        })
      })

      // Procesar usuarios
      usuarios?.forEach((usuario) => {
        entries.push({
          id: `user-${usuario.id}`,
          tipo: 'usuario',
          accion: 'crear',
          tabla: 'usuarios',
          registro_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_email: usuario.email,
          fecha: usuario.fecha_creacion,
          detalles: {
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
          },
        })
      })

      // Procesar logins
      if (logins && logins.length > 0) {
        console.log('Procesando logins:', logins.length)
        logins.forEach((login) => {
          entries.push({
            id: `login-${login.id}`,
            tipo: 'login',
            accion: 'login',
            tabla: 'logins',
            registro_id: login.id,
            usuario_nombre: login.nombre || 'N/A',
            usuario_email: login.email || 'N/A',
            fecha: login.fecha_login,
            detalles: {
              email: login.email || 'N/A',
              nombre: login.nombre || 'N/A',
              ip_address: login.ip_address || 'No disponible',
              user_agent: login.user_agent || 'No disponible',
              exitoso: login.exitoso ? 'Sí' : 'No',
              dispositivo: login.user_agent 
                ? (login.user_agent.includes('Mobile') ? 'Móvil' : 'Escritorio')
                : 'Desconocido',
            },
          })
        })
      } else {
        console.log('No se encontraron logins en la base de datos')
      }

      // Ordenar por fecha descendente
      entries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

      console.log('Total de entradas de auditoría:', entries.length)
      console.log('Entradas de login:', entries.filter(e => e.tipo === 'login').length)

      setAuditorias(entries)
      setLoading(false)
    } catch (error: any) {
      console.error('Error cargando auditorías:', error)
      toast.error('Error cargando auditorías: ' + error.message)
      setLoading(false)
    }
  }

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'crear':
        return 'bg-green-100 text-green-700'
      case 'actualizar':
        return 'bg-blue-100 text-blue-700'
      case 'eliminar':
        return 'bg-red-100 text-red-700'
      case 'login':
        return 'bg-indigo-100 text-indigo-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'producto':
        return 'text-purple-600'
      case 'venta':
        return 'text-blue-600'
      case 'gasto':
        return 'text-red-600'
      case 'usuario':
        return 'text-amber-600'
      default:
        return 'text-gray-600'
    }
  }

  const getActionLabel = (accion: string) => {
    switch (accion) {
      case 'crear':
        return 'Creado'
      case 'actualizar':
        return 'Actualizado'
      case 'eliminar':
        return 'Eliminado'
      case 'login':
        return 'Inicio de Sesión'
      default:
        return accion
    }
  }

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'producto':
        return 'Producto'
      case 'venta':
        return 'Venta'
      case 'gasto':
        return 'Gasto'
      case 'usuario':
        return 'Usuario'
      case 'login':
        return 'Login'
      default:
        return tipo
    }
  }

  const getTypeColorLogin = (tipo: string) => {
    if (tipo === 'login') return 'text-indigo-600'
    return getTypeColor(tipo)
  }

  const filteredAuditorias = auditorias.filter((entry) => {
    const matchesSearch =
      entry.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.usuario_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(entry.detalles).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || entry.tipo === filterType
    const matchesAction = filterAction === 'all' || entry.accion === filterAction
    return matchesSearch && matchesType && matchesAction
  })

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Acción', 'Usuario', 'Email', 'Detalles']
    const rows = filteredAuditorias.map((entry) => [
      formatDate(entry.fecha),
      getTypeLabel(entry.tipo),
      getActionLabel(entry.accion),
      entry.usuario_nombre,
      entry.usuario_email,
      JSON.stringify(entry.detalles),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auditorias_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Auditorías exportadas exitosamente')
  }

  if (!authenticated) {
    return (
      <PasswordModal
        onSuccess={() => setAuthenticated(true)}
        onClose={() => {
          // Si el usuario cierra, regresar al dashboard
          window.history.back()
        }}
        correctPassword={AUDITORIA_PASSWORD}
        title="Acceso a Auditorías"
        description="Esta sección contiene información confidencial. Ingresa la contraseña para continuar."
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Shield className="text-gray-700" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Auditorías</h2>
            <p className="text-sm text-gray-600">Registro completo de actividades del sistema</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Download size={20} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuario, email o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="producto">Productos</option>
            <option value="venta">Ventas</option>
            <option value="gasto">Gastos</option>
            <option value="usuario">Usuarios</option>
            <option value="login">Logins</option>
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="actualizar">Actualizar</option>
            <option value="eliminar">Eliminar</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      {/* Tabla de auditorías */}
      {loading ? (
        <div className="text-center py-12">Cargando auditorías...</div>
      ) : filteredAuditorias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-2">No se encontraron registros de auditoría</p>
          {filterType === 'login' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ No hay logins registrados</p>
              <p className="text-xs text-yellow-700 mb-3">
                Esto puede deberse a que:
              </p>
              <ul className="text-xs text-yellow-700 text-left list-disc list-inside space-y-1 mb-3">
                <li>La tabla de logins no existe en la base de datos</li>
                <li>Aún no se han registrado inicios de sesión</li>
              </ul>
              <p className="text-xs text-yellow-700">
                Si la tabla no existe, ejecuta el script SQL en Supabase para crearla.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAuditorias.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.fecha)}
                      <br />
                      <span className="text-xs text-gray-400">
                        {new Date(entry.fecha).toLocaleTimeString('es-MX')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${entry.tipo === 'login' ? getTypeColorLogin(entry.tipo) : getTypeColor(entry.tipo)}`}>
                        {getTypeLabel(entry.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                          entry.accion
                        )}`}
                      >
                        {getActionLabel(entry.accion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.usuario_nombre}</div>
                      <div className="text-sm text-gray-500">{entry.usuario_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-md">
                        {entry.tipo === 'producto' && (
                          <div>
                            <strong>Nombre:</strong> {entry.detalles.nombre}
                            <br />
                            <strong>Precio Compra:</strong> {formatCurrency(entry.detalles.precio_compra)} |{' '}
                            <strong>Precio Venta:</strong> {formatCurrency(entry.detalles.precio_venta)}
                            {entry.detalles.categoria && (
                              <>
                                <br />
                                <strong>Categoría:</strong> {entry.detalles.categoria}
                              </>
                            )}
                            <br />
                            <strong>Stock:</strong> {entry.detalles.stock}
                          </div>
                        )}
                        {entry.tipo === 'venta' && (
                          <div>
                            <strong>Producto:</strong> {entry.detalles.producto}
                            <br />
                            <strong>Cantidad:</strong> {entry.detalles.cantidad} |{' '}
                            <strong>Total:</strong> {formatCurrency(entry.detalles.precio_total)}
                            <br />
                            <strong>Ganancia:</strong> {formatCurrency(entry.detalles.ganancia)}
                            {entry.detalles.cliente && (
                              <>
                                <br />
                                <strong>Cliente:</strong> {entry.detalles.cliente}
                              </>
                            )}
                            {entry.detalles.metodo_pago && (
                              <>
                                <br />
                                <strong>Método de pago:</strong> {entry.detalles.metodo_pago}
                              </>
                            )}
                          </div>
                        )}
                        {entry.tipo === 'gasto' && (
                          <div>
                            <strong>Concepto:</strong> {entry.detalles.concepto}
                            <br />
                            <strong>Monto:</strong> {formatCurrency(entry.detalles.monto)}
                            {entry.detalles.categoria && (
                              <>
                                <br />
                                <strong>Categoría:</strong> {entry.detalles.categoria}
                              </>
                            )}
                            {entry.detalles.descripcion && (
                              <>
                                <br />
                                <strong>Descripción:</strong> {entry.detalles.descripcion}
                              </>
                            )}
                          </div>
                        )}
                        {entry.tipo === 'usuario' && (
                          <div>
                            <strong>Nombre:</strong> {entry.detalles.nombre}
                            <br />
                            <strong>Email:</strong> {entry.detalles.email}
                            <br />
                            <strong>Rol:</strong> {entry.detalles.rol}
                          </div>
                        )}
                        {entry.tipo === 'login' && (
                          <div>
                            <strong>Email:</strong> {entry.detalles.email}
                            <br />
                            <strong>Nombre:</strong> {entry.detalles.nombre}
                            <br />
                            <strong>IP:</strong> {entry.detalles.ip_address}
                            <br />
                            <strong>Dispositivo:</strong> {entry.detalles.dispositivo}
                            <br />
                            <strong>Estado:</strong>{' '}
                            <span className={entry.detalles.exitoso === 'Sí' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {entry.detalles.exitoso}
                            </span>
                            {entry.detalles.user_agent && entry.detalles.user_agent !== 'No disponible' && (
                              <>
                                <br />
                                <strong>Navegador:</strong>{' '}
                                <span className="text-xs">{entry.detalles.user_agent.substring(0, 50)}...</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {filteredAuditorias.length} de {auditorias.length} registros
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

