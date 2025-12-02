# 💎 Sistema de Gestión de Joyería

Sistema completo para gestionar productos, ventas, gastos y ganancias de un negocio de joyería con sincronización en tiempo real e inteligencia artificial.

## 🚀 Características

- ✅ **Gestión de Productos**: Registro con imágenes, precios de compra/venta, stock y categorías
- ✅ **Control de Ventas**: Registro de ventas con cálculo automático de ganancias
- ✅ **Gestión de Gastos**: Registro y categorización de gastos
- ✅ **Cálculo de Ganancias**: Cálculo automático de ganancias brutas y netas
- ✅ **Estado de Disponibilidad**: Seguimiento de productos disponibles/vendidos
- ✅ **Subida de Imágenes**: Almacenamiento de imágenes de productos
- ✅ **Sincronización en Tiempo Real**: Múltiples dispositivos sincronizados con Supabase
- ✅ **Gráficas y Estadísticas**: Visualización de ventas, ganancias y gastos
- ✅ **Inteligencia Artificial**: Extracción automática de información de productos usando Hugging Face (gratuita)

## 📋 Requisitos Previos

1. **Node.js** 18+ instalado
2. Cuenta en **Supabase** (gratuita)
3. Cuenta en **Hugging Face** (gratuita, para IA - opcional)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase

# Hugging Face AI (Gratuita - Opcional)
HUGGING_FACE_API_KEY=tu_hugging_face_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)

2. Ejecuta el script SQL en el SQL Editor de Supabase:
   - Abre `lib/supabase/setup.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor de Supabase y ejecuta

3. Crea un bucket de almacenamiento para imágenes:
   - Ve a Storage en Supabase
   - Crea un bucket llamado `productos`
   - Configura las políticas para permitir lectura pública y escritura autenticada

4. Obtén las keys de tu proyecto:
   - Ve a Settings > API
   - Copia la URL y las keys (anon key y service_role_key)

## 🤖 Configuración de Hugging Face (IA - Opcional)

1. Crea una cuenta en [Hugging Face](https://huggingface.co)

2. Crea un Access Token:
   - Ve a Settings > Access Tokens
   - Crea un nuevo token con permisos de lectura

3. Copia el token a tu archivo `.env.local`

## 🚀 Ejecutar la Aplicación

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar en producción
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Características Adicionales Recomendadas

1. **Notificaciones Push**: Notificar nuevas ventas o productos a todos los dispositivos
2. **Exportar Reportes**: Generar reportes en PDF o Excel
3. **Backup Automático**: Backup periódico de datos
4. **Multi-idioma**: Soporte para múltiples idiomas
5. **Roles y Permisos**: Diferentes niveles de acceso (admin, empleado)
6. **Código de Barras**: Escaneo de códigos de barras para productos
7. **Recordatorios**: Recordatorios de pagos pendientes o inventario bajo

## 🔒 Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) habilitado en todas las tablas
- Variables de entorno para información sensible
- Validación de datos en frontend y backend

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 🤝 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación de Supabase y Hugging Face
2. Verifica que todas las variables de entorno estén configuradas correctamente
3. Revisa los logs de la consola para errores específicos

## 🎉 ¡Listo!

Tu sistema de gestión de joyería está listo para usar. Disfruta gestionando tu negocio de manera eficiente y moderna.
