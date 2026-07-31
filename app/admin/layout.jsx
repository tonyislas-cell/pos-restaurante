import Link from "next/link";
import { LayoutDashboard, UtensilsCrossed, LogOut } from "lucide-react";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen text-ink flex flex-col md:flex-row bg-transparent">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-surface/80 backdrop-blur-xl border-r border-line/20 p-6 flex flex-col gap-8 shrink-0">
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-semibold text-2xl text-accent">Admin</h2>
          <p className="text-sm text-muted">Panel de Control</p>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-canvas/50 transition-colors text-sm font-medium">
            <LayoutDashboard size={18} className="text-muted" />
            Dashboard
          </Link>
          <Link href="/admin/productos" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-canvas/50 transition-colors text-sm font-medium">
            <UtensilsCrossed size={18} className="text-muted" />
            Artículos
          </Link>
        </nav>

        <div className="pt-4 border-t border-line/20">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-canvas/50 transition-colors text-sm font-medium text-muted hover:text-ink">
            <LogOut size={18} />
            Volver a Caja
          </Link>
        </div>
      </aside>

      {/* Contenido principal admin */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
