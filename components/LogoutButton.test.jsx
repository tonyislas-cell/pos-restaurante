import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: { auth: { signOut } },
}));

import LogoutButton from "@/components/LogoutButton";

it("closes the Supabase session", async () => {
  render(<LogoutButton />);

  fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

  await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
});
