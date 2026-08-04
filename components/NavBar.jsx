"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/mesas", label: "Mesas" },
  { href: "/admin", label: "Administración" },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="no-print bg-surface/80 backdrop-blur-xl border-b border-line/20 sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto flex items-center gap-1 px-3 h-14">
        <span className="flex items-center gap-2 mr-3 font-display font-semibold tracking-tight text-ink shrink-0">
          <ChefHat size={20} strokeWidth={1.75} className="text-brand" />
          <span className="hidden sm:inline">El Tejaban</span>
        </span>
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active ? "bg-brand text-ink" : "text-muted hover:bg-canvas"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <LogoutButton className="ml-auto px-2 py-2" />
      </nav>
    </header>
  );
}
