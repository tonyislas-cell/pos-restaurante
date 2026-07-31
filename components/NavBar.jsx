"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/mesas", label: "Mesas" },
  { href: "/productos", label: "Artículos" },
  { href: "/reportes", label: "Reportes" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="no-print bg-ink text-canvas shadow-soft">
      <nav className="max-w-6xl mx-auto flex items-center gap-1 px-3 h-14">
        <span className="flex items-center gap-2 mr-3 font-display font-semibold tracking-tight text-canvas/95 shrink-0">
          <ChefHat size={20} strokeWidth={1.75} className="text-brand" />
          <span className="hidden sm:inline">POS</span>
        </span>
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active ? "bg-brand text-ink" : "text-canvas/80 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
