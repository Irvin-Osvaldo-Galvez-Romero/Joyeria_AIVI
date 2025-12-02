-- ============================================
-- ESQUEMA PARA PAGOS A PLAZOS
-- ============================================

-- Tabla para ventas a plazos (relaciona ventas con planes de pago)
CREATE TABLE IF NOT EXISTS public.ventas_plazos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
  numero_pagos INTEGER NOT NULL CHECK (numero_pagos > 0),
  monto_total DECIMAL(10, 2) NOT NULL,
  monto_por_pago DECIMAL(10, 2) NOT NULL,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_limite DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'vencido', 'cancelado')),
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL
);

-- Tabla para pagos individuales de cada plan
CREATE TABLE IF NOT EXISTS public.pagos_plazos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_plazo_id UUID REFERENCES public.ventas_plazos(id) ON DELETE CASCADE NOT NULL,
  numero_pago INTEGER NOT NULL CHECK (numero_pago > 0),
  monto DECIMAL(10, 2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial', 'vencido')),
  metodo_pago TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_plazos_venta ON public.ventas_plazos(venta_id);
CREATE INDEX IF NOT EXISTS idx_ventas_plazos_estado ON public.ventas_plazos(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_plazos_fecha_limite ON public.ventas_plazos(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_pagos_plazos_venta_plazo ON public.pagos_plazos(venta_plazo_id);
CREATE INDEX IF NOT EXISTS idx_pagos_plazos_estado ON public.pagos_plazos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_plazos_fecha_vencimiento ON public.pagos_plazos(fecha_vencimiento);

-- Función para actualizar fecha_actualizacion en pagos_plazos
CREATE OR REPLACE FUNCTION update_pagos_plazos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar fecha_actualizacion
DROP TRIGGER IF EXISTS update_pagos_plazos_updated_at ON public.pagos_plazos;
CREATE TRIGGER update_pagos_plazos_updated_at BEFORE UPDATE ON public.pagos_plazos
  FOR EACH ROW EXECUTE FUNCTION update_pagos_plazos_updated_at();

-- Función para actualizar estado de venta_plazo cuando se actualiza un pago
CREATE OR REPLACE FUNCTION actualizar_estado_venta_plazo()
RETURNS TRIGGER AS $$
DECLARE
  total_pagado DECIMAL(10, 2);
  monto_total_venta DECIMAL(10, 2);
  pagos_pendientes INTEGER;
  pagos_vencidos INTEGER;
BEGIN
  -- Calcular total pagado
  SELECT COALESCE(SUM(monto_pagado), 0), COUNT(*) FILTER (WHERE estado = 'pendiente'), COUNT(*) FILTER (WHERE estado = 'vencido')
  INTO total_pagado, pagos_pendientes, pagos_vencidos
  FROM public.pagos_plazos
  WHERE venta_plazo_id = NEW.venta_plazo_id;

  -- Obtener monto total de la venta
  SELECT monto_total INTO monto_total_venta
  FROM public.ventas_plazos
  WHERE id = NEW.venta_plazo_id;

  -- Actualizar estado de venta_plazo
  UPDATE public.ventas_plazos
  SET estado = CASE
    WHEN total_pagado >= monto_total_venta THEN 'completado'
    WHEN pagos_vencidos > 0 THEN 'vencido'
    WHEN pagos_pendientes > 0 THEN 'en_proceso'
    ELSE estado
  END
  WHERE id = NEW.venta_plazo_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar estado de venta_plazo
DROP TRIGGER IF EXISTS actualizar_estado_venta_plazo_trigger ON public.pagos_plazos;
CREATE TRIGGER actualizar_estado_venta_plazo_trigger
  AFTER INSERT OR UPDATE ON public.pagos_plazos
  FOR EACH ROW EXECUTE FUNCTION actualizar_estado_venta_plazo();

-- Función para marcar pagos vencidos automáticamente
CREATE OR REPLACE FUNCTION marcar_pagos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE public.pagos_plazos
  SET estado = 'vencido'
  WHERE estado IN ('pendiente', 'parcial')
    AND fecha_vencimiento < CURRENT_DATE
    AND monto_pagado < monto;
END;
$$ language 'plpgsql';

-- Políticas de seguridad RLS
ALTER TABLE public.ventas_plazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_plazos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver ventas_plazos
DROP POLICY IF EXISTS "Todos pueden ver ventas_plazos" ON public.ventas_plazos;
CREATE POLICY "Todos pueden ver ventas_plazos" ON public.ventas_plazos
  FOR SELECT USING (true);

-- Política: Usuarios pueden insertar ventas_plazos
DROP POLICY IF EXISTS "Usuarios pueden insertar ventas_plazos" ON public.ventas_plazos;
CREATE POLICY "Usuarios pueden insertar ventas_plazos" ON public.ventas_plazos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Usuarios pueden actualizar ventas_plazos
DROP POLICY IF EXISTS "Usuarios pueden actualizar ventas_plazos" ON public.ventas_plazos;
CREATE POLICY "Usuarios pueden actualizar ventas_plazos" ON public.ventas_plazos
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Todos pueden ver pagos_plazos
DROP POLICY IF EXISTS "Todos pueden ver pagos_plazos" ON public.pagos_plazos;
CREATE POLICY "Todos pueden ver pagos_plazos" ON public.pagos_plazos
  FOR SELECT USING (true);

-- Política: Usuarios pueden insertar pagos_plazos
DROP POLICY IF EXISTS "Usuarios pueden insertar pagos_plazos" ON public.pagos_plazos;
CREATE POLICY "Usuarios pueden insertar pagos_plazos" ON public.pagos_plazos
  FOR INSERT WITH CHECK (true);

-- Política: Usuarios pueden actualizar pagos_plazos
DROP POLICY IF EXISTS "Usuarios pueden actualizar pagos_plazos" ON public.pagos_plazos;
CREATE POLICY "Usuarios pueden actualizar pagos_plazos" ON public.pagos_plazos
  FOR UPDATE USING (true);

