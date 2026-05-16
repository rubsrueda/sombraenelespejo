-- Esquema de tablas para Abel de Ferro (Supabase)
-- Copia y pega en la sección SQL de tu proyecto Supabase

-- Tabla de usuarios registrados
create table if not exists af_usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text,
  idioma text,
  creado_en timestamp with time zone default now(),
  ultimo_login timestamp with time zone
);

-- Tabla de compras realizadas
create table if not exists af_compras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references af_usuarios(id) on delete set null,
  email text not null,
  producto text not null,
  stripe_payment_id text,
  monto numeric,
  moneda text,
  fecha_pago timestamp with time zone default now(),
  exito boolean default true,
  metadata jsonb
);

-- Tabla de entitlements (accesos concedidos)
create table if not exists af_entitlements (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references af_usuarios(id) on delete cascade,
  producto text not null,
  concedido_en timestamp with time zone default now(),
  activo boolean default true
);

-- Tabla de logs de acciones (opcional)
create table if not exists af_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references af_usuarios(id) on delete set null,
  email text,
  accion text not null,
  detalles jsonb,
  fecha timestamp with time zone default now()
);

========================

--creado hasta aquí el esquema de tablas para Abel de Ferro en Supabase. Puedes modificarlo según tus necesidades específicas, pero esta estructura básica debería cubrir la mayoría de los casos de uso relacionados con usuarios, compras y entitlements.

=========================
