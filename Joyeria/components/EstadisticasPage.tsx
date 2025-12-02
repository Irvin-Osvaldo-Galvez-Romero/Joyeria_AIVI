'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, Package } from 'lucide-react'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

type VentasPorMes = { mes: string; mesKey: string; ventas: number; ganancias: number }
type CategoriaVendida = { categoria: string; cantidad: number; ganancia: number; ventas: number }

export default function EstadisticasPage() {
  const [ventas, setVentas] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadData()
  }, [periodo])

  async function loadData() {
    try {
      const fechaLimite = getDateLimit(periodo)

      // Cargar ventas con categoría del producto
      let ventasQuery = supabase
        .from('ventas')
        .select('*, productos(nombre, categoria)')
        .order('fecha_venta', { ascending: true })

      if (fechaLimite) {
        ventasQuery = ventasQuery.gte('fecha_venta', fechaLimite)
      }

      const { data: ventasData } = await ventasQuery

      // Cargar gastos
      let gastosQuery = supabase
        .from('gastos')
        .select('*')
        .order('fecha_gasto', { ascending: true })

      if (fechaLimite) {
        gastosQuery = gastosQuery.gte('fecha_gasto', fechaLimite)
      }

      const { data: gastosData } = await gastosQuery

      // Cargar productos
      const { data: productosData } = await supabase
        .from('productos')
        .select('nombre, precio_compra, precio_venta, categoria')

      setVentas(ventasData || [])
      setGastos(gastosData || [])
      setProductos(productosData || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error cargando datos:', error)
      setLoading(false)
    }
  }

  function getDateLimit(periodo: string): string | null {
    const hoy = new Date()
    switch (periodo) {
      case '7d':
        hoy.setDate(hoy.getDate() - 7)
        break
      case '30d':
        hoy.setDate(hoy.getDate() - 30)
        break
      case '90d':
        hoy.setDate(hoy.getDate() - 90)
        break
      default:
        return null
    }
    return hoy.toISOString().split('T')[0]
  }

  // Ventas por mes
  const ventasPorMes = ventas.reduce((acc, venta) => {
    const fecha = new Date(venta.fecha_venta)
    const mes = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[mesKey]) {
      acc[mesKey] = { mes, mesKey, ventas: 0, ganancias: 0 }
    }
    acc[mesKey].ventas += Number(venta.precio_total)
    acc[mesKey].ganancias += Number(venta.ganancia)
    return acc
  }, {} as Record<string, { mes: string; mesKey: string; ventas: number; ganancias: number }>)

  const ventasPorMesArray = (Object.values(ventasPorMes) as VentasPorMes[]).sort(
    (a, b) => a.mesKey.localeCompare(b.mesKey)
  )

  // Categorías más vendidas
  const categoriasVendidas = ventas.reduce((acc, venta) => {
    const categoria = venta.productos?.categoria || 'Sin categoría'
    if (!acc[categoria]) {
      acc[categoria] = { categoria, cantidad: 0, ganancia: 0, ventas: 0 }
    }
    acc[categoria].cantidad += venta.cantidad
    acc[categoria].ganancia += Number(venta.ganancia)
    acc[categoria].ventas += Number(venta.precio_total)
    return acc
  }, {} as Record<string, { categoria: string; cantidad: number; ganancia: number; ventas: number }>)

  const categoriasVendidasArray = (Object.values(categoriasVendidas) as CategoriaVendida[])
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  // Gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    const cat = gasto.categoria || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + Number(gasto.monto)
    return acc
  }, {} as Record<string, number>)

  const gastosPorCategoriaArray = Object.entries(gastosPorCategoria).map(
    ([name, value]) => ({ name, value })
  )

  // Resumen
  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.precio_total), 0)
  const totalGanancias = ventas.reduce((sum, v) => sum + Number(v.ganancia), 0)
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const gananciaNeta = totalGanancias - totalGastos

  if (loading) {
    return <div className="text-center py-12">Cargando estadísticas...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Estadísticas</h2>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="all">Todo el tiempo</option>
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalVentas)}
              </p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ganancias</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalGanancias)}
              </p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Gastos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalGastos)}
              </p>
            </div>
            <TrendingUp className="text-red-500 rotate-180" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ganancia Neta</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(gananciaNeta)}
              </p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas y Ganancias por Mes */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-amber-200">
          <h3 className="text-xl font-semibold mb-4 text-amber-700">Ventas y Ganancias por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorMesArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fbbf24" opacity={0.2} />
              <XAxis
                dataKey="mes"
                stroke="#d97706"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#d97706" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ventas"
                stroke="#f59e0b"
                name="Ventas"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="ganancias"
                stroke="#d97706"
                name="Ganancias"
                strokeWidth={3}
                dot={{ fill: '#d97706', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Categorías Más Vendidas */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-amber-200">
          <h3 className="text-xl font-semibold mb-4 text-amber-700">Categorías Más Vendidas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoriasVendidasArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fbbf24" opacity={0.2} />
              <XAxis 
                dataKey="categoria" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                stroke="#d97706"
              />
              <YAxis stroke="#d97706" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b',
                  borderRadius: '8px'
                }} 
              />
              <Bar 
                dataKey="cantidad" 
                fill="#f59e0b" 
                name="Cantidad Vendida"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de Gastos */}
      {gastosPorCategoriaArray.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gastosPorCategoriaArray}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {gastosPorCategoriaArray.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
