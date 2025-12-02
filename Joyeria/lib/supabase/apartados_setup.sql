-- ============================================
-- ESQUEMA PARA PRODUCTOS APARTADOS
-- ============================================

-- Tabla para productos apartados
CREATE TABLE IF NOT EXISTS public.apartados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  cliente TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  monto_apartado DECIMAL(10, 2) NOT NULL,
  monto_total DECIMAL(10, 2) NOT NULL,
  monto_restante DECIMAL(10, 2) GENERATED ALWAYS AS (monto_total - monto_apartado) STORED,
  fecha_apartado DATE DEFAULT CURRENT_DATE,
  fecha_limite DATE NOT NULL,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'vencido', 'cancelado')),
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_apartados_producto ON public.apartados(producto_id);
CREATE INDEX IF NOT EXISTS idx_apartados_estado ON public.apartados(estado);
CREATE INDEX IF NOT EXISTS idx_apartados_fecha_limite ON public.apartados(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_apartados_cliente ON public.apartados(cliente);

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_apartados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar fecha_actualizacion
DROP TRIGGER IF EXISTS update_apartados_updated_at ON public.apartados;
CREATE TRIGGER update_apartados_updated_at BEFORE UPDATE ON public.apartados
  FOR EACH ROW EXECUTE FUNCTION update_apartados_updated_at();

-- Función para marcar apartados vencidos automáticamente
CREATE OR REPLACE FUNCTION marcar_apartados_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE public.apartados
  SET estado = 'vencido'
  WHERE estado = 'activo'
    AND fecha_limite < CURRENT_DATE;
END;
$$ language 'plpgsql';

-- Políticas de seguridad RLS
ALTER TABLE public.apartados ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver apartados
DROP POLICY IF EXISTS "Todos pueden ver apartados" ON public.apartados;
CREATE POLICY "Todos pueden ver apartados" ON public.apartados
  FOR SELECT USING (true);

-- Política: Usuarios pueden insertar apartados
DROP POLICY IF EXISTS "Usuarios pueden insertar apartados" ON public.apartados;
CREATE POLICY "Usuarios pueden insertar apartados" ON public.apartados
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Usuarios pueden actualizar apartados
DROP POLICY IF EXISTS "Usuarios pueden actualizar apartados" ON public.apartados;
CREATE POLICY "Usuarios pueden actualizar apartados" ON public.apartados
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Usuarios pueden eliminar apartados
DROP POLICY IF EXISTS "Usuarios pueden eliminar apartados" ON public.apartados;
CREATE POLICY "Usuarios pueden eliminar apartados" ON public.apartados
  FOR DELETE USING (auth.uid() = usuario_id);

