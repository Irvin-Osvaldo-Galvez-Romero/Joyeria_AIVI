# 🚀 Guía Rápida de Configuración

## Paso 1: Instalar Dependencias

```bash
npm install
```

## Paso 2: Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratuito
2. En el SQL Editor, ejecuta el contenido de `lib/supabase/setup.sql`
3. Ve a Storage y crea un bucket llamado `productos` (público para lectura, autenticado para escritura)
4. Copia tu URL y keys de Settings > API

## Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Opcional - Para IA
HUGGING_FACE_API_KEY=tu_hugging_face_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Paso 4: Ejecutar la Aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Paso 5: Crear tu Primera Cuenta

1. Haz clic en "Regístrate"
2. Ingresa tu email y contraseña
3. Verifica tu email (si Supabase lo requiere)
4. ¡Listo! Ya puedes usar la aplicación

## 🤖 Configurar IA (Opcional)

1. Crea cuenta en [Hugging Face](https://huggingface.co)
2. Ve a Settings > Access Tokens
3. Crea un token y cópialo a `.env.local`

## ✅ ¡Listo!

Tu sistema está configurado y listo para usar.
