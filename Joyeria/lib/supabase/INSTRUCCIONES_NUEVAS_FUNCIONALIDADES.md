# Instrucciones para Activar Pagos a Plazos y Apartados

## 📋 Resumen de Funcionalidades

Se han agregado dos nuevas funcionalidades al sistema:

1. **Pagos a Plazos**: Permite crear planes de pago para ventas existentes, dividiendo el pago en múltiples cuotas con fechas de vencimiento.
2. **Productos Apartados**: Permite apartar productos para clientes con un pago inicial y una fecha límite para completar el pago.

## 🗄️ Configuración de Base de Datos

### Paso 1: Ejecutar Scripts SQL

Necesitas ejecutar dos scripts SQL en tu base de datos de Supabase:

#### 1.1. Pagos a Plazos

Ejecuta el contenido del archivo `lib/supabase/pagos_plazos_setup.sql` en el SQL Editor de Supabase.

Este script crea:
- Tabla `ventas_plazos`: Almacena los planes de pago asociados a ventas
- Tabla `pagos_plazos`: Almacena los pagos individuales de cada plan
- Triggers y funciones para actualizar estados automáticamente
- Políticas RLS para seguridad

#### 1.2. Apartados

Ejecuta el contenido del archivo `lib/supabase/apartados_setup.sql` en el SQL Editor de Supabase.

Este script crea:
- Tabla `apartados`: Almacena los productos apartados
- Triggers para actualizar fechas automáticamente
- Políticas RLS para seguridad

### Paso 2: Verificar Instalación

Después de ejecutar los scripts, verifica que las tablas se crearon correctamente:

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('ventas_plazos', 'pagos_plazos', 'apartados');
```

## 🎯 Funcionalidades Implementadas

### Pagos a Plazos

**Características:**
- Crear planes de pago para ventas existentes
- Dividir el pago total en múltiples cuotas (2-24 pagos)
- Registrar pagos parciales o completos
- Seguimiento automático de estados (pendiente, en proceso, completado, vencido)
- Visualización de progreso de pago
- Alertas para pagos vencidos

**Cómo usar:**
1. Ve a la pestaña "Pagos a Plazos" en el Dashboard
2. Haz clic en "Nueva Venta a Plazos"
3. Selecciona una venta existente
4. Configura el número de pagos y fecha límite
5. El sistema creará automáticamente los pagos individuales
6. Registra cada pago cuando el cliente realice el pago

### Productos Apartados

**Características:**
- Apartar productos con un pago inicial (mínimo 10% del precio)
- Registrar información del cliente (nombre, teléfono, email)
- Fecha límite para completar el pago
- Estados: activo, completado, vencido, cancelado
- Visualización de progreso de apartado
- Alertas para apartados próximos a vencer

**Cómo usar:**
1. Ve a la pestaña "Apartados" en el Dashboard
2. Haz clic en "Nuevo Apartado"
3. Selecciona un producto disponible
4. Ingresa la información del cliente
5. Establece el monto de apartado y fecha límite
6. El producto quedará marcado como apartado

## 📊 Nuevas Pestañas en el Dashboard

Se han agregado dos nuevas pestañas al menú lateral:

1. **Pagos a Plazos** (ícono: Calendar)
   - Resumen de pagos pendientes y completados
   - Lista de todas las ventas a plazos
   - Filtros por estado
   - Registro de pagos individuales

2. **Apartados** (ícono: Clock)
   - Resumen de apartados activos
   - Lista de productos apartados
   - Búsqueda por cliente, producto, teléfono o email
   - Filtros por estado

## 🔄 Flujo de Trabajo Recomendado

### Para Pagos a Plazos:
1. Primero registra la venta normalmente en "Ventas"
2. Luego ve a "Pagos a Plazos" y crea el plan de pago
3. Registra cada pago cuando el cliente lo realice
4. El sistema actualizará automáticamente los estados

### Para Apartados:
1. Ve a "Apartados" y crea un nuevo apartado
2. El producto quedará reservado para ese cliente
3. Cuando el cliente complete el pago, marca el apartado como "Completado"
4. Si el cliente no completa el pago, puedes cancelar el apartado

## ⚠️ Notas Importantes

- Los productos apartados **NO** se descuentan del stock automáticamente, pero están reservados
- Los pagos a plazos se pueden crear solo para ventas que no tengan ya un plan de pago
- Los apartados vencidos se marcan automáticamente cuando se carga la página
- Los pagos vencidos se marcan automáticamente cuando se actualiza la información

## 🐛 Solución de Problemas

Si encuentras errores:

1. **Error: "tabla no existe"**
   - Verifica que ejecutaste los scripts SQL correctamente
   - Revisa que las tablas estén en el esquema `public`

2. **Error: "permiso denegado"**
   - Verifica que las políticas RLS estén correctamente configuradas
   - Asegúrate de estar autenticado

3. **Los estados no se actualizan**
   - Los estados se actualizan automáticamente cuando se cargan las páginas
   - Si no se actualizan, recarga la página

## 📝 Próximas Mejoras Sugeridas

- Notificaciones automáticas para pagos vencidos
- Reportes de pagos pendientes
- Integración con sistema de recordatorios
- Exportación de reportes de apartados
- Historial completo de pagos por cliente

