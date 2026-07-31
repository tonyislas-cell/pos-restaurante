"use client";

import { money } from "@/lib/format";

// Ticket imprimible. En pantalla se ve como una tarjeta pequeña;
// al imprimir, globals.css oculta todo lo demás y deja solo #ticket a 80mm.
// ---------------------------------------------------------------
// Datos del negocio: edita estas constantes con la información real.
// ADDRESS y PHONE son opcionales — si los dejas como cadena vacía "",
// esa línea simplemente no se imprime.
const RESTAURANT_NAME = "Mi Restaurante";
const ADDRESS = ""; // ej. "Av. Reforma 123, Col. Centro"
const PHONE = ""; // ej. "555-123-4567"
const FAREWELL_MESSAGE = "Gracias por su visita";

export default function Ticket({ tableName, items, total, method, cash, change, date }) {
  const d = date || new Date();
  return (
    <div
      id="ticket"
      className="mx-auto bg-white text-black text-sm font-mono p-4 w-[320px] border border-dashed border-line/40"
    >
      <div className="text-center">
        <div className="font-display font-semibold text-base uppercase tracking-tight">
          {RESTAURANT_NAME}
        </div>
        {ADDRESS && <div className="text-xs">{ADDRESS}</div>}
        {PHONE && <div className="text-xs">Tel: {PHONE}</div>}
        <div className="text-xs mt-0.5">{FAREWELL_MESSAGE}</div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-xs">
        <div>Fecha: {d.toLocaleString("es-MX")}</div>
        <div>{tableName}</div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <table className="w-full text-xs">
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td className="align-top">{it.quantity}x</td>
              <td className="align-top">{it.product_name}</td>
              <td className="align-top text-right whitespace-nowrap">
                {money(it.unit_price * it.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between font-bold text-base">
        <span>TOTAL</span>
        <span>{money(total)}</span>
      </div>

      <div className="text-xs mt-1">
        <div className="flex justify-between">
          <span>Pago</span>
          <span className="capitalize">{method}</span>
        </div>
        {method === "efectivo" && (
          <>
            <div className="flex justify-between">
              <span>Recibido</span>
              <span>{money(cash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cambio</span>
              <span>{money(change)}</span>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2" />
      <div className="text-center text-xs">*** {RESTAURANT_NAME} ***</div>
    </div>
  );
}
