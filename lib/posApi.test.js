import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: { rpc },
}));

import {
  addOrderItem,
  cancelOrder,
  checkoutOrder,
  openOrder,
  setOrderItemQuantity,
} from "@/lib/posApi";

describe("posApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it.each([
    ["openOrder", () => openOrder("table-1"), "open_order", { p_table_id: "table-1" }],
    [
      "addOrderItem",
      () => addOrderItem("order-1", "product-1"),
      "add_order_item",
      { p_order_id: "order-1", p_product_id: "product-1" },
    ],
    [
      "setOrderItemQuantity",
      () => setOrderItemQuantity("item-1", 3),
      "set_order_item_quantity",
      { p_item_id: "item-1", p_quantity: 3 },
    ],
    ["cancelOrder", () => cancelOrder("order-1"), "cancel_order", { p_order_id: "order-1" }],
  ])("%s invokes its protected RPC", async (_name, call, rpcName, params) => {
    rpc.mockResolvedValue({ data: { id: "order-1" }, error: null });

    await expect(call()).resolves.toEqual({ id: "order-1" });
    expect(rpc).toHaveBeenCalledWith(rpcName, params);
  });

  it("sends null cash for card payments", async () => {
    rpc.mockResolvedValue({ data: { id: "order-1", status: "paid" }, error: null });

    await checkoutOrder({ orderId: "order-1", method: "tarjeta", cashReceived: 500 });

    expect(rpc).toHaveBeenCalledWith("checkout_order", {
      p_order_id: "order-1",
      p_payment_method: "tarjeta",
      p_cash_received: null,
    });
  });

  it("sends the received cash for cash payments", async () => {
    rpc.mockResolvedValue({ data: { id: "order-1", status: "paid" }, error: null });

    await checkoutOrder({ orderId: "order-1", method: "efectivo", cashReceived: 500 });

    expect(rpc).toHaveBeenCalledWith("checkout_order", {
      p_order_id: "order-1",
      p_payment_method: "efectivo",
      p_cash_received: 500,
    });
  });

  it("converts database errors into a stable POS error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "ORDER_NOT_OPEN" } });

    await expect(cancelOrder("order-1")).rejects.toMatchObject({
      name: "PosApiError",
      code: "ORDER_NOT_OPEN",
      message: "La cuenta ya no está abierta.",
    });
  });

  it("normalizes a one-row RPC response", async () => {
    rpc.mockResolvedValue({ data: [{ id: "order-1", status: "open" }], error: null });

    await expect(openOrder("table-1")).resolves.toEqual({ id: "order-1", status: "open" });
  });
});
