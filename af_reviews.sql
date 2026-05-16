-- Tabla de reseñas para Supabase
create table if not exists af_reviews (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  email text,
  nombre text not null,
  valoracion int not null check (valoracion between 1 and 5),
  comentario text not null,
  creado_en timestamp with time zone default now()
);
