-- ============================================================
-- POS Restaurante — instalación limpia y endurecida
-- ATENCIÓN: este archivo elimina los datos actuales del esquema público.
-- No elimina usuarios de Supabase Auth.
-- ============================================================

create extension if not exists pgcrypto;

-- Elimina contratos anteriores antes de recrear los tipos compuestos.
drop function if exists public.open_order(uuid) cascade;
drop function if exists public.add_order_item(uuid, uuid) cascade;
drop function if exists public.set_order_item_quantity(uuid, integer) cascade;
drop function if exists public.checkout_order(uuid, text, numeric) cascade;
drop function if exists public.cancel_order(uuid) cascade;
drop function if exists public.set_updated_at() cascade;

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.dining_tables cascade;
drop table if exists public.categories cascade;

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  price        numeric(10,2) not null default 0 check (price >= 0),
  category_id  uuid references public.categories(id) on delete set null,
  barcode      text unique,
  image_url    text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.dining_tables (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  table_id        uuid references public.dining_tables(id) on delete set null,
  status          text not null default 'open'
                    check (status in ('open', 'paid', 'cancelled')),
  payment_method  text check (payment_method in ('efectivo', 'tarjeta')),
  total           numeric(10,2) not null default 0 check (total >= 0),
  cash_received   numeric(10,2) check (cash_received is null or cash_received >= 0),
  change_due      numeric(10,2) check (change_due is null or change_due >= 0),
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  quantity      integer not null default 1 check (quantity > 0),
  line_total    numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at    timestamptz not null default now()
);

create index idx_products_category on public.products(category_id);
create index idx_products_active_name on public.products(name) where active;
create index idx_orders_table_id on public.orders(table_id);
create unique index idx_orders_one_open_per_table
  on public.orders(table_id)
  where status = 'open' and table_id is not null;
create index idx_orders_paid_closed
  on public.orders(closed_at)
  where status = 'paid';
create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_product on public.order_items(product_id);
create unique index idx_order_items_order_product
  on public.order_items(order_id, product_id)
  where product_id is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_orders_updated
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- RPC transaccionales. Los códigos en RAISE son contratos con lib/posApi.js.
-- ============================================================

