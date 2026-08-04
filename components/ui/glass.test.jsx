import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GlassEffect } from "@/components/ui/glass";

it("ignores clicks while disabled", () => {
  const onClick = vi.fn();
  render(<GlassEffect onClick={onClick} disabled>Producto</GlassEffect>);

  fireEvent.click(screen.getByText("Producto"));

  expect(onClick).not.toHaveBeenCalled();
});
