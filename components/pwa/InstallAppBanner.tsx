"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

// Banner "Instala la app" del dashboard. Solo aparece si:
//  - es mobile web (pantalla angosta + táctil),
//  - la app NO está corriendo instalada (display-mode standalone),
//  - el navegador ofreció instalarla (beforeinstallprompt — Chrome/Edge en
//    Android), o es un iPhone: iOS no tiene beforeinstallprompt ni deja
//    abrir la instalación desde la página, así que ahí el banner muestra
//    las instrucciones (Compartir → "Agregar a inicio") en vez del botón,
//  - el usuario no lo descartó ni la instaló antes (localStorage).
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

const HIDE_KEY = "orbyx_install_banner_hidden";

function rememberHidden() {
  try {
    localStorage.setItem(HIDE_KEY, "1");
  } catch {
    /* sin storage: solo se oculta en esta sesión */
  }
}

export default function InstallAppBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(HIDE_KEY)) return;
    } catch {
      /* sin storage: seguimos, igual se oculta al descartar */
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isMobile =
      window.matchMedia("(max-width: 767px)").matches &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isStandalone || !isMobile) return;

    // iPhone/iPod (en cualquier navegador: desde iOS 16.4 Chrome/Firefox
    // también ofrecen "Agregar a inicio" en su menú Compartir). Abierta
    // desde el ícono ya cae en isStandalone arriba (navigator.standalone).
    if (/iPhone|iPod/i.test(navigator.userAgent)) {
      setShowIosHelp(true);
      return;
    }

    const pick = () => {
      if (window.__orbyxInstallPrompt) setPromptEvent(window.__orbyxInstallPrompt);
    };
    const onInstalled = () => {
      rememberHidden();
      window.__orbyxInstallPrompt = null;
      setPromptEvent(null);
    };

    pick();
    window.addEventListener("orbyx-install-available", pick);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("orbyx-install-available", pick);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent && !showIosHelp) return null;

  async function handleInstall() {
    const event = promptEvent;
    if (!event) return;
    // El evento solo se puede usar una vez: se oculta el banner ya.
    setPromptEvent(null);
    window.__orbyxInstallPrompt = null;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") rememberHidden();
    } catch {
      /* prompt no disponible: no hacemos nada */
    }
  }

  function handleDismiss() {
    rememberHidden();
    setPromptEvent(null);
    setShowIosHelp(false);
  }

  if (showIosHelp) {
    return (
      <div className="px-3 pt-3 md:hidden">
        <div
          className="flex items-start gap-3 rounded border px-3 py-2.5"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-main)" }}>
              Instala la app de Orbyx
            </p>
            <p className="mt-0.5 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              Toca{" "}
              <Share
                aria-label="Compartir"
                className="inline h-3.5 w-3.5 -translate-y-px align-middle"
                style={{ color: "var(--accent-solid, #2563eb)" }}
              />{" "}
              <strong style={{ color: "var(--text-main)" }}>Compartir</strong> y luego{" "}
              <SquarePlus aria-hidden="true" className="inline h-3.5 w-3.5 -translate-y-px align-middle" />{" "}
              <strong style={{ color: "var(--text-main)" }}>Agregar a inicio</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="No mostrar de nuevo"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 md:hidden">
      <div
        className="flex items-center gap-3 rounded border px-3 py-2.5"
        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5" style={{ color: "var(--text-main)" }}>
            Instala la app de Orbyx
          </p>
          <p className="text-xs leading-4" style={{ color: "var(--text-muted)" }}>
            Abre tu agenda desde la pantalla de inicio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded px-3 text-xs font-semibold text-white"
          style={{ background: "var(--accent-solid, #2563eb)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Instalar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="No mostrar de nuevo"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
