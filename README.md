# POS Restaurante

Punto de venta para una sola computadora de caja: catálogo, mesas, cuentas, cobro en efectivo o tarjeta, ticket imprimible y reportes diarios/semanales.

Construido con Next.js 14, Supabase Auth/Postgres/Storage y Tailwind CSS. La aplicación se publica en Vercel, pero solo una cuenta de caja autorizada puede consultar o modificar datos.

## Funciones incluidas

- Productos, categorías, códigos de barras e imágenes.
- Mesas y una cuenta abierta por mesa.
- Cobro transaccional con cálculo de cambio.
- Órdenes pagadas inmutables y cancelaciones auditables.
- Ticket térmico de 80 mm.
- Reportes por día y semana.
- Sesión persistente con correo y contraseña de Supabase Auth.

## Instalación limpia

> `supabase/schema.sql` elimina productos, mesas, órdenes y partidas existentes. No elimina usuarios de Supabase Auth. Vacía antes el bucket `product-images` si quieres retirar las imágenes anteriores.

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta completo `supabase/schema.sql`.
3. Ejecuta `supabase/verify.sql`. El resultado final debe ser `VERIFY_OK`.
4. En **Authentication → Users**, crea manualmente la única cuenta de caja con un correo real y una contraseña larga y exclusiva.
5. En la configuración de Authentication, desactiva el registro de nuevos usuarios. La aplicación no ofrece registro ni recuperación de contraseña.
6. Copia `.env.local.example` como `.env.local` y configura:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
   ```

7. Instala y verifica:

   ```bash
   npm install
   npm test
   npm run lint
   npm run build
   npm run dev
   ```

8. Abre `http://localhost:3007` e inicia sesión con la cuenta creada en Supabase.

## Publicación en Vercel

Consulta [DEPLOY.md](DEPLOY.md). Vercel solo necesita las dos variables públicas de Supabase. No agregues una contraseña propia de la aplicación ni una `service_role` key.

## Impresora térmica en Windows

1. Instala la impresora USB y establécela como predeterminada.
2. Crea un acceso directo a Chrome con la URL definitiva de Vercel:

   ```text
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://TU-POS.vercel.app
   ```

3. Usa ese acceso directo en la computadora de caja. `--kiosk-printing` imprime sin mostrar el diálogo de confirmación.

El ticket está diseñado para papel de 80 mm. Los datos del negocio se configuran en `components/Ticket.jsx`.

## Seguridad operativa

- La clave `anon` es pública por diseño, pero el rol anónimo no tiene acceso a las tablas ni a las operaciones de venta.
- Las escrituras de órdenes y partidas solo se realizan mediante funciones PostgreSQL autenticadas.
- El total se calcula en la base de datos; una orden pagada no puede modificarse ni cobrarse otra vez.
- Cerrar sesión invalida el acceso visible; una sesión vencida regresa automáticamente al formulario.
- No reutilices ninguna contraseña que haya aparecido anteriormente en el código o historial del repositorio.

## Comandos

- `npm run dev`: desarrollo en el puerto 3007.
- `npm test`: pruebas automatizadas.
- `npm run lint`: revisión estática.
- `npm run build`: compilación de producción.
