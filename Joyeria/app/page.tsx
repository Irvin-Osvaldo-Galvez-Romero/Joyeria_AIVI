'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import Login from '@/components/Login'
import { animatePageIn } from '@/lib/animations'
import { registrarLogin } from '@/lib/utils/loginTracker'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Animar entrada de la página
      if (session?.user) {
        setTimeout(() => animatePageIn(), 100)
        // Registrar login si hay sesión activa (al recargar la página)
        await registrarLogin('sesion_activa')
      }
    })

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar errores de OTP expirado
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        if (session?.user) {
          setTimeout(() => animatePageIn(), 100)
          // Registrar login cuando se inicia sesión o se refresca el token
          if (event === 'SIGNED_IN') {
            await registrarLogin('inicio_sesion')
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      
      // Limpiar parámetros de error de la URL
      if (window.location.hash.includes('error')) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <Dashboard />
}
