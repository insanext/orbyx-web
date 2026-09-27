"use client";

import { Download, EllipsisVertical, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

// Banner "Instala la app" del dashboard. Solo en mobile web, nunca dentro
// de la app instalada (display-mode standalone). Tres modos:
//  - "prompt": el navegador ofreció instalarla (beforeinstallprompt,
//    Chrome/Edge Android) -> botón "Instalar" que abre el prompt nativo.
//  - "manual": Android sin el evento (Chrome decide por heurística propia
//    si lo dispara, p.ej. recién desinstalada) -> instrucciones del menú ⋮.
//    Si el evento llega después, pasa a "prompt".
//  - "ios": iPhone no tiene beforeinstallprompt -> Compartir -> Agregar a inicio.
//
// Visibilidad:
//  - La ✕ lo oculta hasta el próximo inicio de sesión desde la web: la
//    marca vive en localStorage y app/login/page.tsx la borra al loguearse
//    (clearInstallBannerDismissal).
//  - Si ya está instalada, no se muestra: navigator.getInstalledRelatedApps()
//    (Chrome Android, con related_applications "webapp" en app/manifest.ts)
//    y, justo después de instalar, una marca de sesión (appinstalled). Nada
//    se guarda de forma permanente por instalar: si la desinstalan, vuelve.
// El evento lo captura PWA_BOOT_SCRIPT en el <head> (components/pwa/
// WelcomeSplash.tsx), porque Chrome lo dispara antes de que esto monte.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __orbyxInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const DISMISS_KEY = "orbyx_install_banner_dismissed";
const INSTALLED_SESSION_KEY = "orbyx_app_installed_this_session";
// Marca permanente de la versión anterior (se guardaba al instalar y nunca
// se borraba, así que tras desinstalar el banner no volvía): se limpia.
const LEGACY_HIDE_KEY = "orbyx_install_banner_hidden";

export function clearInstallBannerDismissal() {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* sin storage: nada que limpiar */
  }
}

type BannerMode = "prompt" | "manual" | "ios" | null;

export default function InstallAppBanner() {
  const [mode, setMode] = useState<BannerMode>(null);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_HIDE_KEY);
      if (localStorage.getItem(DISMISS_KEY)) return;
      if (sessionStorage.getItem(INSTALLED_SESSION_KEY)) return;
    } catch {
      /* sin storage: seguimos */
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isMobile =
      window.matchMedia("(max-width: 767px)").matches &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isStandalone || !isMobile) return;

    // iPhone/iPod (en cualquier navegador: desde iOS 16.4 Chrome/Firefox
    // también ofrecen "Agregar a inicio" en su menú Compartir).
    if (/iPhone|iPod/i.test(navigator.userAgent)) {
      setMode("ios");
      return;
    }

    let cancelled = false;

    const pick = () => {
      if (cancelled || !window.__orbyxInstallPrompt) return;
      setPromptEvent(window.__orbyxInstallPrompt);
      setMode("prompt");
    };
    const onInstalled = () => {
      try {
        sessionStorage.setItem(INSTALLED_SESSION_KEY, "1");
      } catch {
        /* sin storage: igual se oculta ahora */
      }
      window.__orbyxInstallPrompt = null;
      setPromptEvent(null);
      setMode(null);
    };

    window.addEventListener("orbyx-install-available", pick);
    window.addEventListener("appinstalled", onInstalled);

    (async () => {
      // Ya instalada (Chrome Android): no mostrar nada.
      const nav = navigator as Navigator & {
        getInstalledRelatedApps?: () => Promise<unknown[]>;
      };
      if (typeof nav.getInstalledRelatedApps === "function") {
        try {
          const related = await nav.getInstalledRelatedApps();
          if (cancelled) return;
          if (Array.isArray(related) && related.length > 0) return;
        } catch {
          /* no disponible: seguimos */
        }
      }
      if (cancelled) return;
      if (window.__orbyxInstallPrompt) {
        pick();
      } else {
        setMode("manual");
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("orbyx-install-available", pick);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  async function handleInstall() {
    const event = promptEvent;
    if (!event) return;
    // El evento solo se puede usar una vez.
    setPromptEvent(null);
    window.__orbyxInstallPrompt = null;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      // Aceptó: appinstalled lo oculta. Rechazó el prompt: quedan las
      // instrucciones manuales (el evento ya no se puede reutilizar).
      if (choice.outcome !== "accepted") setMode("manual");
    } catch {
      setMode("manual");
    }
  }

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sin storage: solo se oculta ahora */
    }
    setMode(null);
  }

  const iconClass = "inline h-3.5 w-3.5 -translate-y-px align-middle";

  return (
    <div className="px-3 pt-3 md:hidden">
      <div
        className={`flex gap-3 rounded border px-3 py-2.5 ${mode === "prompt" ? "items-center" : "items-start"}`}
        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-main)" }}>
            Instala la app de Orbyx
          </p>
          {mode === "prompt" ? (
            <p className="text-xs leading-4" style={{ color: "var(--text-muted)" }}>
              Abre tu agenda desde la pantalla de inicio.
            </p>
          ) : mode === "ios" ? (
            <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              Toca{" "}
              <Share aria-label="Compartir" className={iconClass} style={{ color: "var(--accent-solid, #2563eb)" }} />{" "}
              <strong style={{ color: "var(--text-main)" }}>Compartir</strong> y luego{" "}
              <SquarePlus aria-hidden="true" className={iconClass} />{" "}
              <strong style={{ color: "var(--text-main)" }}>Agregar a inicio</strong>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              Para instalar: toca el menú{" "}
              <EllipsisVertical aria-label="menú" className={iconClass} style={{ color: "var(--text-main)" }} />{" "}
              de Chrome → <strong style={{ color: "var(--text-main)" }}>Instalar aplicación</strong>{" "}
              (o &ldquo;Agregar a la pantalla principal&rdquo;).
            </p>
          )}
        </div>
        {mode === "prompt" ? (
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded px-3 text-xs font-semibold text-white"
            style={{ background: "var(--accent-solid, #2563eb)" }}
          >
            <Download className="h-3.5 w-3.5" />
            Instalar
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Ocultar hasta el próximo inicio de sesión"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
