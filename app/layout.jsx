import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import Gate from "@/components/Gate";
import NavBar from "@/components/NavBar";

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
      <body>
        <Gate>
          <NavBar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </Gate>
      </body>
    </html>
  );
}
