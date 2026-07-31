# POS Restaurante

## Qué hace esta app
Punto de venta para un restaurante/cafetería (encargo a medida de un solo local).
Gestiona artículos con categorías editables, mesas con cuenta activa, cobro con
cálculo de cambio, ticket imprimible en impresora térmica y reportes de ventas
por día y semana. Pensada para usarse en tablet y computadora a la vez (2-3
dispositivos que comparten la base de datos en tiempo real).

## Stack tecnológico
- Next.js 14 (App Router, JavaScript/JSX)
- Supabase (Postgres + Realtime) como base de datos central
- Tailwind CSS
- Despliegue objetivo: Vercel

## Estructura
- `app/` — páginas (inicio, productos, mesas, cuenta/[id], reportes)
- `components/` — Gate (contraseña del local), NavBar, Ticket
- `lib/` — supabaseClient, format (moneda + generación de códigos)
- `supabase/schema.sql` — tablas, índices, RLS, seeds

## REGLAS — No tocar sin confirmación explícita del usuario
- El archivo `.env.local` nunca se modifica ni se comparte.
- La base de datos de Supabase no se borra ni se resetea.
- No publicar (GitHub / Vercel) sin autorización explícita del usuario.
- El `supabase/schema.sql` no se altera de forma que borre datos sin avisar.
- Las rutas existentes no se renombran sin avisar.

## Decisiones de alcance ya tomadas (MVP)
- Solo online (hay wifi estable). Offline queda para más adelante.
- Cobro: se registra el método (efectivo/tarjeta) y se calcula el cambio.
  NO hay integración con terminal/datáfono de tarjeta.
- Impresión de ticket vía navegador (window.print) a impresora térmica USB.
- Escáner USB (funciona como teclado); los códigos los genera la app.
- Seguridad: usa la anon key de Supabase con RLS abierta a `anon`. Suficiente
  para un local interno; NO es seguridad real para exposición pública.

## Configuración
- Variables de entorno: ver `.env.local.example`.
- Puerto de desarrollo: 3007 (`npm run dev`), para no chocar con otros proyectos.
