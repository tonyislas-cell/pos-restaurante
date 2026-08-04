"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { GlassEffect } from "@/components/ui/glass";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.session) {
      setError("Correo o contraseña incorrectos.");
      setSubmitting(false);
      return;
    }

    setSession(data.session);
    setSubmitting(false);
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Verificando sesión…
      </div>
    );
  }

  if (session) return children;

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
              Inicia sesión con la cuenta de caja
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="pos-email" className="text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="pos-email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              autoFocus
              required
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pos-password" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="pos-password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              required
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </GlassEffect>
    </div>
  );
}
