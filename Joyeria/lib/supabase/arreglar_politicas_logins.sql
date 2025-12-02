-- Script para arreglar las políticas RLS de la tabla logins
-- Ejecuta este script si los logins no se están mostrando

-- Asegurar que RLS esté habilitado
ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Todos pueden ver logins" ON public.logins;
DROP POLICY IF EXISTS "Usuarios pueden insertar logins" ON public.logins;
DROP POLICY IF EXISTS "Publico puede ver logins" ON public.logins;
DROP POLICY IF EXISTS "Cualquiera puede ver logins" ON public.logins;

-- Política: Todos los usuarios autenticados pueden ver todos los logins
CREATE POLICY "Todos pueden ver logins" ON public.logins
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política alternativa (si la anterior no funciona): Permitir a todos ver logins
-- Si la política anterior no funciona, descomenta esta y comenta la anterior:
-- CREATE POLICY "Todos pueden ver logins" ON public.logins
--   FOR SELECT 
--   USING (true);

-- Política: Los usuarios pueden insertar sus propios logins
CREATE POLICY "Usuarios pueden insertar logins" ON public.logins
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'logins';

