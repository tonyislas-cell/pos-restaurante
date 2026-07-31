# 🍽️ POS Restaurante (MVP)

Punto de venta para un restaurante/cafetería: gestión de artículos, mesas con cuenta activa,
cobro con cálculo de cambio, ticket imprimible y reportes de ventas por día y semana.

Construido con **Next.js 14 + Supabase + Tailwind**. Pensado para funcionar en tablet y
computadora, con la base de datos compartida entre 2-3 dispositivos en tiempo real.

---

## ✅ Qué incluye esta primera versión (núcleo)

- **Artículos**: crear/editar/borrar productos con precio, tipo (categoría editable) y código de barras.
- **Mesas**: grid de mesas; abrir una cuenta por mesa y ver su total en vivo.
- **Cuenta**: añadir productos tocando (o escaneando código), modificar cantidades.
- **Cobro**: efectivo (con cálculo de cambio) o tarjeta; imprime ticket en impresora térmica.
- **Reportes**: total del día/semana, tickets cobrados y productos vendidos, con desglose por día.
- **Escáner** (soporte ligero): campo "Escanear código" en la cuenta; un lector USB funciona como teclado.

> Pendiente para siguientes versiones: impresión de etiquetas de código, PIN por mesero,
> inventario/stock, impresión silenciosa ESC/POS, descuentos.

---

## 🚀 Puesta en marcha (paso a paso)

### 1. Requisitos
- [Node.js 18 o superior](https://nodejs.org) instalado.
- Una cuenta gratis en [Supabase](https://supabase.com).

### 2. Crear la base de datos en Supabase
1. Entra a Supabase y crea un **proyecto nuevo** (elige región y contraseña de la base de datos).
2. En el menú lateral abre **SQL Editor → New query**.
3. Abre el archivo [`supabase/schema.sql`](supabase/schema.sql) de este proyecto, copia todo su
   contenido, pégalo y pulsa **Run**. Esto crea las tablas y unos datos de ejemplo.

### 3. Configurar las variables de entorno
1. En Supabase ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public** key
2. En la carpeta del proyecto, copia el archivo de ejemplo:
   ```bash
   copy .env.local.example .env.local   # Windows
   # o: cp .env.local.example .env.local  (Mac/Linux)
   ```
3. Abre `.env.local` y rellena:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key
   NEXT_PUBLIC_POS_PASSWORD=la-clave-del-local
   ```

### 4. Instalar y arrancar
```bash
npm install
npm run dev
```
Abre **http://localhost:3007**. Introduce la contraseña del local y listo.

---

## 🖨️ Impresora de tickets (USB en Windows) — impresión silenciosa

Configuración elegida para este proyecto: **sin diálogo de impresión**. Al pulsar
**Imprimir ticket**, el ticket sale directo a la impresora térmica, sin ventana de
confirmación de por medio. Requiere una configuración única en la PC de caja:

1. **Instala la impresora térmica** en Windows con su driver (como cualquier impresora USB).
2. **Márcala como impresora predeterminada** en Windows (Configuración → Impresoras y
   escáneres → selecciona la térmica → "Establecer como predeterminada"). Chrome imprime
   silenciosamente a la impresora predeterminada del sistema.
3. **Crea un acceso directo especial para abrir el POS**, en vez de abrir Chrome normal:
   - Clic derecho en el escritorio → Nuevo → Acceso directo.
   - En "Ubicación del elemento", pega (ajusta la ruta de Chrome si es distinta):
     ```
     "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=http://localhost:3007
     ```
   - Dale un nombre como "POS Restaurante" y usa ese acceso directo a diario en la PC de caja.
   - `--kiosk-printing` suprime el diálogo de impresión; `--app=` abre el POS sin barra de
     direcciones, como una app dedicada.
4. Prueba el flujo completo: cobra una cuenta de prueba y pulsa **Imprimir ticket** — debe
   salir el papel sin ninguna ventana emergente.

> Si en algún momento quieres volver al diálogo normal (por ejemplo, para elegir otra
> impresora ocasionalmente), simplemente abre `localhost:3007` en una pestaña normal de
> Chrome sin esas banderas.

### Ancho de papel
El ticket está configurado para **80mm** (el más común). Si más adelante usas una
impresora de 58mm, avísame para ajustar el ancho en `globals.css` y `Ticket.jsx`.

### Datos del negocio en el ticket
Edita estas constantes en [`components/Ticket.jsx`](components/Ticket.jsx):
- `RESTAURANT_NAME` — nombre del negocio.
- `ADDRESS` — dirección (déjala como `""` para no imprimirla).
- `PHONE` — teléfono (déjalo como `""` para no imprimirlo).
- `FAREWELL_MESSAGE` — mensaje de despedida, reemplaza el genérico "Gracias por su visita".

---

## 📷 Escáner de código de barras

- La mayoría de lectores USB funcionan como un teclado: "teclean" el código y dan Enter.
- En la pantalla de una cuenta, haz clic en el campo **"Escanear código…"** y escanea:
  el producto con ese código se añade a la cuenta.
- Para asignar códigos: en **Artículos**, edita un producto y pulsa **Generar**
  (o escanea el código de fábrica en ese campo) y guarda.

---

## ☁️ Desplegar en internet (Vercel)

1. Sube el proyecto a un repositorio de GitHub.
2. Entra a [vercel.com](https://vercel.com), **Add New → Project**, importa el repo.
3. En **Environment Variables** añade las mismas 3 variables del `.env.local`.
4. **Deploy**. Tendrás una URL con https:// para abrir en las tablets del restaurante.

---

## 🗂️ Estructura del proyecto

```
app/
  layout.jsx            # Layout + puerta de acceso + navegación
  page.jsx              # Inicio (resumen del día)
  productos/page.jsx    # CRUD de artículos y categorías
  mesas/page.jsx        # Grid de mesas
  cuenta/[id]/page.jsx  # Cuenta de una mesa: añadir, cobrar, ticket
  reportes/page.jsx     # Ventas por día y semana
components/
  Gate.jsx              # Contraseña del local (MVP)
  NavBar.jsx            # Barra de navegación
  Ticket.jsx            # Ticket imprimible (80 mm)
lib/
  supabaseClient.js     # Conexión a Supabase
  format.js             # Moneda y generación de códigos
supabase/
  schema.sql            # Tablas + datos de ejemplo
```

---

## ⚠️ Notas de seguridad (MVP)

La app usa la **anon key** de Supabase desde el navegador con políticas permisivas, y la
contraseña del local es solo del lado del cliente. Es suficiente para una herramienta interna
de un solo negocio, **pero no es seguridad real**. Si en el futuro se maneja información
sensible o se expone públicamente, habría que mover las escrituras a un backend y añadir
autenticación real de Supabase.
