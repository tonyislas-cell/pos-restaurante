-- ============================================================
-- POS Restaurante — Schema (Supabase / Postgres)
-- Optimizado con "Supabase Postgres Best Practices" v1.1.1
-- ------------------------------------------------------------
-- Cómo usarlo:
--   1. Supabase -> SQL Editor -> New query.
--   2. Pega TODO este archivo y pulsa "Run".
--   Se puede re-ejecutar sin duplicar datos (seeds idempotentes).
--
-- Buenas prácticas aplicadas:
--   [query-*]   Índice en TODAS las claves foráneas (Postgres NO los crea solo);
--               índices PARCIALES para las consultas calientes (cuentas abiertas,
--               ventas pagadas por fecha); se eliminaron índices redundantes
--               (barcode ya viene indexado por su restricción UNIQUE) y de baja
--               cardinalidad (status suelto).
--   [security-*] RLS activado en todas las tablas; políticas explícitas por rol
--               (anon) y por operación; función con search_path fijo.
--   [schema-*]  Tipos correctos (timestamptz, numeric para dinero); NOT NULL y
--               CHECK en importes/cantidades; columna GENERADA line_total;
--               updated_at mantenido por trigger; FKs con ON DELETE intencional.
-- ============================================================

-- ------------------------------------------------------------
-- (Opcional) RESET: descomenta si ya corriste una versión previa
-- y quieres empezar de cero. Borra TODOS los datos.
-- ------------------------------------------------------------
-- drop table if exists order_items cascade;
-- drop table if exists orders cascade;
-- drop table if exists products cascade;
-- drop table if exists dining_tables cascade;
-- drop table if exists categories cascade;

-- Extensión para gen_random_uuid()
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Función utilitaria: mantiene updated_at en cada UPDATE.
-- [security-*] search_path fijo a '' para evitar secuestro de esquema
-- (evita el warning "function_search_path_mutable" del linter de Supabase).
-- now() vive en pg_catalog, siempre accesible.
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. CATEGORÍAS (tipos editables: comida, bebida, postre, etc.)
-- ------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PRODUCTOS (artículos que el negocio administra a su gusto)
-- ------------------------------------------------------------
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  price        numeric(10,2) not null default 0 check (price >= 0),
  category_id  uuid references categories(id) on delete set null,
  barcode      text unique,          -- UNIQUE ya crea su propio índice
  image_url    text,                 -- foto de referencia (Supabase Storage)
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Para bases de datos ya creadas antes de añadir la imagen (idempotente).
alter table products add column if not exists image_url text;

-- [query-*] Índice de la FK category_id (acelera joins y borrados de categoría).
create index if not exists idx_products_category on products(category_id);
-- [query-partial] Listado de productos vendibles ordenados por nombre.
create index if not exists idx_products_active_name on products(name) where active;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated
  before update on products
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 3. MESAS
-- ------------------------------------------------------------
create table if not exists dining_tables (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. CUENTAS (una cuenta abierta por mesa; al cobrar pasa a 'paid')
-- ------------------------------------------------------------
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  table_id        uuid references dining_tables(id) on delete set null,
  status          text not null default 'open'
                    check (status in ('open','paid','cancelled')),
  payment_method  text check (payment_method in ('efectivo','tarjeta')),
  total           numeric(10,2) not null default 0 check (total >= 0),
  cash_received   numeric(10,2) check (cash_received is null or cash_received >= 0),
  change_due      numeric(10,2) check (change_due   is null or change_due   >= 0),
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,        -- momento del cobro
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- [query-*] FK table_id indexada (borrados/joins de mesas rápidos).
create index if not exists idx_orders_table_id on orders(table_id);
-- [query-partial] Cuentas ABIERTAS: la consulta más frecuente (pantalla de mesas).
create index if not exists idx_orders_open on orders(table_id) where status = 'open';
-- [query-partial] Ventas COBRADAS por fecha: dashboard y reportes día/semana.
create index if not exists idx_orders_paid_closed on orders(closed_at) where status = 'paid';

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated
  before update on orders
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 5. LÍNEAS DEL PEDIDO
--   Guardamos nombre y precio "congelados" (snapshot) para que los
--   reportes históricos no cambien si luego editas el producto.
--   line_total es una columna GENERADA: siempre consistente, sin que
--   la app tenga que calcularla. [schema-*][advanced-*]
-- ------------------------------------------------------------
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,           -- snapshot
  unit_price    numeric(10,2) not null check (unit_price >= 0), -- snapshot
  quantity      int not null default 1 check (quantity > 0),
  line_total    numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now()
);

-- [query-*] Ambas FKs indexadas: order_id (traer líneas de una cuenta)
-- y product_id (borrar un producto sin escanear toda la tabla).
create index if not exists idx_order_items_order   on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

