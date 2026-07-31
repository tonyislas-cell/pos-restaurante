import "./globals.css";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import Gate from "@/components/Gate";
import NavBar from "@/components/NavBar";

// Fraunces: voz de marca (nombre del local, títulos, ticket). Con carácter,
// no un serif genérico de sistema.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

// Plus Jakarta Sans: tipografía funcional para toda la UI operativa
// (botones, productos, formularios, cifras). Cálida y muy legible.
const jakarta = Plus_Jakarta_Sans({
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
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>
        <Gate>
          <NavBar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </Gate>
      </body>
    </html>
  );
}
