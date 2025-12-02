-- Script de prueba para verificar acceso a logins
-- Ejecuta este script para verificar que las políticas funcionan

-- 1. Verificar que puedes ver los logins (debe funcionar si estás autenticado)
SELECT 
  'Prueba de lectura de logins' AS prueba,
  COUNT(*) AS total_registros
FROM public.logins;

-- 2. Verificar políticas activas
SELECT 
  policyname,
  cmd AS operacion,
  CASE 
    WHEN qual IS NOT NULL THEN 'Tiene condición'
    ELSE 'Sin condición'
  END AS tiene_condicion,
  qual AS condicion
FROM pg_policies
WHERE tablename = 'logins'
ORDER BY policyname;

-- 3. Intentar insertar un login de prueba (solo si estás autenticado)
-- Descomenta las siguientes líneas para probar la inserción:
/*
INSERT INTO public.logins (usuario_id, email, nombre, ip_address, user_agent, exitoso)
SELECT 
  auth.uid() as usuario_id,
  (SELECT email FROM public.usuarios WHERE id = auth.uid()) as email,
  (SELECT nombre FROM public.usuarios WHERE id = auth.uid()) as nombre,
  '127.0.0.1' as ip_address,
  'Test Browser' as user_agent,
  true as exitoso
WHERE auth.uid() IS NOT NULL;
*/

-- 4. Verificar el usuario actual autenticado
SELECT 
  'Usuario actual' AS info,
  auth.uid() AS user_id,
  auth.role() AS role;

