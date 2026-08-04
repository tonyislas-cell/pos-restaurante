"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";
import { GlassEffect } from "@/components/ui/glass";

// Devuelve YYYY-MM-DD en horario local
function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function ReportesPage() {
  const [mode, setMode] = useState("dia"); // 'dia' | 'semana'
  const [date, setDate] = useState(toKey(new Date()));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const base = new Date(date + "T00:00:00");
    let start, end;

    if (mode === "dia") {
      start = new Date(base);
      end = new Date(base);
      end.setDate(end.getDate() + 1);
    } else {
      // Semana lunes -> domingo que contiene la fecha
      const day = (base.getDay() + 6) % 7; // 0 = lunes
      start = new Date(base);
      start.setDate(start.getDate() - day);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }

    const { data } = await supabase
      .from("orders")
      .select("id,total,closed_at,payment_method, order_items(product_name,quantity,unit_price)")
      .eq("status", "paid")
      .gte("closed_at", start.toISOString())
      .lt("closed_at", end.toISOString())
      .order("closed_at");

    setOrders(data || []);
    setLoading(false);
  }, [date, mode]);

  useEffect(() => {
    load();
  }, [load]);

  // ----- Agregados -----
  const total = orders.reduce((a, o) => a + Number(o.total), 0);
  const ticketCount = orders.length;

  // Productos vendidos (global del rango)
  const productTotals = aggregateProducts(orders);

  // Desglose por día (para la vista semanal)
  const byDay = {};
  for (const o of orders) {
    const k = toKey(new Date(o.closed_at));
    (byDay[k] = byDay[k] || []).push(o);
  }
  const days = Object.keys(byDay).sort();

  return (
    <div className="space-y-5">
      <h1 className="font-display font-semibold text-2xl tracking-tight">Reportes</h1>

      <GlassEffect className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button
            className={mode === "dia" ? "btn-primary" : "btn-ghost"}
            onClick={() => setMode("dia")}
          >
            Día
          </button>
          <button
            className={mode === "semana" ? "btn-primary" : "btn-ghost"}
            onClick={() => setMode("semana")}
          >
            Semana
          </button>
        </div>
        <input
          type="date"
          className="input max-w-[180px]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </GlassEffect>

      {/* Totales del rango */}
      <div className="grid grid-cols-2 gap-4">
        <GlassEffect className="p-5 flex flex-col justify-center">
          <p className="text-sm text-muted">
            {mode === "dia" ? "Ventas del día" : "Ventas de la semana"}
          </p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{money(total)}</p>
        </GlassEffect>
        <GlassEffect className="p-5 flex flex-col justify-center">
          <p className="text-sm text-muted">Tickets cobrados</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{ticketCount}</p>
        </GlassEffect>
      </div>

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : mode === "dia" ? (
        <ProductTable title="Productos vendidos" rows={productTotals} />
      ) : (
        <div className="space-y-4">
          {days.length === 0 && (
            <p className="text-muted">No hubo ventas esta semana.</p>
          )}
          {days.map((k) => {
            const dayOrders = byDay[k];
            const dayTotal = dayOrders.reduce((a, o) => a + Number(o.total), 0);
            return (
              <GlassEffect key={k} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-display font-semibold">
                    {new Date(k + "T00:00:00").toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <span className="font-bold tabular-nums">
                    {money(dayTotal)}{" "}
                    <span className="text-muted text-sm">({dayOrders.length} tickets)</span>
                  </span>
                </div>
                <ProductTable rows={aggregateProducts(dayOrders)} compact />
              </GlassEffect>
            );
          })}
        </div>
      )}
    </div>
  );
}

function aggregateProducts(orders) {
  const map = {};
  for (const o of orders) {
    for (const it of o.order_items || []) {
      const cur = map[it.product_name] || { name: it.product_name, qty: 0, amount: 0 };
      cur.qty += it.quantity;
      cur.amount += Number(it.unit_price) * it.quantity;
      map[it.product_name] = cur;
    }
  }
  return Object.values(map).sort((a, b) => b.qty - a.qty);
}

function ProductTable({ title, rows, compact }) {
  if (rows.length === 0)
    return <p className="text-muted text-sm">Sin productos.</p>;
  const Wrapper = compact ? "div" : GlassEffect;
  return (
    <Wrapper className={compact ? "" : "p-5"}>
      {title && <h2 className="font-semibold mb-3">{title}</h2>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted border-b border-line/20">
            <th className="py-1">Producto</th>
            <th className="py-1 text-right">Cantidad</th>
            <th className="py-1 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-line/20 last:border-0">
              <td className="py-1">{r.name}</td>
              <td className="py-1 text-right font-semibold tabular-nums">{r.qty}</td>
              <td className="py-1 text-right tabular-nums">{money(r.amount)}</td>
            </tr>
          ))}
          </tbody>
      </table>
    </Wrapper>
  );
}
