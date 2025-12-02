-- Tabla de usuarios (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'administrador',
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_compra DECIMAL(10, 2) NOT NULL,
  precio_venta DECIMAL(10, 2) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  imagen_url TEXT,
  categoria TEXT,
  proveedor TEXT,
  fecha_compra DATE DEFAULT CURRENT_DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  stock INTEGER DEFAULT 1
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES public.productos(id) NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  ganancia DECIMAL(10, 2) NOT NULL,
  cliente TEXT,
  fecha_venta DATE DEFAULT CURRENT_DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  metodo_pago TEXT
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto TEXT NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  fecha_gasto DATE DEFAULT CURRENT_DATE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL
);

-- Tabla de logins (auditoría de inicios de sesión)
CREATE TABLE IF NOT EXISTS public.logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  fecha_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exitoso BOOLEAN DEFAULT true
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_disponible ON public.productos(disponible);
CREATE INDEX IF NOT EXISTS idx_productos_usuario ON public.productos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON public.ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON public.ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON public.gastos(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario ON public.gastos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logins_fecha ON public.logins(fecha_login);
CREATE INDEX IF NOT EXISTS idx_logins_usuario ON public.logins(usuario_id);

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar fecha_actualizacion en productos
DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar stock al vender
CREATE OR REPLACE FUNCTION actualizar_stock_despues_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.productos
  SET stock = stock - NEW.cantidad,
      disponible = CASE WHEN stock - NEW.cantidad <= 0 THEN false ELSE disponible END
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar stock
DROP TRIGGER IF EXISTS actualizar_stock_venta ON public.ventas;
CREATE TRIGGER actualizar_stock_venta AFTER INSERT ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION actualizar_stock_despues_venta();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todos los productos (compartido entre dispositivos)
DROP POLICY IF EXISTS "Todos pueden ver productos" ON public.productos;
CREATE POLICY "Todos pueden ver productos" ON public.productos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden insertar productos" ON public.productos;
CREATE POLICY "Usuarios pueden insertar productos" ON public.productos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar productos" ON public.productos;
CREATE POLICY "Usuarios pueden actualizar productos" ON public.productos
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Los usuarios pueden ver todas las ventas
DROP POLICY IF EXISTS "Todos pueden ver ventas" ON public.ventas;
CREATE POLICY "Todos pueden ver ventas" ON public.ventas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden insertar ventas" ON public.ventas;
CREATE POLICY "Usuarios pueden insertar ventas" ON public.ventas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden ver todos los gastos
DROP POLICY IF EXISTS "Todos pueden ver gastos" ON public.gastos;
CREATE POLICY "Todos pueden ver gastos" ON public.gastos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden insertar gastos" ON public.gastos;
CREATE POLICY "Usuarios pueden insertar gastos" ON public.gastos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios pueden ver todos los usuarios
DROP POLICY IF EXISTS "Todos pueden ver usuarios" ON public.usuarios;
CREATE POLICY "Todos pueden ver usuarios" ON public.usuarios
  FOR SELECT USING (true);

-- Política: Permitir inserción de usuarios (necesario para registro)
DROP POLICY IF EXISTS "Usuarios pueden insertarse" ON public.usuarios;
CREATE POLICY "Usuarios pueden insertarse" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: Los usuarios autenticados pueden ver todos los logins (para auditoría)
DROP POLICY IF EXISTS "Todos pueden ver logins" ON public.logins;
CREATE POLICY "Todos pueden ver logins" ON public.logins
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política: Permitir inserción de logins (necesario para registrar logins)
DROP POLICY IF EXISTS "Usuarios pueden insertar logins" ON public.logins;
CREATE POLICY "Usuarios pueden insertar logins" ON public.logins
  FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Función para crear automáticamente registro en usuarios cuando se crea en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'administrador'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
