// El botón "Volver" de las páginas de Flow/Transbank no siempre pasa por nuestra
// url_return: puede llevar a la URL de sitio configurada en la cuenta de Flow
// (la home pública). Antes de salir hacia Flow dejamos anotado a dónde debe
// volver el usuario; si termina en la home justo después, FlowReturnRedirect
// lo devuelve a su facturación (la sesión sigue intacta en www.orbyx.cl).
const KEY = "orbyx_flow_return";
const MAX_AGE_MS = 15 * 60 * 1000;

export function markFlowReturn(path: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {}
}

export function clearFlowReturn() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function consumeFlowReturn(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    localStorage.removeItem(KEY);
    if (!path || !at || Date.now() - at > MAX_AGE_MS) return null;
    if (!path.startsWith("/dashboard/")) return null;
    return path;
  } catch {
    return null;
  }
}
