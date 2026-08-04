import { describe, expect, it } from "vitest";
import { mergeOrderUpdate } from "./orderState";

describe("mergeOrderUpdate", () => {
  it("conserva el nombre de la mesa al aplicar la fila devuelta por una RPC", () => {
    const current = {
      id: "order-1",
      status: "open",
      total: 0,
      dining_tables: { name: "Mesa 4" },
    };

    expect(
      mergeOrderUpdate(current, {
        id: "order-1",
        status: "paid",
        total: 180,
        payment_method: "tarjeta",
      })
    ).toEqual({
      id: "order-1",
      status: "paid",
      total: 180,
      payment_method: "tarjeta",
      dining_tables: { name: "Mesa 4" },
    });
  });
});
