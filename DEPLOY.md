# Guía de publicación — POS Restaurante

Esta guía te lleva de "la app funciona en mi computadora" a "está en internet con
una dirección que puedo abrir en las tablets del restaurante".

> ⚠️ **Antes de publicar necesitas tener Supabase conectado y la app funcionando en
> local.** Si aún no lo has hecho, primero sigue el `README.md` (crear proyecto en
> Supabase, correr `supabase/schema.sql` y rellenar `.env.local`).

---

## Valores de configuración que debes copiar en Vercel

Cuando conectes el proyecto en Vercel, ve a **Settings → Environment Variables** y
añade estos tres (los valores están en tu archivo `.env.local`):

| Nombre | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | La dirección de tu proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave pública de Supabase |
| `NEXT_PUBLIC_POS_PASSWORD` | La contraseña con la que el personal entra al POS |

---

## Pasos para publicar

1. Sube el código a un repositorio en [github.com](https://github.com) (privado).
2. Entra en [vercel.com](https://vercel.com) y regístrate con tu cuenta de GitHub.
3. Haz clic en **Add New → Project** y selecciona el repositorio del POS.
4. En **Framework Preset** debe aparecer **Next.js** (se detecta solo).
5. Abre **Environment Variables** y añade las tres variables de la tabla de arriba.
6. Haz clic en **Deploy**.

En 2-3 minutos tendrás una dirección pública (https://...) lista para abrir en
cualquier tablet del restaurante.

---

## Cada vez que hagas un cambio

Con GitHub conectado, Vercel vuelve a publicar solo cada vez que subes cambios al
repositorio. No hay que hacer nada más.

---

## Si algo falla

Vuelve a Claude Code y di:
"El deploy en Vercel ha fallado, el error es: [pega aquí el texto del error]"
y lo resolvemos.
