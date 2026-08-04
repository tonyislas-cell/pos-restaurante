"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton({ className = "" }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setBusy(false);
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink disabled:opacity-50 ${className}`}
      onClick={logout}
      disabled={busy}
    >
      <LogOut size={17} />
      <span>Cerrar sesión</span>
    </button>
  );
}
