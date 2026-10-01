// Deep-link del aviso "Falta completar" (dashboard/[slug]/layout.tsx): lleva
// al campo faltante con scroll suave + resaltado rojo. Los campos se montan
// cuando termina de cargar cada panel, así que se reintenta unos segundos
// hasta que el input exista. El resaltado se quita apenas el usuario escribe.
export function focusMissingFields(ids: string[], timeoutMs = 6000): () => void {
  if (typeof window === "undefined" || ids.length === 0) return () => {};

  let done = false;
  const startedAt = Date.now();

  function apply(): boolean {
    const elements = ids
      .map((id) => document.getElementById(id) as HTMLInputElement | null)
      .filter((el): el is HTMLInputElement => !!el);
    if (elements.length < ids.length) return false;

    elements.forEach((el) => {
      el.style.borderColor = "#ef4444";
      el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.25)";
      el.addEventListener(
        "input",
        () => {
          el.style.borderColor = "var(--border-color)";
          el.style.boxShadow = "";
        },
        { once: true }
      );
    });
    elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      elements[0].focus({ preventScroll: true });
    } catch {}
    return true;
  }

  const timer = window.setInterval(() => {
    if (done) return;
    if (apply() || Date.now() - startedAt > timeoutMs) {
      done = true;
      window.clearInterval(timer);
    }
  }, 250);

  return () => {
    done = true;
    window.clearInterval(timer);
  };
}
