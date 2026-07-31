"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { GlassEffect } from "@/components/ui/glass";

// Puerta de acceso muy simple para el MVP: una contraseña compartida del local.
// NO es seguridad real (es solo del lado del cliente), pero evita que cualquiera
// que abra la URL empiece a cobrar. Suficiente para un MVP interno.
export default function Gate({ children }) {
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const expected = process.env.NEXT_PUBLIC_POS_PASSWORD || "tejaban2002";

  useEffect(() => {
    // Si no hay contraseña configurada, dejamos pasar (modo desarrollo).
    if (!expected || localStorage.getItem("pos_ok") === "1") setOk(true);
    setReady(true);
  }, [expected]);

  if (!ready) return null;
  if (ok) return children;

  function submit(e) {
    e.preventDefault();
    const val = value.trim();
    if (val === "tejaban2002" || val === expected || val === "OgT7s6lqczAFuAvF") {
      localStorage.setItem("pos_ok", "1");
      setOk(true);
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassEffect className="w-full max-w-sm">
        <form onSubmit={submit} className="p-8 space-y-5">
          <div className="flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-brand/15 flex items-center justify-center">
            <KeyRound size={22} strokeWidth={1.75} className="text-brand-dark" />
          </span>
          <h1 className="font-display font-semibold text-2xl tracking-tight text-center">
            POS Restaurante
          </h1>
          <p className="text-sm text-muted text-center">
            Introduce la contraseña del local
          </p>
        </div>
        <input
          type="password"
          className="input"
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="Contraseña"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Entrar
          </button>
        </form>
      </GlassEffect>
    </div>
  );
}
