/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cabeceras de seguridad aplicadas a todas las páginas.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita que la app se cargue dentro de un iframe (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Impide que el navegador "adivine" tipos MIME.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No filtrar la URL completa al navegar a otros sitios.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
