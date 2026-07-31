"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/format";
import Ticket from "@/components/Ticket";
import {
  UtensilsCrossed,
  ScanLine,
  Printer,
  CheckCircle2,
  Plus,
  Minus,
  Check,
  X as XIcon,
} from "lucide-react";

export default function CuentaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [scanFeedback, setScanFeedback] = useState(null); // { ok, text } | null

  // Cobro
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("efectivo");
  const [cash, setCash] = useState("");
  const [done, setDone] = useState(false); // ya se cobró -> mostrar ticket

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    const [{ data: ord }, { data: prods }, { data: cats }] = await Promise.all([
      supabase.from("orders").select("*, dining_tables(name)").eq("id", id).single(),
      supabase.from("products").select("*").eq("active", true).order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setOrder(ord);
    setProducts(prods || []);
    setCategories(cats || []);
    await loadItems();
    setLoading(false);
  }

  async function loadItems() {
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at");
    setItems(data || []);
    return data || [];
  }

  const total = useMemo(
    () => items.reduce((a, it) => a + Number(it.unit_price) * it.quantity, 0),
    [items]
  );

  async function persistTotal(newTotal) {
    await supabase.from("orders").update({ total: newTotal }).eq("id", id);
  }

  // ---------- Añadir / quitar productos ----------
  async function addProduct(p) {
    const existing = items.find((it) => it.product_id === p.id);
    if (existing) {
      await supabase
        .from("order_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("order_items").insert({
        order_id: id,
        product_id: p.id,
        product_name: p.name,
        unit_price: p.price,
        quantity: 1,
      });
    }
    const newItems = await loadItems();
    await persistTotal(sum(newItems));
  }

  async function changeQty(item, delta) {
    const q = item.quantity + delta;
    if (q <= 0) {
      await supabase.from("order_items").delete().eq("id", item.id);
    } else {
      await supabase.from("order_items").update({ quantity: q }).eq("id", item.id);
    }
    const newItems = await loadItems();
    await persistTotal(sum(newItems));
  }

  function sum(list) {
    return list.reduce((a, it) => a + Number(it.unit_price) * it.quantity, 0);
  }

  // ---------- Escáner SIEMPRE ACTIVO ----------
  // Un lector USB "teclea" el código muy rápido y termina con Enter. Captamos
  // las pulsaciones a nivel de ventana, sin necesidad de hacer clic en un campo.
  const onScanRef = useRef(() => {});
  onScanRef.current = (code) => {
    const found = products.find((p) => p.barcode === code);
    if (found) {
      addProduct(found);
      setScanFeedback({ ok: true, text: "Añadido: " + found.name });
    } else {
      setScanFeedback({ ok: false, text: "Código no encontrado: " + code });
    }
    clearTimeout(onScanRef.timer);
    onScanRef.timer = setTimeout(() => setScanFeedback(null), 2500);
  };

  useEffect(() => {
    let buffer = "";
    let lastTime = 0;
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const now = Date.now();
      if (now - lastTime > 100) buffer = ""; // reinicia si hubo pausa (tecleo humano)
      lastTime = now;

      if (e.key === "Enter") {
        if (!typing && buffer.length >= 3) onScanRef.current(buffer);
        buffer = "";
        return;
      }
      if (!typing && e.key.length === 1) buffer += e.key;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- Cobro ----------
  const cashNum = Number(cash) || 0;
  const change = method === "efectivo" ? Math.max(0, cashNum - total) : 0;

  async function confirmPayment() {
    if (items.length === 0) return alert("La cuenta está vacía.");
    if (method === "efectivo" && cashNum < total)
      return alert("El efectivo recibido es menor que el total.");

    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_method: method,
        total,
        cash_received: method === "efectivo" ? cashNum : null,
        change_due: method === "efectivo" ? change : null,
        closed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return alert("Error: " + error.message);

    setPaying(false);
    setDone(true);
  }

  async function cancelOrder() {
    if (!confirm("¿Cancelar esta cuenta? Se borrará.")) return;
    await supabase.from("orders").delete().eq("id", id); // items caen por cascade
    router.push("/mesas");
  }

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!order) return <p className="text-red-600">No se encontró la cuenta.</p>;

  const tableName = order.dining_tables?.name || "Cuenta";

  // ---------- Vista de ticket (tras cobrar) ----------
  if (done) {
    return (
      <div className="space-y-4">
        <div className="no-print card p-6 text-center space-y-3">
          <span className="inline-flex w-12 h-12 rounded-full bg-brand/15 items-center justify-center mx-auto">
            <CheckCircle2 size={26} strokeWidth={1.75} className="text-brand-dark" />
          </span>
          <p className="font-display font-semibold text-xl">Cuenta cobrada</p>
          <p className="text-muted tabular-nums">
            {tableName} — {money(total)} ({method})
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn-primary gap-2" onClick={() => window.print()}>
              <Printer size={18} strokeWidth={1.75} />
              Imprimir ticket
            </button>
            <button className="btn-ghost" onClick={() => router.push("/mesas")}>
              Volver a mesas
            </button>
          </div>
        </div>

        <Ticket
          tableName={tableName}
          items={items}
          total={total}
          method={method}
          cash={cashNum}
          change={change}
          date={new Date()}
        />
      </div>
    );
  }

  // ---------- Vista normal ----------
  const shownProducts =
    activeCat === "all"
      ? products
      : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:h-[calc(100vh-7rem)] lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      {/* (1-3) Chips de categoría */}
      <div className="lg:col-span-3 lg:col-start-1 lg:row-start-1 flex items-center gap-2 overflow-x-auto">
        <h1 className="font-display font-semibold text-xl tracking-tight mr-2 shrink-0">{tableName}</h1>
        <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
          Todos
        </CatChip>
        {categories.map((c) => (
          <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
            {c.name}
          </CatChip>
        ))}
      </div>

      {/* (7) Selección de productos */}
      <div className="lg:col-span-3 lg:col-start-1 lg:row-span-3 lg:row-start-2 lg:min-h-0 lg:overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {shownProducts.map((p) => {
            const qty = items.find((it) => it.product_id === p.id)?.quantity || 0;
            return (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className={`relative card overflow-hidden text-left transition-transform duration-150 ease-out active:scale-[0.97] ${
                  qty > 0 ? "ring-2 ring-brand border-brand" : "hover:border-brand"
                }`}
              >
                <div className="aspect-square bg-canvas flex items-center justify-center">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed size={32} strokeWidth={1.5} className="text-muted" />
                  )}
                </div>
                <div className="p-2">
                  <div className="font-semibold text-sm leading-tight truncate">{p.name}</div>
                  <div className="text-brand-dark font-bold tabular-nums">{money(p.price)}</div>
                </div>
                {qty > 0 && (
                  <span className="absolute top-1 right-1 bg-brand text-ink text-xs font-bold rounded-full min-w-[1.6rem] h-6 px-1 flex items-center justify-center shadow-soft tabular-nums">
                    {qty}x
                  </span>
                )}
              </button>
            );
          })}
          {shownProducts.length === 0 && (
            <p className="text-muted col-span-full">No hay artículos en esta categoría.</p>
          )}
        </div>
      </div>

      {/* (8) Panel de escaneo siempre activo */}
      <div className="lg:col-span-3 lg:col-start-1 lg:row-start-5 card p-3 flex items-center gap-3">
        <span className="inline-flex w-9 h-9 rounded-lg bg-brand/15 items-center justify-center shrink-0">
          <ScanLine size={18} strokeWidth={1.75} className="text-brand-dark" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Escáner activo</div>
          <div
            className={`flex items-center gap-1 text-xs truncate ${
              scanFeedback === null
                ? "text-muted"
                : scanFeedback.ok
                ? "text-brand-dark"
                : "text-red-600"
            }`}
          >
            {scanFeedback?.ok === true && <Check size={12} strokeWidth={2.5} className="shrink-0" />}
            {scanFeedback?.ok === false && <XIcon size={12} strokeWidth={2.5} className="shrink-0" />}
            <span className="truncate">
              {scanFeedback?.text || "Listo para escanear… apunta el lector a un código."}
            </span>
          </div>
        </div>
      </div>

      {/* (4) Panel de cobro detallado */}
      <div className="lg:col-span-2 lg:col-start-4 lg:row-span-4 lg:row-start-1 card p-4 flex flex-col lg:min-h-0">
        <h2 className="font-display font-semibold text-lg shrink-0">Cuenta — {tableName}</h2>

        {!paying ? (
          <>
            <div className="flex-1 lg:min-h-0 overflow-y-auto space-y-2 mt-2">
              {items.length === 0 && (
                <p className="text-muted text-sm">
                  Toca un artículo o escanéalo para añadirlo.
                </p>
              )}
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{it.product_name}</div>
                    <div className="text-xs text-muted tabular-nums">{money(it.unit_price)} c/u</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => changeQty(it, -1)}>
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums">{it.quantity}</span>
                    <button className="btn-ghost !px-2 !py-1" onClick={() => changeQty(it, +1)}>
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="w-16 text-right font-semibold tabular-nums">
                    {money(it.unit_price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line/20 pt-3 mt-2 flex justify-between items-center shrink-0">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-bold tabular-nums">{money(total)}</span>
            </div>
            <button
              className="text-red-600 text-sm mt-2 self-start shrink-0"
              onClick={cancelOrder}
            >
              Cancelar cuenta
            </button>
          </>
        ) : (
          <div className="flex-1 flex flex-col mt-2">
            <div className="flex justify-between items-center border-b border-line/20 pb-3">
              <span className="font-bold">Total a cobrar</span>
              <span className="text-2xl font-bold tabular-nums">{money(total)}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className={method === "efectivo" ? "btn-primary flex-1" : "btn-ghost flex-1"}
                onClick={() => setMethod("efectivo")}
              >
                Efectivo
              </button>
              <button
                className={method === "tarjeta" ? "btn-primary flex-1" : "btn-ghost flex-1"}
                onClick={() => setMethod("tarjeta")}
              >
                Tarjeta
              </button>
            </div>
            {method === "efectivo" && (
              <div className="space-y-2 mt-3">
                <label className="text-sm text-muted">Efectivo recibido</label>
                <input
                  className="input text-lg tabular-nums"
                  type="number"
                  step="0.01"
                  value={cash}
                  autoFocus
                  onChange={(e) => setCash(e.target.value)}
                  placeholder={String(total)}
                />
                <div className="flex justify-between text-lg">
                  <span>Cambio</span>
                  <span className="font-bold tabular-nums">{money(change)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* (5) Botón Cobrar / Confirmar */}
      <button
        className="btn-primary text-lg w-full lg:col-start-4 lg:row-start-5"
        disabled={!paying && items.length === 0}
        onClick={() => (paying ? confirmPayment() : setPaying(true))}
      >
        {paying ? "Confirmar cobro" : "Cobrar"}
      </button>

      {/* (6) Botón Guardar y volver / Atrás */}
      <button
        className="btn-ghost text-lg w-full lg:col-start-5 lg:row-start-5"
        onClick={() => (paying ? setPaying(false) : router.push("/mesas"))}
      >
        {paying ? "Atrás" : "Guardar y volver"}
      </button>
    </div>
  );
}

function CatChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-transform duration-150 ease-out active:scale-[0.97] ${
        active ? "bg-brand text-ink" : "bg-surface border border-line/30 text-ink"
      }`}
    >
      {children}
    </button>
  );
}
