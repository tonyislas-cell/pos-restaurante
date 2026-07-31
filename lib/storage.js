import { supabase } from "@/lib/supabaseClient";

// Bucket de Supabase Storage donde viven las fotos de los artículos.
const BUCKET = "product-images";

// Sube un archivo de imagen y devuelve su URL pública.
export async function uploadProductImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Borra una imagen a partir de su URL pública (best-effort; ignora errores).
export async function deleteProductImage(url) {
  if (!url) return;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = url.slice(i + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