-- ============================================================
-- SEGURIDAD (RLS) — [security-*]
-- ------------------------------------------------------------
-- MVP de un solo local: la app usa la anon key desde el navegador,
-- así que 'anon' necesita CRUD completo. Habilitamos RLS en todas las
-- tablas y creamos políticas EXPLÍCITAS por operación para el rol anon.
--
-- ⚠️  La anon key es pública: esto NO es seguridad real. Para exponerlo
-- públicamente o manejar datos sensibles, mover las escrituras a un
-- backend (service_role) y usar Supabase Auth con políticas por usuario.
-- ============================================================
alter table categories    enable row level security;
alter table products      enable row level security;
alter table dining_tables enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;

do $$
declare
  t   text;
  op  text;
begin
  foreach t in array array['categories','products','dining_tables','orders','order_items']
  loop
    -- Limpia políticas previas (idempotente).
    execute format('drop policy if exists %I on %I;', 'anon_select_' || t, t);
    execute format('drop policy if exists %I on %I;', 'anon_insert_' || t, t);
    execute format('drop policy if exists %I on %I;', 'anon_update_' || t, t);
    execute format('drop policy if exists %I on %I;', 'anon_delete_' || t, t);
    execute format('drop policy if exists %I on %I;', 'acceso_pos', t); -- de versiones previas

    -- Políticas explícitas por operación (más claras que un FOR ALL).
    execute format('create policy %I on %I for select to anon using (true);',
                   'anon_select_' || t, t);
    execute format('create policy %I on %I for insert to anon with check (true);',
                   'anon_insert_' || t, t);
    execute format('create policy %I on %I for update to anon using (true) with check (true);',
                   'anon_update_' || t, t);
    execute format('create policy %I on %I for delete to anon using (true);',
                   'anon_delete_' || t, t);
  end loop;
end$$;

-- ============================================================
-- STORAGE — imágenes de productos
-- ------------------------------------------------------------
-- Bucket público 'product-images' para las fotos de los artículos.
-- Público = las imágenes se pueden ver por URL (lo que necesita el POS).
-- Las políticas permiten a 'anon' subir/editar/borrar SOLO en este bucket
-- (mismo modelo MVP que las tablas; no es seguridad real).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

do $$
begin
  -- Lectura pública (cualquiera puede ver la imagen por su URL).
  drop policy if exists "product_images_read" on storage.objects;
  create policy "product_images_read" on storage.objects
    for select using (bucket_id = 'product-images');

  -- Subir / actualizar / borrar imágenes desde la app (rol anon).
  drop policy if exists "product_images_insert" on storage.objects;
  create policy "product_images_insert" on storage.objects
    for insert to anon with check (bucket_id = 'product-images');

  drop policy if exists "product_images_update" on storage.objects;
  create policy "product_images_update" on storage.objects
    for update to anon using (bucket_id = 'product-images')
    with check (bucket_id = 'product-images');

  drop policy if exists "product_images_delete" on storage.objects;
  create policy "product_images_delete" on storage.objects
    for delete to anon using (bucket_id = 'product-images');
end$$;

-- ============================================================
-- REALTIME
-- ------------------------------------------------------------
-- La pantalla de Mesas escucha cambios en 'orders' para sincronizar
-- las 2-3 tablets/PC en vivo. Hay que añadir la tabla a la publicación
-- de Realtime de Supabase (idempotente y seguro si no existe).
-- ============================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'orders'
     )
  then
    alter publication supabase_realtime add table orders;
  end if;
end$$;

-- ============================================================
-- DATOS DE EJEMPLO (idempotentes: solo se insertan si la tabla está vacía)
-- ============================================================
insert into categories (name, sort_order)
select * from (values
  ('Comida', 1), ('Bebida', 2), ('Postre', 3)
) as v(name, sort_order)
where not exists (select 1 from categories);

insert into dining_tables (name, sort_order)
select * from (values
  ('Mesa 1', 1), ('Mesa 2', 2), ('Mesa 3', 3), ('Mesa 4', 4),
  ('Barra', 5), ('Para llevar', 6)
) as v(name, sort_order)
where not exists (select 1 from dining_tables);

insert into products (name, price, category_id, barcode)
select v.name, v.price, c.id, v.barcode
from (values
  ('Hamburguesa',  120.00, 'Comida', '2000000000018'),
  ('Tacos (orden)', 85.00, 'Comida', '2000000000025'),
  ('Ensalada',      95.00, 'Comida', '2000000000032'),
  ('Refresco',      30.00, 'Bebida', '2000000000049'),
  ('Agua',          20.00, 'Bebida', '2000000000056'),
  ('Café',          35.00, 'Bebida', '2000000000063'),
  ('Pastel',        55.00, 'Postre', '2000000000070')
) as v(name, price, cat_name, barcode)
join categories c on c.name = v.cat_name
where not exists (select 1 from products);

-- ============================================================
-- Documentación (comentarios visibles en el panel de Supabase)
-- ============================================================
comment on table  orders            is 'Cuentas: una abierta por mesa; al cobrar pasa a paid.';
comment on column order_items.line_total is 'Columna generada = unit_price * quantity.';
comment on column products.barcode  is 'Código para escanear; UNIQUE (admite varios NULL).';
