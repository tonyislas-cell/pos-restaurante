"use client";

import { usePathname } from "next/navigation";
import { ChefHat } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function NavBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="no-print bg-surface/80 backdrop-blur-xl border-b border-line/20 sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        {/* Spacer izquierdo para centrar el logo correctamente */}
        <div className="w-10"></div>
        
        {/* Logo Centrado */}
        <div className="flex items-center justify-center gap-2 font-display font-semibold tracking-tight text-ink">
          <ChefHat size={32} strokeWidth={1.5} className="text-brand" />
        </div>
        
        {/* Botón de logout a la derecha */}
        <LogoutButton className="px-2 py-2" />
      </nav>
    </header>
  );
}
