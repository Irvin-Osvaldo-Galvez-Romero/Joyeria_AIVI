export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      productos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio_compra: number
          precio_venta: number
          disponible: boolean
          imagen_url: string | null
          categoria: string | null
          proveedor: string | null
          fecha_compra: string
          fecha_creacion: string
          fecha_actualizacion: string
          usuario_id: string
          stock: number
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio_compra: number
          precio_venta: number
          disponible?: boolean
          imagen_url?: string | null
          categoria?: string | null
          proveedor?: string | null
          fecha_compra?: string
          fecha_creacion?: string
          fecha_actualizacion?: string
          usuario_id: string
          stock?: number
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          precio_compra?: number
          precio_venta?: number
          disponible?: boolean
          imagen_url?: string | null
          categoria?: string | null
          proveedor?: string | null
          fecha_compra?: string
          fecha_actualizacion?: string
          stock?: number
        }
      }
      ventas: {
        Row: {
          id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          precio_total: number
          ganancia: number
          cliente: string | null
          fecha_venta: string
          fecha_creacion: string
          usuario_id: string
          metodo_pago: string | null
        }
        Insert: {
          id?: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          precio_total: number
          ganancia: number
          cliente?: string | null
          fecha_venta?: string
          fecha_creacion?: string
          usuario_id: string
          metodo_pago?: string | null
        }
        Update: {
          id?: string
          producto_id?: string
          cantidad?: number
          precio_unitario?: number
          precio_total?: number
          ganancia?: number
          cliente?: string | null
          fecha_venta?: string
          metodo_pago?: string | null
        }
      }
      gastos: {
        Row: {
          id: string
          concepto: string
          monto: number
          categoria: string | null
          descripcion: string | null
          fecha_gasto: string
          fecha_creacion: string
          usuario_id: string
        }
        Insert: {
          id?: string
          concepto: string
          monto: number
          categoria?: string | null
          descripcion?: string | null
          fecha_gasto?: string
          fecha_creacion?: string
          usuario_id: string
        }
        Update: {
          id?: string
          concepto?: string
          monto?: number
          categoria?: string | null
          descripcion?: string | null
          fecha_gasto?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string
          rol: string
          fecha_creacion: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          rol?: string
          fecha_creacion?: string
        }
        Update: {
          email?: string
          nombre?: string
          rol?: string
        }
      }
    }
  }
}
