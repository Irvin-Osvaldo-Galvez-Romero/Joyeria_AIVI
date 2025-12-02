'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Logo from './Logo'
import { registrarLogin } from '@/lib/utils/loginTracker'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Verificar límite de 3 usuarios
        const { count, error: countError } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })

        if (countError) throw countError

        if (count && count >= 3) {
          toast.error('❌ Ya se alcanzó el límite máximo de 3 usuarios administradores.')
          setLoading(false)
          return
        }

        // Registrar sin verificación de email
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined, // No requiere verificación
          },
        })

        if (error) throw error

        // Verificar que el usuario se creó
        if (!data.user) {
          throw new Error('No se pudo crear el usuario')
        }

        // El registro en la tabla usuarios se crea automáticamente mediante trigger
        // Esperar un momento para que el trigger se ejecute
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verificar que el usuario se creó correctamente en la tabla usuarios
        const { data: usuarioCreado, error: checkError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (checkError || !usuarioCreado) {
          // Si no se creó automáticamente, intentar crearlo manualmente
          const { error: userError } = await supabase
            .from('usuarios')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              nombre: data.user.email!.split('@')[0],
              rol: 'administrador',
            })

          if (userError) {
            console.error('Error creando usuario:', userError)
            throw new Error('Error creando usuario: ' + userError.message)
          }
        }

        toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.')
        setIsSignUp(false) // Cambiar a modo login
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Registrar intento de login fallido
          try {
            // Intentar obtener información del usuario por email para registrar login fallido
            const { data: usuarios } = await supabase
              .from('usuarios')
              .select('*')
              .eq('email', email)
              .limit(1)
            
            if (usuarios && usuarios.length > 0) {
              const usuario = usuarios[0]
              const { error: insertError } = await supabase.from('logins').insert({
                usuario_id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                exitoso: false,
                ip_address: 'No disponible',
                user_agent: navigator.userAgent,
              })
              if (insertError) {
                console.error('Error registrando login fallido:', insertError)
              }
            }
          } catch (loginError) {
            console.error('Error registrando login fallido:', loginError)
          }
          throw error
        }

        // Esperar un momento para asegurar que el usuario esté disponible
        await new Promise(resolve => setTimeout(resolve, 500))

        // Registrar login exitoso
        try {
          await registrarLogin('inicio_sesion')
          console.log('✅ Login registrado después de inicio de sesión exitoso')
        } catch (loginError) {
          console.error('Error al registrar login exitoso:', loginError)
        }

        toast.success('¡Bienvenido!')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error en la autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
      isSignUp 
        ? 'bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900' 
        : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-800'
    }`}>
      <div className={`bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-500 ${
        isSignUp ? 'border-2 border-blue-200' : 'border-2 border-purple-200'
      }`}>
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={true} animate={true} continuousRotate={true} />
          </div>
          <div className={`mt-4 p-4 rounded-xl ${
            isSignUp 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-purple-50 border border-purple-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-1 ${
              isSignUp ? 'text-blue-700' : 'text-purple-700'
            }`}>
              {isSignUp ? '✨ Crear Nueva Cuenta' : '🔐 Iniciar Sesión'}
            </h2>
            <p className="text-sm text-gray-600">
              {isSignUp 
                ? 'Únete a AIVI Silver House y gestiona tu joyería' 
                : 'Bienvenido de vuelta a AIVI Silver House'}
            </p>
          </div>
        </div>
     {/* Formulario */}
     <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isSignUp ? 'text-blue-700' : 'text-purple-700'
            }`}>
              📧 Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 transition-all ${
                isSignUp
                  ? 'border-blue-300 focus:ring-blue-500'
                  : 'border-purple-300 focus:ring-purple-500'
              }`}
              placeholder="AiviSilverHouse@email.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isSignUp ? 'text-blue-700' : 'text-purple-700'
            }`}>
              🔒 Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400 transition-all ${
                isSignUp
                  ? 'border-blue-300 focus:ring-blue-500'
                  : 'border-purple-300 focus:ring-purple-500'
              }`}
              placeholder="••••••••"
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              isSignUp
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
            }`}
          >
            {loading
              ? '⏳ Procesando...'
              : isSignUp
              ? '✨ Crear Mi Cuenta'
              : '🚀 Iniciar Sesión'}
          </button>
        </form>

        {/* Cambiar entre Login/Registro */}
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={`mt-4 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              isSignUp
                ? 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            {isSignUp
              ? '← Volver a Iniciar Sesión'
              : 'Regístrate ahora →'}
          </button>
        </div>
      </div>
    </div>
  )
}