create function public.open_order(p_table_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception using message = 'AUTH_REQUIRED', errcode = 'P0001';
  end if;
  if not exists (select 1 from public.dining_tables where id = p_table_id) then
    raise exception using message = 'TABLE_NOT_FOUND', errcode = 'P0001';
  end if;

  insert into public.orders (table_id, status, total)
  values (p_table_id, 'open', 0)
  on conflict (table_id) where status = 'open' and table_id is not null
  do update set table_id = excluded.table_id
  returning * into v_order;

  return v_order;
end;
$$;

create function public.add_order_item(p_order_id uuid, p_product_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_product public.products;
begin
  if auth.uid() is null then
    raise exception using message = 'AUTH_REQUIRED', errcode = 'P0001';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_order.status <> 'open' then
    raise exception using message = 'ORDER_NOT_OPEN', errcode = 'P0001';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and active;

  if not found then
    raise exception using message = 'PRODUCT_NOT_AVAILABLE', errcode = 'P0001';
  end if;

  insert into public.order_items (
    order_id, product_id, product_name, unit_price, quantity
  ) values (
    p_order_id, v_product.id, v_product.name, v_product.price, 1
  )
  on conflict (order_id, product_id) where product_id is not null
  do update set quantity = public.order_items.quantity + 1;

  update public.orders
  set total = (
    select coalesce(sum(line_total), 0)
    from public.order_items
    where order_id = p_order_id
  )
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create function public.set_order_item_quantity(p_item_id uuid, p_quantity integer)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception using message = 'AUTH_REQUIRED', errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity < 0 then
    raise exception using message = 'INVALID_QUANTITY', errcode = 'P0001';
  end if;

  select order_id into v_order_id
  from public.order_items
  where id = p_item_id;

  if not found then
    raise exception using message = 'ITEM_NOT_FOUND', errcode = 'P0001';
  end if;

  select * into v_order
  from public.orders
  where id = v_order_id
  for update;

  if v_order.status <> 'open' then
    raise exception using message = 'ORDER_NOT_OPEN', errcode = 'P0001';
  end if;

  if p_quantity = 0 then
    delete from public.order_items where id = p_item_id;
  else
    update public.order_items set quantity = p_quantity where id = p_item_id;
  end if;

  update public.orders
  set total = (
    select coalesce(sum(line_total), 0)
    from public.order_items
    where order_id = v_order_id
  )
  where id = v_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create function public.checkout_order(
  p_order_id uuid,
  p_payment_method text,
  p_cash_received numeric default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_total numeric(10,2);
  v_item_count integer;
begin
  if auth.uid() is null then
    raise exception using message = 'AUTH_REQUIRED', errcode = 'P0001';
  end if;
  if p_payment_method not in ('efectivo', 'tarjeta') then
    raise exception using message = 'INVALID_PAYMENT_METHOD', errcode = 'P0001';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_order.status <> 'open' then
    raise exception using message = 'ORDER_NOT_OPEN', errcode = 'P0001';
  end if;

  select count(*), coalesce(sum(line_total), 0)
  into v_item_count, v_total
  from public.order_items
  where order_id = p_order_id;

  if v_item_count = 0 then
    raise exception using message = 'ORDER_EMPTY', errcode = 'P0001';
  end if;
  if p_payment_method = 'efectivo'
     and (p_cash_received is null or p_cash_received < v_total) then
    raise exception using message = 'INSUFFICIENT_CASH', errcode = 'P0001';
  end if;

  update public.orders
  set status = 'paid',
      payment_method = p_payment_method,
      total = v_total,
      cash_received = case when p_payment_method = 'efectivo' then p_cash_received else null end,
      change_due = case when p_payment_method = 'efectivo' then p_cash_received - v_total else null end,
      closed_at = pg_catalog.now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception using message = 'AUTH_REQUIRED', errcode = 'P0001';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_order.status <> 'open' then
    raise exception using message = 'ORDER_NOT_OPEN', errcode = 'P0001';
  end if;

  update public.orders
  set status = 'cancelled', closed_at = pg_catalog.now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ============================================================
-- Permisos: anónimo sin acceso; autenticado con mínimo privilegio.
-- ============================================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.dining_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.categories, public.products, public.dining_tables,
  public.orders, public.order_items from anon;
revoke all on table public.categories, public.products, public.dining_tables,
  public.orders, public.order_items from authenticated;

grant select on table public.categories, public.products, public.dining_tables,
  public.orders, public.order_items to authenticated;
grant insert, update, delete on table public.categories, public.products,
  public.dining_tables to authenticated;

create policy authenticated_categories_all on public.categories
  for all to authenticated using (true) with check (true);
create policy authenticated_products_all on public.products
  for all to authenticated using (true) with check (true);
create policy authenticated_tables_all on public.dining_tables
  for all to authenticated using (true) with check (true);
create policy authenticated_orders_read on public.orders
  for select to authenticated using (true);
create policy authenticated_order_items_read on public.order_items
  for select to authenticated using (true);

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.open_order(uuid) to authenticated;
grant execute on function public.add_order_item(uuid, uuid) to authenticated;
grant execute on function public.set_order_item_quantity(uuid, integer) to authenticated;
grant execute on function public.checkout_order(uuid, text, numeric) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ============================================================
-- Storage: lectura pública; mutaciones solo con sesión autenticada.
-- Vacía manualmente el bucket antes de una reinstalación completa.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_read on storage.objects;
drop policy if exists product_images_insert on storage.objects;
drop policy if exists product_images_update on storage.objects;
drop policy if exists product_images_delete on storage.objects;

create policy product_images_read on storage.objects
  for select to public using (bucket_id = 'product-images');
create policy product_images_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy product_images_update on storage.objects
  for update to authenticated using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');
create policy product_images_delete on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ============================================================
-- Datos iniciales.
-- ============================================================

insert into public.categories (name, sort_order) values
  ('Comidas', 1),
  ('Carnes a la Plancha', 2),
  ('Flautas, Tacos y Pescado', 3),
  ('Bebidas', 4),
  ('Hamburguesas Clásicas', 5),
  ('Hamburguesas de Especialidad', 6),
  ('Otros Antojitos', 7),
  ('Especiales de Carne', 8);

insert into public.dining_tables (name, sort_order) values
  ('Mesa 1', 1), ('Mesa 2', 2), ('Mesa 3', 3), ('Mesa 4', 4),
  ('Barra', 5), ('Para llevar', 6);

insert into public.products (name, price, category_id, barcode, active)
select v.name, v.price, c.id, v.barcode, v.active
from (values
  -- Comidas
  ('Caldo de res', 110.00, 'Comidas', '2000000000100', true),
  ('Caldo de pollo', 100.00, 'Comidas', '2000000000101', true),
  ('Chile relleno', 75.00, 'Comidas', '2000000000102', true),
  ('Mole', 85.00, 'Comidas', '2000000000103', true),
  ('Asado', 85.00, 'Comidas', '2000000000104', true),
  ('Guisado verde', 85.00, 'Comidas', '2000000000105', true),
  ('Pechuga rellena', 90.00, 'Comidas', '2000000000106', true),
  ('Fajitas de pollo', 80.00, 'Comidas', '2000000000107', true),
  ('Carne c/ chile', 0.00, 'Comidas', '2000000000108', false),
  ('Orden de enchiladas', 90.00, 'Comidas', '2000000000109', true),

  -- Carnes a la Plancha
  ('Chuleta ahumada', 100.00, 'Carnes a la Plancha', '2000000000110', true),
  ('Milanesa', 100.00, 'Carnes a la Plancha', '2000000000111', true),

  -- Flautas, Tacos y Pescado
  ('Flautas sin sopa', 70.00, 'Flautas, Tacos y Pescado', '2000000000112', true),
  ('Flautas con sopa', 85.00, 'Flautas, Tacos y Pescado', '2000000000113', true),
  ('Taco de Bistek', 25.00, 'Flautas, Tacos y Pescado', '2000000000114', true),
  ('Taco de Adobada', 25.00, 'Flautas, Tacos y Pescado', '2000000000115', true),
  ('Filete de pescado', 120.00, 'Flautas, Tacos y Pescado', '2000000000116', true),

  -- Bebidas
  ('Refresco', 0.00, 'Bebidas', '2000000000117', true),
  ('Agua del día', 30.00, 'Bebidas', '2000000000118', true),
  ('Café', 25.00, 'Bebidas', '2000000000119', true),

  -- Hamburguesas Clásicas
  ('Ham. Jamón y Queso', 50.00, 'Hamburguesas Clásicas', '2000000000120', true),
  ('Ham. Tocino, Jamón, Queso', 60.00, 'Hamburguesas Clásicas', '2000000000121', true),
  ('Ham. Aguacate, Jamón, Queso', 60.00, 'Hamburguesas Clásicas', '2000000000122', true),

  -- Hamburguesas de Especialidad
  ('Ham. Hawaiana', 75.00, 'Hamburguesas de Especialidad', '2000000000123', true),
  ('Ham. Súper Especial', 90.00, 'Hamburguesas de Especialidad', '2000000000124', true),
  ('Ham. de Pollo', 75.00, 'Hamburguesas de Especialidad', '2000000000125', true),
  ('Ham. Guerrera', 90.00, 'Hamburguesas de Especialidad', '2000000000126', true),
  ('Ham. Especial', 75.00, 'Hamburguesas de Especialidad', '2000000000127', true),
  ('Salchiburguer', 75.00, 'Hamburguesas de Especialidad', '2000000000128', true),
  ('Ham. Suprema', 90.00, 'Hamburguesas de Especialidad', '2000000000129', true),

  -- Otros Antojitos
  ('Hot-Dog', 25.00, 'Otros Antojitos', '2000000000130', true),
  ('Gordita', 20.00, 'Otros Antojitos', '2000000000131', true),
  ('Burrito', 25.00, 'Otros Antojitos', '2000000000132', true),
  ('Mollete', 50.00, 'Otros Antojitos', '2000000000133', true),
  ('Lonche de Adobada', 85.00, 'Otros Antojitos', '2000000000134', true),
  ('Lonche de Carnitas', 85.00, 'Otros Antojitos', '2000000000135', true),
  ('Lonche Mixto', 85.00, 'Otros Antojitos', '2000000000136', true),

  -- Especiales de Carne
  ('Carne Asada / Fajitas Sirloin', 160.00, 'Especiales de Carne', '2000000000137', true)
) as v(name, price, category_name, barcode, active)
join public.categories c on c.name = v.category_name;

comment on table public.orders is
  'Cuentas del POS. Toda escritura se realiza mediante RPC autenticadas.';
comment on column public.order_items.line_total is
  'Importe generado automáticamente: unit_price * quantity.';
