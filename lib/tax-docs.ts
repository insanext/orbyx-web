// Utilidades compartidas de documentos tributarios (boleta / factura):
// formato chileno de montos, fechas dd-mm-aaaa y validación de RUT.
// La validación definitiva del RUT está en el backend (server.js); esta copia
// solo da feedback inmediato en el formulario.

export function formatCLP(value: number | null | undefined) {
  const n = Math.round(Number(value) || 0);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return n < 0 ? `-$${digits}` : `$${digits}`;
}

// 'YYYY-MM-DD' (o ISO) -> 'dd-mm-aaaa' sin pasar por Date (evita desfases de zona horaria).
export function formatDateDMY(value: string | null | undefined) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeRut(raw: string) {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export function isValidRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (!normalized) return false;
  const [body, dv] = normalized.split("-");
  if (!/^\d{7,8}$/.test(body)) return false;
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rest = 11 - (sum % 11);
  const expected = rest === 11 ? "0" : rest === 10 ? "K" : String(rest);
  return expected === dv;
}

// 12345678-5 -> 12.345.678-5
export function formatRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (!normalized) return raw;
  const [body, dv] = normalized.split("-");
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

export type TaxDocType = "boleta" | "factura";
export type TaxDocState = "pendiente" | "emitido" | "anulado";

export function taxDocTypeLabel(tipo: string) {
  return tipo === "factura" ? "Factura" : "Boleta";
}
