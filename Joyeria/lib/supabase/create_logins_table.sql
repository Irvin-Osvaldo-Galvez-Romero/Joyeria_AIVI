-- Script para crear la tabla de logins si no existe
-- Ejecuta este script en el SQL Editor de Supabase si los logins no aparecen

-- Tabla de logins (auditoría de inicios de sesión)
CREATE TABLE IF NOT EXISTS public.logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  fecha_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exitoso BOOLEAN DEFAULT true
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_logins_fecha ON public.logins(fecha_login);
CREATE INDEX IF NOT EXISTS idx_logins_usuario ON public.logins(usuario_id);

-- Habilitar RLS
ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden ver todos los logins (para auditoría)
DROP POLICY IF EXISTS "Todos pueden ver logins" ON public.logins;
CREATE POLICY "Todos pueden ver logins" ON public.logins
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política: Permitir inserción de logins (necesario para registrar logins)
DROP POLICY IF EXISTS "Usuarios pueden insertar logins" ON public.logins;
CREATE POLICY "Usuarios pueden insertar logins" ON public.logins
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

