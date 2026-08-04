# Publicación segura en Vercel

Esta guía presupone una sola computadora de caja y una URL pública de Vercel.

## 1. Preparar Supabase

> La instalación es destructiva para los datos del POS. Confirma que no necesitas los productos, ventas o imágenes actuales.

1. Vacía el bucket `product-images` desde Storage si contiene archivos anteriores.
2. Ejecuta `supabase/schema.sql` completo en SQL Editor.
3. Ejecuta `supabase/verify.sql` y confirma el resultado `VERIFY_OK`.
4. En **Authentication → Users**, crea manualmente una cuenta de caja.
5. Desactiva el registro de usuarios nuevos en la configuración de Authentication.
6. Comprueba en una ventana privada que una consulta anónima no puede acceder a las tablas.

## 2. Configurar Vercel

Define únicamente estas variables en **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública/publishable del proyecto |

Elimina `NEXT_PUBLIC_POS_PASSWORD` si existe. Nunca agregues una clave `service_role` a una variable `NEXT_PUBLIC_*`.

## 3. Verificar antes de publicar

```bash
npm test
npm run lint
npm run build
```

Los tres comandos deben terminar sin errores.

## 4. Recorrido posterior al despliegue

1. Abrir la URL sin sesión: solo aparece el formulario de acceso.
2. Probar una contraseña incorrecta: se muestra un mensaje neutral y no aparecen datos.
3. Iniciar sesión y recargar: la sesión continúa activa.
4. Crear/editar un producto y subir una imagen.
5. Abrir una mesa, agregar artículos y comprobar el total.
6. Intentar efectivo insuficiente: el cobro se rechaza y la cuenta sigue abierta.
7. Cobrar en efectivo y validar cambio/ticket.
8. Cobrar otra cuenta con tarjeta.
9. Cancelar una cuenta y comprobar que no aparece en ingresos.
10. Reabrir la URL de una cuenta pagada: solo muestra el ticket.
11. Cerrar sesión: la aplicación vuelve al acceso y oculta los datos.

## 5. Operación diaria

Abre la URL de Vercel mediante el acceso directo de Chrome con `--kiosk-printing`. La sesión queda guardada en esa computadora hasta que se cierre explícitamente o Supabase la invalide.
