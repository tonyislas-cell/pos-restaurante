---
name: mvp-blueprint
description: Planifica y genera el scaffolding de un MVP completo en horas, no semanas. Usar cuando el usuario diga "quiero construir un MVP", "tengo una idea y quiero validarla", "cómo empiezo este producto", "ayúdame a lanzar rápido" o pida definir el alcance mínimo viable. Cubre definición de scope, stack, arquitectura, roadmap de 7 días y scaffolding de código.
---

# MVP Blueprint

Convierte una idea en un MVP lanzable en 7 días. Ruthless scoping: solo lo que valida la hipótesis principal.

## Filosofía

Un MVP no es un producto pequeño: es **un experimento**. Su único trabajo es **aprender**, no vender. Cada feature que añades sin validar es deuda.

Regla de oro: **si puedes validarlo con una landing + Typeform + Stripe Payment Link, no construyas software todavía.**

## Flujo de trabajo

### Fase 1 — Interrogatorio de scope (obligatorio)

No empieces a codear hasta tener esto. Pregunta en este orden:

1. **Hipótesis en una frase**: "Creo que [cliente] tiene [problema] y pagará [precio] por [solución]."
2. **Métrica de éxito del MVP**: ¿qué número hace que el experimento sea positivo? (10 usuarios pagando, 100 signups, 3 demos cerradas...)
3. **Deadline real**: fecha concreta para salir. Sin fecha = no hay MVP.
4. **El "ya tengo"**: audiencia, dominio, diseño, content, lista de espera.
5. **El test de la camarera**: si explicas el producto en 30s a una camarera, ¿lo entiende?

### Fase 2 — Corte de scope (Moscow brutal)

Clasifica TODA idea propuesta por el usuario:

- **MUST**: sin esto no hay hipótesis que validar. Máx. 3 features.
- **SHOULD**: mejora la experiencia pero no es test de valor. Va en v1.1.
- **COULD**: ideas guays. Backlog post-validación.
- **WON'T**: di que NO explícitamente. Login social, dashboard admin, multi-idioma, dark mode, app móvil nativa, panel de analytics, sistema de roles... casi siempre WON'T en MVP.

Devuelve al usuario la tabla Moscow ANTES de escribir una línea de código.

### Fase 3 — Stack recomendado según caso

Elige el stack más simple que cumpla el objetivo. No pelees con infraestructura en un MVP.

| Tipo de producto | Stack recomendado |
|---|---|
| SaaS con auth + DB | Next.js 14 + Supabase (auth, DB, storage) + Stripe + Vercel |
| Marketplace simple | Next.js + Supabase + Stripe Connect + Vercel |
| Herramienta con IA | Next.js + Vercel AI SDK + OpenAI/Anthropic + Upstash Redis |
| Directorio/contenido | Astro + MDX + Vercel (sin DB, todo estático) |
| Automatización | n8n/Make + Webhooks + Airtable como DB |
| Herramienta B2B interna | Retool o Bubble (no-code, más rápido) |
| Mobile-first social | Expo + Supabase + EAS |

Regla: **no introduzcas tecnología que no domines si hay una alternativa más simple**.

### Fase 4 — Roadmap de 7 días

Genera un plan día a día con entregable por día:

- **Día 1**: Landing de validación + lista de espera. Compartir y medir.
- **Día 2**: Scaffolding (auth, DB, schema, deploy pipeline).
- **Día 3**: Core feature #1 (la que valida la hipótesis).
- **Día 4**: Core feature #2 + onboarding mínimo.
- **Día 5**: Pago/conversión (Stripe) + emails transaccionales (Resend).
- **Día 6**: Testing manual + fixes críticos + analytics (Plausible, Posthog).
- **Día 7**: Lanzamiento a 10-50 usuarios manualmente (no Product Hunt todavía).

### Fase 5 — Scaffolding

Solo después de aprobar Moscow y roadmap, genera:

1. Estructura de carpetas
2. Schema de DB (SQL o Prisma)
3. Rutas/páginas esenciales
4. Variables de entorno
5. README con instrucciones de setup paso a paso
6. Deploy pre-configurado (vercel.json, netlify.toml)

## Plantilla de schema MVP SaaS

```sql
-- Usuarios (gestionado por Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  created_at timestamp default now()
);

-- Suscripciones Stripe
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamp,
  created_at timestamp default now()
);

-- Tabla de dominio (ejemplo — adaptar)
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  content jsonb,
  created_at timestamp default now()
);

-- RLS básica: cada usuario ve solo lo suyo
alter table items enable row level security;
create policy "own items" on items for all using (auth.uid() = user_id);
```

## Anti-patrones a evitar

- Construir admin panel antes de tener 1 usuario
- Integrar Stripe antes de tener "sí, lo pagaría" de 5 personas
- Elegir stack "porque escala". No vas a escalar; tienes 0 usuarios.
- Diseñar logo, branding, website corporativo antes del MVP
- Configurar tests automatizados en un MVP de 7 días (sí testea manual)
- Perder 2 días en Auth con Google/GitHub: email+password basta
- Dark mode, i18n, accessibility AAA: post-validación

## Checklist de lanzamiento del MVP

- [ ] El usuario puede registrarse, usar la feature core y pagar en <5 minutos
- [ ] Email transaccional de bienvenida funciona
- [ ] Dominio propio con SSL
- [ ] Analytics mide el evento clave de activación
- [ ] Hay un form de feedback in-app o botón a WhatsApp/email
- [ ] Existe un canal para recibir errores (Sentry, Logflare o email)
- [ ] Has probado el flujo completo como usuario anónimo en móvil

## Tras el lanzamiento

Recuerda al usuario:
- Lanzar a mano a 10-20 personas del nicho, con un mensaje personalizado.
- Agenda 5 calls de 15 min con primeros usuarios la primera semana.
- No toques roadmap hasta tener feedback real.
- Si no tienes 10% de conversión del tráfico al uso, el problema es el onboarding o la promesa, no el producto.
