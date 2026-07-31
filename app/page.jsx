"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";
import { Armchair, UtensilsCrossed, BarChart3 } from "lucide-react";

export default function Home() {
  const [openCount, setOpenCount] = useState(null);
  const [todayTotal, setTodayTotal] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // Cuentas abiertas ahora mismo
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    setOpenCount(count ?? 0);

    // Total cobrado hoy
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("closed_at", start.toISOString());
    const sum = (data || []).reduce((a, o) => a + Number(o.total), 0);
    setTodayTotal(sum);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-semibold text-2xl tracking-tight">Inicio</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <Stat label="Cuentas abiertas" value={openCount ?? "…"} />
        <Stat
          label="Cobrado hoy"
          value={todayTotal == null ? "…" : money(todayTotal)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tile href="/mesas" icon={Armchair} title="Mesas" desc="Abrir cuentas y cobrar" />
        <Tile href="/productos" icon={UtensilsCrossed} title="Artículos" desc="Añadir y editar el menú" />
        <Tile href="/reportes" icon={BarChart3} title="Reportes" desc="Ventas del día y la semana" />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-5 flex-1">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function Tile({ href, icon: Icon, title, desc }) {
  return (
    <Link href={href} className="card p-6 hover:shadow-md transition-shadow block">
      <span className="inline-flex w-11 h-11 rounded-xl bg-brand/15 items-center justify-center">
        <Icon size={22} strokeWidth={1.75} className="text-brand-dark" />
      </span>
      <h2 className="font-display font-semibold text-lg mt-3">{title}</h2>
      <p className="text-sm text-muted">{desc}</p>
    </Link>
  );
}
