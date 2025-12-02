'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Menu,
  Shield,
  Calendar,
  Clock
} from 'lucide-react'
import CloseButton from './CloseButton'
import Logo from './Logo'
import ProductosPage from './ProductosPage'
import VentasPage from './VentasPage'
import GastosPage from './GastosPage'
import EstadisticasPage from './EstadisticasPage'
import AuditoriasPage from './AuditoriasPage'
import PagosPlazosPage from './PagosPlazosPage'
import ApartadosPage from './ApartadosPage'

type Tab = 'dashboard' | 'productos' | 'ventas' | 'gastos' | 'estadisticas' | 'auditorias' | 'pagos_plazos' | 'apartados'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosDisponibles: 0,
    totalVentas: 0,
    totalGanancias: 0,
    totalGastos: 0,
    gananciaNeta: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [logoPageChange, setLogoPageChange] = useState(false)
  const prevTabRef = useRef<Tab>('dashboard')

  // Efecto para animar logo al cambiar de página
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setLogoPageChange(true)
      setTimeout(() => setLogoPageChange(false), 1100)
      prevTabRef.current = activeTab
    }
  }, [activeTab])

  useEffect(() => {
    loadStats()
    
    // Suscribirse a cambios en tiempo real
    const productosSub = supabase
      .channel('productos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        loadStats()
      })
      .subscribe()

    const ventasSub = supabase
      .channel('ventas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        loadStats()
      })
      .subscribe()

    const gastosSub = supabase
      .channel('gastos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => {
        loadStats()
      })
      .subscribe()

    return () => {
      productosSub.unsubscribe()
      ventasSub.unsubscribe()
      gastosSub.unsubscribe()
    }
  }, [])

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Productos
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })

      const { count: productosDisponibles } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('disponible', true)

      // Ventas y ganancias
      const { data: ventas } = await supabase
        .from('ventas')
        .select('precio_total, ganancia')

      const totalVentas = ventas?.reduce((sum, v) => sum + Number(v.precio_total), 0) || 0
      const totalGanancias = ventas?.reduce((sum, v) => sum + Number(v.ganancia), 0) || 0

      // Gastos
      const { data: gastos } = await supabase
        .from('gastos')
        .select('monto')

      const totalGastos = gastos?.reduce((sum, g) => sum + Number(g.monto), 0) || 0
      const gananciaNeta = totalGanancias - totalGastos

      setStats({
        totalProductos: totalProductos || 0,
        productosDisponibles: productosDisponibles || 0,
        totalVentas,
        totalGanancias,
        totalGastos,
        gananciaNeta,
      })
      setLoading(false)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando estadísticas...</div>
      </div>
    )
  }

  // Colores de fondo según la pestaña activa
  const bgColors: Record<Tab, string> = {
    dashboard: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
    productos: 'bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100',
    ventas: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100',
    gastos: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100',
    estadisticas: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
    auditorias: 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100',
    pagos_plazos: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100',
    apartados: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100',
  }

  // Colores del sidebar según la pestaña activa
  const sidebarColors: Record<Tab, { bg: string, active: string, text: string, border: string }> = {
    dashboard: {
      bg: 'bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100',
      active: 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-700 border-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-300',
    },
    productos: {
      bg: 'bg-gradient-to-b from-purple-50 via-violet-50 to-purple-100',
      active: 'bg-gradient-to-r from-purple-100 to-violet-50 text-purple-700 border-purple-600',
      text: 'text-purple-700',
      border: 'border-purple-300',
    },
    ventas: {
      bg: 'bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100',
      active: 'bg-gradient-to-r from-blue-100 to-sky-50 text-blue-700 border-blue-600',
      text: 'text-blue-700',
      border: 'border-blue-300',
    },
    gastos: {
      bg: 'bg-gradient-to-b from-rose-50 via-pink-50 to-rose-100',
      active: 'bg-gradient-to-r from-rose-100 to-pink-50 text-rose-700 border-rose-600',
      text: 'text-rose-700',
      border: 'border-rose-300',
    },
    estadisticas: {
      bg: 'bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100',
      active: 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-700 border-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-300',
    },
    auditorias: {
      bg: 'bg-gradient-to-b from-gray-50 via-slate-50 to-gray-100',
      active: 'bg-gradient-to-r from-gray-100 to-slate-50 text-gray-700 border-gray-600',
      text: 'text-gray-700',
      border: 'border-gray-300',
    },
    pagos_plazos: {
      bg: 'bg-gradient-to-b from-indigo-50 via-purple-50 to-indigo-100',
      active: 'bg-gradient-to-r from-indigo-100 to-purple-50 text-indigo-700 border-indigo-600',
      text: 'text-indigo-700',
      border: 'border-indigo-300',
    },
    apartados: {
      bg: 'bg-gradient-to-b from-teal-50 via-cyan-50 to-teal-100',
      active: 'bg-gradient-to-r from-teal-100 to-cyan-50 text-teal-700 border-teal-600',
      text: 'text-teal-700',
      border: 'border-teal-300',
    },
  }

  const currentSidebarColors = sidebarColors[activeTab]

  return (
    <div className={`min-h-screen transition-colors duration-500 ${bgColors[activeTab]}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {sidebarOpen ? (
              <CloseButton 
                onClick={() => setSidebarOpen(false)} 
                size="md" 
                className="lg:hidden bg-transparent hover:from-gray-200 hover:to-gray-300" 
              />
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                aria-label="Abrir menú"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <Logo size="sm" showText={false} />
              <div>
                <h1 className="text-xl font-bold text-gray-800">AIVI</h1>
                <p className="text-xs text-gray-600 -mt-1">Silver House</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 ${currentSidebarColors.bg} border-r ${currentSidebarColors.border} transform transition-all duration-500 ease-in-out`}
        >
          {/* Logo en Sidebar */}
          <div className={`px-4 pt-4 pb-4 border-b ${currentSidebarColors.border} bg-white/50 backdrop-blur-sm`}>
            <Logo size="md" showText={true} animate={true} onPageChange={logoPageChange} />
          </div>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <TrendingUp size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'productos'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <Package size={20} />
              Productos
            </button>
            <button
              onClick={() => setActiveTab('ventas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'ventas'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <ShoppingCart size={20} />
              Ventas
            </button>
            <button
              onClick={() => setActiveTab('gastos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'gastos'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <TrendingDown size={20} />
              Gastos
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'estadisticas'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <DollarSign size={20} />
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('auditorias')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'auditorias'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <Shield size={20} />
              Auditorías
            </button>
            <button
              onClick={() => setActiveTab('pagos_plazos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'pagos_plazos'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <Calendar size={20} />
              Pagos a Plazos
            </button>
            <button
              onClick={() => setActiveTab('apartados')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'apartados'
                  ? `${currentSidebarColors.active} shadow-md border-l-4`
                  : `${currentSidebarColors.text} hover:bg-white/50 hover:shadow-sm opacity-70 hover:opacity-100`
              }`}
            >
              <Clock size={20} />
              Apartados
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-6 transition-colors duration-500`}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Productos</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mt-2">
                        {stats.totalProductos}
                      </p>
                      <p className="text-sm text-green-600 mt-1 font-medium">
                        {stats.productosDisponibles} disponibles
                      </p>
                    </div>
                    <Package className="text-purple-500 animate-pulse" size={48} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Ventas</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mt-2">
                        {formatCurrency(stats.totalVentas)}
                      </p>
                    </div>
                    <ShoppingCart className="text-blue-500 animate-pulse" size={48} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Ganancia Neta</p>
                      <p className={`text-3xl font-bold mt-2 ${
                        stats.gananciaNeta >= 0 
                          ? 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent'
                      }`}>
                        {formatCurrency(stats.gananciaNeta)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 font-medium">
                        Bruta: {formatCurrency(stats.totalGanancias)}
                      </p>
                    </div>
                    <DollarSign className={`${stats.gananciaNeta >= 0 ? 'text-green-500' : 'text-red-500'} animate-pulse`} size={48} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Gastos</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {formatCurrency(stats.totalGastos)}
                      </p>
                    </div>
                    <TrendingDown className="text-red-500" size={48} />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('productos')}
                    className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 transition-all duration-300 text-left shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <Package className="text-purple-500 mb-3 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <p className="font-bold text-gray-800 mb-1">Agregar Producto</p>
                    <p className="text-sm text-gray-600">Registra un nuevo producto</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('ventas')}
                    className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-left shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <ShoppingCart className="text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <p className="font-bold text-gray-800 mb-1">Registrar Venta</p>
                    <p className="text-sm text-gray-600">Registra una nueva venta</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('gastos')}
                    className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 transition-all duration-300 text-left shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <TrendingDown className="text-orange-500 mb-3 group-hover:scale-110 transition-transform duration-300" size={28} />
                    <p className="font-bold text-gray-800 mb-1">Registrar Gasto</p>
                    <p className="text-sm text-gray-600">Registra un gasto</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'productos' && <ProductosPage />}
          {activeTab === 'ventas' && <VentasPage />}
          {activeTab === 'gastos' && <GastosPage />}
          {activeTab === 'estadisticas' && <EstadisticasPage />}
          {activeTab === 'auditorias' && <AuditoriasPage />}
          {activeTab === 'pagos_plazos' && <PagosPlazosPage />}
          {activeTab === 'apartados' && <ApartadosPage />}
        </main>
      </div>
    </div>
  )
}
