import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, onAuthStateChange, signInWithPassword } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
}));
let authListener;

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: { getSession, onAuthStateChange, signInWithPassword },
  },
}));

import AuthGate from "@/components/AuthGate";

describe("AuthGate", () => {
  beforeEach(() => {
    authListener = undefined;
    getSession.mockReset();
    signInWithPassword.mockReset();
    onAuthStateChange.mockReset().mockImplementation((listener) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("restores an existing session", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });

    render(<AuthGate><p>Caja protegida</p></AuthGate>);

    expect(await screen.findByText("Caja protegida")).toBeInTheDocument();
  });

  it("logs in with email and password", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    render(<AuthGate><p>Caja protegida</p></AuthGate>);
    fireEvent.change(await screen.findByLabelText("Correo electrónico"), {
      target: { value: "caja@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreto-seguro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({
      email: "caja@example.com",
      password: "secreto-seguro",
    }));
    expect(await screen.findByText("Caja protegida")).toBeInTheDocument();
  });

  it("shows a neutral message for invalid credentials", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    render(<AuthGate><p>Caja protegida</p></AuthGate>);
    fireEvent.change(await screen.findByLabelText("Correo electrónico"), {
      target: { value: "caja@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "incorrecta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
  });

  it("hides protected content when the session expires", async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    render(<AuthGate><p>Caja protegida</p></AuthGate>);
    expect(await screen.findByText("Caja protegida")).toBeInTheDocument();

    await act(async () => authListener("SIGNED_OUT", null));

    expect(await screen.findByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.queryByText("Caja protegida")).not.toBeInTheDocument();
  });
});
