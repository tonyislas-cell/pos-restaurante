import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Aviso claro en consola si faltan las variables de entorno.
  console.warn(
    "[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copia .env.local.example a .env.local y rellénalas."
  );
}

// Usamos valores de reserva con forma válida para que el build no falle si
// aún no hay .env.local. En tiempo real (dev/producción) se usan los verdaderos.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
