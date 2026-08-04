"use client";

import { money } from "@/lib/format";

const RESTAURANT_NAME = "El Tejaban";

export default function CorteTicket({ date, total, cash, card, ticketsCount }) {
  const d = new Date();
  
  return (
    <div
      id="ticket"
      className="mx-auto bg-white text-black text-sm font-mono p-4 w-[320px] border border-dashed border-line/40 hidden print:block"
    >
      <div className="text-center">
        <div className="font-display font-semibold text-base uppercase tracking-tight">
          {RESTAURANT_NAME}
        </div>
        <div className="text-xs font-bold mt-1">CORTE DE CAJA</div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="text-xs">
        <div>Fecha Impresión: {d.toLocaleString("es-MX")}</div>
        <div>Fecha Corte: {date}</div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Tickets Cobrados:</span>
          <span className="font-bold">{ticketsCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Ventas en Efectivo:</span>
          <span>{money(cash)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ventas en Tarjeta:</span>
          <span>{money(card)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      <div className="flex justify-between font-bold text-base">
        <span>TOTAL VENTAS</span>
        <span>{money(total)}</span>
      </div>
      
      <div className="border-t border-dashed border-black my-2" />
      
      <div className="text-xs space-y-4 mt-6">
        <div className="text-center border-t border-black pt-1 w-3/4 mx-auto">
          Firma Cajero
        </div>
      </div>
    </div>
  );
}
