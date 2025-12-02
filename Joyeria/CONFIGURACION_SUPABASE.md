# ⚙️ Configuración de Supabase - Desactivar Verificación de Email

Para desactivar la verificación de correo electrónico en Supabase:

## Pasos:

1. **Ve a tu proyecto en Supabase Dashboard**
   - Abre tu proyecto: https://supabase.com/dashboard/project/dsxefinyindvmpdgnpve

2. **Ve a Authentication > Settings**

3. **En la sección "Email Auth"**, busca:
   - **"Enable email confirmations"** o **"Confirm email"**
   - **DESACTÍVALO** (toggle off)

4. **Guarda los cambios**

## Alternativa (vía SQL):

También puedes ejecutar este SQL en el SQL Editor de Supabase:

```sql
-- Actualizar configuración para desactivar verificación de email
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{email_confirm_enabled}',
  'false'::jsonb
);
```

**Nota**: Esta configuración debe hacerse desde el Dashboard de Supabase, ya que los cambios de configuración de auth normalmente se hacen desde la interfaz.

## Resultado:

- Los usuarios podrán registrarse sin necesidad de verificar su correo
- Podrán iniciar sesión inmediatamente después de registrarse
- Solo se permitirán 3 usuarios administradores máximo
