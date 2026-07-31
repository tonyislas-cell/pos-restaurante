"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { money, generateBarcode } from "@/lib/format";
import { uploadProductImage } from "@/lib/storage";
import { X, UtensilsCrossed } from "lucide-react";

const EMPTY = { name: "", price: "", category_id: "", barcode: "", image_url: "", active: true };

export default function ProductosPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*").order("name"),
    ]);
    setCategories(cats || []);
    setProducts(prods || []);
    setLoading(false);
  }

  // ---------- Productos ----------
  async function saveProduct(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Escribe un nombre");
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      category_id: form.category_id || null,
      barcode: form.barcode.trim() || null,
      image_url: form.image_url || null,
      active: form.active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    if (error) return alert("Error: " + error.message);

    setForm(EMPTY);
    setEditingId(null);
    loadAll();
  }

  function editProduct(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      category_id: p.category_id || "",
      barcode: p.barcode || "",
      image_url: p.image_url || "",
      active: p.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Imagen ----------
  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      alert("No se pudo subir la imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteProduct(p) {
    if (!confirm(`¿Borrar "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return alert("Error: " + error.message);
    loadAll();
  }

  // ---------- Categorías ----------
  async function addCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    const { error } = await supabase
      .from("categories")
      .insert({ name, sort_order: categories.length + 1 });
    if (error) return alert("Error: " + error.message);
    setNewCategory("");
    loadAll();
  }

  async function deleteCategory(c) {
    if (!confirm(`¿Borrar la categoría "${c.name}"? Los productos quedarán sin categoría.`))
      return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return alert("Error: " + error.message);
    loadAll();
  }

  const catName = (id) => categories.find((c) => c.id === id)?.name || "Sin categoría";

  return (
    <div className="space-y-6">
      <h1 className="font-display font-semibold text-2xl tracking-tight">Artículos</h1>

      {/* Formulario alta/edición */}
      <form onSubmit={saveProduct} className="card p-5 space-y-4">
        <h2 className="font-semibold">
          {editingId ? "Editar artículo" : "Nuevo artículo"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted">Nombre</span>
            <input
              className="input mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Hamburguesa"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Precio</span>
            <input
              className="input mt-1"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Tipo / categoría</span>
            <select
              className="input mt-1"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-muted">Código de barras</span>
            <div className="flex gap-2 mt-1">
              <input
                className="input"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Escanea o genera uno"
              />
              <button
                type="button"
                className="btn-ghost whitespace-nowrap"
                onClick={() => setForm({ ...form, barcode: generateBarcode() })}
              >
                Generar
              </button>
            </div>
          </label>
        </div>

        {/* Imagen de referencia */}
        <div>
          <span className="text-sm text-muted">Imagen de referencia</span>
          <div className="mt-1 flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl border border-line/30 bg-canvas overflow-hidden flex items-center justify-center shrink-0">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed size={24} strokeWidth={1.5} className="text-muted" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="btn-ghost cursor-pointer !py-2">
                {uploading ? "Subiendo…" : form.image_url ? "Cambiar foto" : "Subir foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={onPickImage}
                />
              </label>
              {form.image_url && (
                <button
                  type="button"
                  className="text-red-600 text-sm text-left"
                  onClick={() => setForm({ ...form, image_url: "" })}
                >
                  Quitar imagen
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span className="text-sm">Activo (se puede vender)</span>
        </label>

        <div className="flex gap-2">
          <button className="btn-primary" type="submit">
            {editingId ? "Guardar cambios" : "Añadir artículo"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Gestión de categorías */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Categorías (tipos)</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 bg-canvas rounded-full pl-3 pr-2 py-1 text-sm"
            >
              {c.name}
              <button
                onClick={() => deleteCategory(c)}
                className="text-muted hover:text-red-600"
                title="Borrar categoría"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <span className="text-sm text-muted">Aún no hay categorías.</span>
          )}
        </div>
        <form onSubmit={addCategory} className="flex gap-2 max-w-sm">
          <input
            className="input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría (ej. Postre)"
          />
          <button className="btn-ghost" type="submit">
            Añadir
          </button>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Lista de artículos ({products.length})</h2>
        {loading ? (
          <p className="text-muted">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="text-muted">Aún no hay artículos. Añade el primero arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-line/20">
                  <th className="py-2 w-14">Foto</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2">Código</th>
                  <th className="py-2"></th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/20 last:border-0">
                    <td className="py-2">
                      <div className="w-10 h-10 rounded-lg border border-line/30 bg-canvas overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed size={16} strokeWidth={1.5} className="text-muted" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 font-medium">
                      {p.name}
                      {!p.active && (
                        <span className="ml-2 text-xs text-red-600">(inactivo)</span>
                      )}
                    </td>
                    <td className="py-2 text-muted">{catName(p.category_id)}</td>
                    <td className="py-2 text-right tabular-nums">{money(p.price)}</td>
                    <td className="py-2 text-muted font-mono text-xs">
                      {p.barcode || "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button className="text-brand-dark font-semibold" onClick={() => editProduct(p)}>
                        Editar
                      </button>
                    </td>
                    <td className="py-2 text-right">
                      <button className="text-red-600" onClick={() => deleteProduct(p)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
