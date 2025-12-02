-- Script para crear el usuario faltante en la tabla usuarios
-- Ejecuta este script si tu usuario existe en auth.users pero no en public.usuarios
-- Reemplaza 'TU_USER_ID' con tu ID de usuario

-- Primero, obtén tu user_id ejecutando esto:
SELECT id, email FROM auth.users;

-- Luego, ejecuta esto reemplazando 'TU_USER_ID' con tu ID real:
-- INSERT INTO public.usuarios (id, email, nombre, rol)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'nombre', split_part(email, '@', 1)) as nombre,
--   'administrador' as rol
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.usuarios)
-- ON CONFLICT (id) DO NOTHING;

-- O ejecuta esto para crear TODOS los usuarios faltantes automáticamente:
INSERT INTO public.usuarios (id, email, nombre, rol)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nombre', split_part(email, '@', 1)) as nombre,
  'administrador' as rol
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon
SELECT * FROM public.usuarios;

