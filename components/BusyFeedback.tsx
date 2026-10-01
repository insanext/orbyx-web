"use client";

import { installBusyFeedback } from "@/lib/busy-feedback";

// Se instala al evaluar el módulo (antes de que se creen los clientes de red)
// y es idempotente; el componente no renderiza nada.
if (typeof window !== "undefined") installBusyFeedback();

export default function BusyFeedback() {
  return null;
}
