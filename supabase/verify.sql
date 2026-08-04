-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql.
-- Toda la información creada aquí se revierte al terminar.
begin;

do $$
begin
  if has_table_privilege('anon', 'public.products', 'select') then
    raise exception 'VERIFY_FAILED: anon todavía puede leer products';
  end if;
  if has_table_privilege('anon', 'public.orders', 'insert') then
    raise exception 'VERIFY_FAILED: anon todavía puede insertar orders';
  end if;
  if has_function_privilege('anon', 'public.open_order(uuid)', 'execute') then
    raise exception 'VERIFY_FAILED: anon todavía puede ejecutar open_order';
  end if;
  if has_table_privilege('authenticated', 'public.orders', 'update') then
    raise exception 'VERIFY_FAILED: authenticated puede actualizar orders directamente';
  end if;
  if not has_function_privilege('authenticated', 'public.checkout_order(uuid,text,numeric)', 'execute') then
    raise exception 'VERIFY_FAILED: authenticated no puede ejecutar checkout_order';
  end if;
end;
$$;

do $$
declare
  v_table_id uuid := '10000000-0000-0000-0000-000000000001';
  v_cancel_table_id uuid := '10000000-0000-0000-0000-000000000002';
  v_product_id uuid := '20000000-0000-0000-0000-000000000001';
  v_order public.orders;
  v_second public.orders;
  v_item_id uuid;
begin
  perform set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

  insert into public.dining_tables (id, name, sort_order)
  values (v_table_id, 'VERIFY Mesa', 9998),
         (v_cancel_table_id, 'VERIFY Cancelación', 9999);
  insert into public.products (id, name, price, active)
  values (v_product_id, 'VERIFY Producto', 42.50, true);

  select * into v_order from public.open_order(v_table_id);
  select * into v_second from public.open_order(v_table_id);
  if v_order.id <> v_second.id then
    raise exception 'VERIFY_FAILED: open_order creó dos órdenes abiertas';
  end if;

  select * into v_order from public.add_order_item(v_order.id, v_product_id);
  select * into v_order from public.add_order_item(v_order.id, v_product_id);
  if v_order.total <> 85.00 then
    raise exception 'VERIFY_FAILED: total esperado 85.00, recibido %', v_order.total;
  end if;

  select id into v_item_id from public.order_items where order_id = v_order.id;
  select * into v_order from public.set_order_item_quantity(v_item_id, 1);
  if v_order.total <> 42.50 then
    raise exception 'VERIFY_FAILED: set_order_item_quantity no recalculó el total';
  end if;

  begin
    perform public.checkout_order(v_order.id, 'efectivo', 40);
    raise exception 'VERIFY_FAILED: se aceptó efectivo insuficiente';
  exception when others then
    if sqlerrm <> 'INSUFFICIENT_CASH' then raise; end if;
  end;

  select * into v_order from public.checkout_order(v_order.id, 'efectivo', 50);
  if v_order.status <> 'paid' or v_order.change_due <> 7.50 then
    raise exception 'VERIFY_FAILED: cobro o cambio incorrecto';
  end if;

  begin
    perform public.checkout_order(v_order.id, 'tarjeta', null);
    raise exception 'VERIFY_FAILED: se permitió cobrar dos veces';
  exception when others then
    if sqlerrm <> 'ORDER_NOT_OPEN' then raise; end if;
  end;

  select * into v_second from public.open_order(v_cancel_table_id);
  select * into v_second from public.cancel_order(v_second.id);
  if v_second.status <> 'cancelled' or v_second.closed_at is null then
    raise exception 'VERIFY_FAILED: cancel_order no dejó registro auditable';
  end if;
end;
$$;

rollback;

select 'VERIFY_OK: permisos y operaciones críticas validados' as resultado;
