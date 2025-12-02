-- Script de verificación para logins
-- Ejecuta este script en el SQL Editor de Supabase para verificar:
-- 1. Si existe la tabla
-- 2. Si hay datos
-- 3. Si las políticas RLS están configuradas

-- Verificar si la tabla existe y contar registros
SELECT 
  'Total de logins en la base de datos' AS descripcion,
  COUNT(*) AS cantidad
FROM public.logins;

-- Ver los últimos 10 logins
SELECT 
  id,
  email,
  nombre,
  fecha_login,
  exitoso,
  ip_address
FROM public.logins
ORDER BY fecha_login DESC
LIMIT 10;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'logins';

-- Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'logins';

