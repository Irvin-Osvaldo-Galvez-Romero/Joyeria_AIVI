-- Script completo para solucionar el problema de logins
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Asegurar que RLS esté habilitado
ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Todos pueden ver logins" ON public.logins;
DROP POLICY IF EXISTS "Usuarios pueden insertar logins" ON public.logins;
DROP POLICY IF EXISTS "Publico puede ver logins" ON public.logins;
DROP POLICY IF EXISTS "Cualquiera puede ver logins" ON public.logins;
DROP POLICY IF EXISTS "Authenticated users can view logins" ON public.logins;
DROP POLICY IF EXISTS "Users can insert their own logins" ON public.logins;

-- 3. Crear política para SELECT (ver logins) - Permitir a usuarios autenticados ver todos los logins
CREATE POLICY "Todos pueden ver logins" 
ON public.logins
FOR SELECT 
TO authenticated
USING (true);

-- 4. Crear política para INSERT (insertar logins) - Permitir a usuarios insertar sus propios logins
CREATE POLICY "Usuarios pueden insertar logins" 
ON public.logins
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- 5. Verificar que las políticas se crearon
SELECT 
  policyname AS nombre_politica,
  cmd AS operacion,
  roles AS roles_permitidos,
  qual AS condicion_select,
  with_check AS condicion_insert
FROM pg_policies
WHERE tablename = 'logins'
ORDER BY policyname;

-- 6. Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE tablename = 'logins';

-- 7. Contar registros actuales
SELECT 
  'Total de logins' AS descripcion,
  COUNT(*) AS cantidad
FROM public.logins;

