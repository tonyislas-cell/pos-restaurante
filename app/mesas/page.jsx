"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";
import { ArrowLeft, User, Plus, X } from "lucide-react";
import { GlassEffect } from "@/components/ui/glass";

export default function MesasPage() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [openOrders, setOpenOrders] = useState([]); // cuentas abiertas
  const [newTable, setNewTable] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();

    // Realtime: si otra tablet abre/cobra una mesa, refrescamos.
    const channel = supabase
      .channel("mesas")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function load() {
    const [{ data: t }, { data: o }] = await Promise.all([
      supabase.from("dining_tables").select("*").order("sort_order"),
      supabase.from("orders").select("*").eq("status", "open"),
    ]);
    setTables(t || []);
    setOpenOrders(o || []);
    setLoading(false);
  }

  const orderForTable = (tableId) => openOrders.find((o) => o.table_id === tableId);

  async function openTable(table) {
    if (busy) return;
    const existing = orderForTable(table.id);
    if (existing) {
      router.push(`/cuenta/${existing.id}`);
      return;
    }
    // Crear una cuenta nueva para esta mesa
    setBusy(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({ table_id: table.id, status: "open", total: 0 })
      .select()
      .single();
    setBusy(false);
    if (error) return alert("Error: " + error.message);
    router.push(`/cuenta/${data.id}`);
  }

  async function addTable(e) {
    e.preventDefault();
    const name = newTable.trim();
    if (!name) return;
    const { error } = await supabase
      .from("dining_tables")
      .insert({ name, sort_order: tables.length + 1 });
    if (error) return alert("Error: " + error.message);
    setNewTable("");
    load();
  }

  async function deleteTable(table) {
    if (orderForTable(table.id)) return alert("No puedes borrar una mesa con cuenta abierta.");
    if (!confirm(`¿Borrar "${table.name}"?`)) return;
    const { error } = await supabase.from("dining_tables").delete().eq("id", table.id);
    if (error) return alert("Error: " + error.message);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-semibold text-2xl tracking-tight">Mesas</h1>

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tables.map((t) => {
            const order = orderForTable(t.id);
            const occupied = !!order;
            return (
              <div key={t.id} className="relative">
                <button
                  onClick={() => openTable(t)}
                  className={`w-full h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-semibold transition-transform duration-150 ease-out active:scale-[0.97] ${
                    occupied
                      ? "bg-brand text-ink border-brand"
                      : "bg-surface text-ink border-line/30 hover:border-brand"
                  }`}
                >
                  <span className="text-lg">{t.name}</span>
                  {occupied ? (
                    <span className="text-sm opacity-80 tabular-nums">{money(order.total)}</span>
                  ) : (
                    <span className="text-xs text-muted">Libre</span>
                  )}
                </button>
                <button
                  onClick={() => deleteTable(t)}
                  className={`absolute top-1 right-1 rounded-full w-5 h-5 flex items-center justify-center ${
                    occupied
                      ? "text-ink/50 hover:text-ink bg-black/10"
                      : "text-muted hover:text-ink bg-canvas"
                  }`}
                  title="Borrar mesa"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <GlassEffect className="max-w-sm">
        <form onSubmit={addTable} className="p-4 flex gap-2 w-full">
          <input
            className="input"
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            placeholder="Añadir mesa (ej. Mesa 7)"
          />
          <button className="btn-ghost" type="submit">
            Añadir
          </button>
        </form>
      </GlassEffect>
    </div>
  );
}
