"use client";

import { usePathname, useRouter } from "next/navigation";
// Forzando recompilación para que tome el .jsx en lugar del .tsx
import MacOSDock from "@/components/ui/mac-os-dock";
import { Home, UtensilsCrossed, Settings, FileText, BookOpen } from "lucide-react";

const DOCK_APPS = [
  { id: "/", name: "Inicio", icon: Home },
  { id: "/mesas", name: "Mesas", icon: UtensilsCrossed },
  { id: "/admin/productos", name: "Artículos", icon: BookOpen },
  { id: "/reportes", name: "Reportes", icon: FileText },
  { id: "/admin", name: "Ajustes", icon: Settings },
];

export default function MainDock() {
  const pathname = usePathname();
  const router = useRouter();

  const handleAppClick = (appId) => {
    router.push(appId);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex w-full justify-center no-print">
      <MacOSDock
        apps={DOCK_APPS}
        onAppClick={handleAppClick}
        pathname={pathname}
      />
    </div>
  );
}
