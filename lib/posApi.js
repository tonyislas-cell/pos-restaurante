import { supabase } from "@/lib/supabaseClient";

const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Tu sesión terminó. Vuelve a iniciar sesión.",
  ORDER_NOT_FOUND: "No se encontró la cuenta.",
  ORDER_NOT_OPEN: "La cuenta ya no está abierta.",
  ORDER_EMPTY: "La cuenta está vacía.",
  PRODUCT_NOT_AVAILABLE: "El artículo ya no está disponible.",
  ITEM_NOT_FOUND: "El artículo ya no está en la cuenta.",
  INVALID_QUANTITY: "La cantidad no es válida.",
  INVALID_PAYMENT_METHOD: "El método de pago no es válido.",
  INSUFFICIENT_CASH: "El efectivo recibido es menor que el total.",
};

export class PosApiError extends Error {
  constructor(code, cause) {
    super(ERROR_MESSAGES[code] || "No se pudo completar la operación.");
    this.name = "PosApiError";
    this.code = code;
    this.cause = cause;
  }
}

function errorCode(error) {
  const text = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
  return Object.keys(ERROR_MESSAGES).find((code) => text.includes(code)) || "UNKNOWN";
}

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new PosApiError(errorCode(error), error);
  return Array.isArray(data) ? data[0] : data;
}

export function openOrder(tableId) {
  return callRpc("open_order", { p_table_id: tableId });
}

export function addOrderItem(orderId, productId) {
  return callRpc("add_order_item", {
    p_order_id: orderId,
    p_product_id: productId,
  });
}

export function setOrderItemQuantity(itemId, quantity) {
  return callRpc("set_order_item_quantity", {
    p_item_id: itemId,
    p_quantity: quantity,
  });
}

export function checkoutOrder({ orderId, method, cashReceived }) {
  return callRpc("checkout_order", {
    p_order_id: orderId,
    p_payment_method: method,
    p_cash_received: method === "efectivo" ? cashReceived : null,
  });
}

export function cancelOrder(orderId) {
  return callRpc("cancel_order", { p_order_id: orderId });
}
