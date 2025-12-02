# 🔧 Configuración de Variables de Entorno

## Archivo .env.local

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dsxefinyindvmpdgnpve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeGVmaW55aW5kdm1wZGducHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTYxNTMsImV4cCI6MjA3OTg3MjE1M30.EkgH72arv3LG0wtUSBzZHmqCRsIWi3fnC_3kG_AiV94
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeGVmaW55aW5kdm1wZGducHZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI5NjE1MywiZXhwIjoyMDc5ODcyMTUzfQ.VdBAIYp-1jYTXDKMHEeF0REnOJj_-imxIwBbDJqooN0

# Hugging Face AI (Gratuita - Opcional)
HUGGING_FACE_API_KEY=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

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Pasos para Configurar

1. **Crear el archivo .env.local**:
   - En la raíz del proyecto (donde está package.json)
   - Copia y pega el contenido de arriba

2. **Ejecutar el SQL en Supabase**:
   - Ve a tu proyecto en Supabase
   - Abre el SQL Editor
   - Copia todo el contenido de `lib/supabase/setup.sql`
   - Pégalo y ejecuta

4. **Crear el bucket de Storage**:
   - En Supabase, ve a Storage
   - Crea un nuevo bucket llamado `productos`
   - Configura las políticas:
     - Lectura: Pública
     - Escritura: Solo usuarios autenticados

5. **Instalar dependencias**:
   ```bash
   npm install
   ```

6. **Ejecutar la aplicación**:
   ```bash
   npm run dev
   ```

## ✅ Verificación

Una vez configurado, la aplicación debería:
- ✅ Conectarse a Supabase correctamente
- ✅ Permitir registrarse/iniciar sesión
- ✅ Crear productos con imágenes
- ✅ Registrar ventas y gastos
- ✅ Mostrar gráficas y estadísticas

## 🔒 Seguridad

- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Las keys son sensibles, no las compartas públicamente
