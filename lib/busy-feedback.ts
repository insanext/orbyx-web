/**
 * Feedback "procesando" + guardia anti doble-toque para TODA la app.
 *
 * Idea: cada click sobre algo tocable queda registrado un instante. Si dentro
 * de ese mismo gesto el handler dispara una petición de red (apiFetch o
 * fetch), el elemento queda marcado `data-busy="true"` hasta que la petición
 * termina (éxito o error). Mientras esté marcado:
 *   - se ve atenuado y, si es un botón con texto, con un spinner (globals.css);
 *   - cualquier otro click sobre él se descarta en fase de captura, ANTES de
 *     que llegue a React, así que el envío no puede duplicarse.
 * Navegaciones de <Link> (Next pide el RSC con fetch) quedan cubiertas igual.
 *
 * Límites conocidos: peticiones que arrancan >120 ms después del click, XHR, y
 * llamadas del cliente supabase-js creadas antes de instalar el parche. Para
 * excluir un elemento, `data-no-busy`.
 */

const SELECTOR =
  'button, a[href], [role="button"], [role="tab"], [role="switch"], input[type="submit"], input[type="button"], summary';
const ATTRIBUTION_WINDOW_MS = 120;
const SAFETY_RELEASE_MS = 30000;

const counts = new WeakMap<Element, number>();
let lastClick: { el: Element; t: number } | null = null;
let installed = false;

function bump(el: Element, delta: 1 | -1) {
  const next = Math.max(0, (counts.get(el) ?? 0) + delta);
  counts.set(el, next);
  if (next > 0) {
    el.setAttribute("data-busy", "true");
    el.setAttribute("aria-busy", "true");
    if (!(el.textContent || "").trim()) el.setAttribute("data-busy-icon", "true");
  } else {
    el.removeAttribute("data-busy");
    el.removeAttribute("aria-busy");
    el.removeAttribute("data-busy-icon");
  }
}

/** Asocia una promesa (petición) al último elemento tocado, si el gesto es reciente. */
export function trackBusy<T>(promise: Promise<T>): Promise<T> {
  if (typeof window === "undefined" || !lastClick) return promise;
  if (performance.now() - lastClick.t > ATTRIBUTION_WINDOW_MS) return promise;
  const el = lastClick.el;
  if (!el.isConnected || el.hasAttribute("data-no-busy")) return promise;

  bump(el, 1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    window.clearTimeout(timer);
    bump(el, -1);
  };
  const timer = window.setTimeout(release, SAFETY_RELEASE_MS);
  promise.then(release, release);
  return promise;
}

export function installBusyFeedback() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = (event.target as Element | null)?.closest?.(SELECTOR) ?? null;
      if (target && target.getAttribute("data-busy") === "true") {
        // Ya hay una acción en curso en este elemento: se ignora el toque.
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      lastClick = target ? { el: target, t: performance.now() } : null;
    },
    true
  );

  // confirm()/alert()/prompt() bloquean el hilo: el tiempo que el usuario tarda
  // en responder no debe contar contra la ventana de atribución del click.
  for (const name of ["confirm", "alert", "prompt"] as const) {
    const original = window[name] as (...args: unknown[]) => unknown;
    (window as unknown as Record<string, unknown>)[name] = function (...args: unknown[]) {
      const start = performance.now();
      try {
        return original.apply(window, args);
      } finally {
        if (lastClick) lastClick.t += performance.now() - start;
      }
    };
  }

  const originalFetch = window.fetch;
  window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
    return trackBusy(originalFetch.apply(window, args));
  } as typeof fetch;
}
