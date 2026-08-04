import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import AuthGate from "@/components/AuthGate";
import NavBar from "@/components/NavBar";
import { Particles } from "@/components/ui/particles";
import { GlassFilter } from "@/components/ui/glass";

// Playfair Display: voz de marca premium (títulos, logo).
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

// Inter: tipografía funcional para legibilidad absoluta.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "POS Restaurante",
  description: "Punto de venta para restaurante — mesas, cobro y tickets",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body style={{ "--glass-filter": "url(#glass-distortion)" }}>
        <AuthGate>
          <GlassFilter />
          <div className="relative min-h-screen w-full flex flex-col">
            <div className="fixed inset-0 z-0 pointer-events-none">
              <Particles quantity={200} className="h-full w-full" color="#1C1814" />
            </div>
            <div className="relative z-10 flex flex-col flex-1">
              <NavBar />
              <main className="max-w-6xl w-full mx-auto p-4 flex-1">{children}</main>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
