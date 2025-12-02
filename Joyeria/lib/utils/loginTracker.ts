import { supabase } from '@/lib/supabase/client'

/**
 * Registra un login en la tabla de auditoría
 * @param motivo - Razón del registro ('inicio_sesion' | 'sesion_activa' | 'acceso_auditorias')
 */
export async function registrarLogin(motivo: 'inicio_sesion' | 'sesion_activa' | 'acceso_auditorias' = 'inicio_sesion') {
  try {
    console.log('🔐 Iniciando registro de login, motivo:', motivo)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error obteniendo usuario:', userError)
      return
    }
    
    if (!user) {
      console.log('⚠️ No hay usuario autenticado, no se puede registrar login')
      return
    }

    console.log('👤 Usuario encontrado:', user.email)

    // Verificar si ya hay un login reciente (últimos 10 segundos) para evitar duplicados
    // Reducido de 30 a 10 segundos para permitir más registros
    const hace10Segundos = new Date(Date.now() - 10 * 1000).toISOString()
    const { data: loginReciente, error: checkError } = await supabase
      .from('logins')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('exitoso', true)
      .gte('fecha_login', hace10Segundos)
      .limit(1)

    if (checkError) {
      console.warn('Advertencia al verificar login reciente:', checkError)
    }

    // Si hay un login reciente del mismo tipo, no registrar otro
    if (loginReciente && loginReciente.length > 0 && motivo === 'sesion_activa') {
      console.log('⏭️ Login reciente encontrado, omitiendo registro duplicado')
      return
    }

    let usuario: any = null
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (usuarioError && usuarioError.code === 'PGRST116') {
      // Usuario no existe en la tabla usuarios, crearlo automáticamente
      console.log('⚠️ Usuario no existe en tabla usuarios, creándolo...')
      
      const nuevoUsuario = {
        id: user.id,
        email: user.email || '',
        nombre: user.email?.split('@')[0] || 'Usuario',
        rol: 'administrador',
      }

      const { data: usuarioCreado, error: createError } = await supabase
        .from('usuarios')
        .insert(nuevoUsuario)
        .select()
        .single()

      // Esperar un momento para asegurar que se guardó
      if (usuarioCreado) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (createError) {
        console.error('❌ Error creando usuario en tabla usuarios:', createError)
        return
      }

      usuario = usuarioCreado
      console.log('✅ Usuario creado en tabla usuarios:', usuario.nombre)
    } else if (usuarioError) {
      console.error('Error obteniendo datos del usuario:', usuarioError)
      return
    } else {
      usuario = usuarioData
      console.log('✅ Datos del usuario obtenidos:', usuario.nombre)
    }

    if (!usuario) {
      console.error('⚠️ No se pudo obtener o crear el usuario')
      return
    }

    // Obtener IP (si está disponible)
    let ipAddress = 'No disponible'
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
      })
      const ipData = await ipResponse.json()
      ipAddress = ipData.ip || 'No disponible'
    } catch (ipError) {
      // Si falla la obtención de IP, continuar sin ella
      console.log('No se pudo obtener la IP')
    }

    const loginData = {
      usuario_id: user.id,
      email: user.email || usuario.email,
      nombre: usuario.nombre,
      exitoso: true,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
    }

    console.log('📝 Intentando insertar login:', {
      usuario_id: loginData.usuario_id,
      email: loginData.email,
      nombre: loginData.nombre,
      motivo
    })

    const { data, error: insertError } = await supabase
      .from('logins')
      .insert(loginData)
      .select()

    if (insertError) {
      console.error('❌ Error insertando login:', insertError)
      console.error('Detalles del error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      
      // Si hay error de política, mostrar mensaje claro
      if (insertError.message.includes('policy') || 
          insertError.message.includes('permission') || 
          insertError.message.includes('row-level security')) {
        console.error('🔒 ERROR DE POLÍTICA RLS:')
        console.error('Las políticas RLS no están permitiendo la inserción.')
        console.error('Ejecuta el script arreglar_politicas_logins.sql en Supabase')
      }
    } else {
      console.log('✅ Login registrado exitosamente:', {
        motivo,
        login_id: data?.[0]?.id,
        email: loginData.email
      })
    }
  } catch (error: any) {
    console.error('❌ Error general registrando login:', error)
    console.error('Stack trace:', error.stack)
  }
}

