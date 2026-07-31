// Utilidades de formato compartidas.

// Formatea un número como moneda. Ajusta la moneda/locale a tu país.
export function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

// Genera un código de barras interno tipo EAN-13 (13 dígitos) para un producto.
// Prefijo "20" = rango de uso interno del negocio (no choca con productos de fábrica).
export function generateBarcode() {
  let base = "20";
  for (let i = 0; i < 10; i++) base += Math.floor(Math.random() * 10);
  return base + eanCheckDigit(base);
}

// Dígito verificador EAN-13.
function eanCheckDigit(twelveDigits) {
  const digits = twelveDigits.split("").map(Number);
  const sum = digits.reduce(
    (acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3),
    0
  );
  return String((10 - (sum % 10)) % 10);
}
