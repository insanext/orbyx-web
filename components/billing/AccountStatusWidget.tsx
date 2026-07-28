"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, MessageCircle, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type UsageCounter = {
  used: number;
  total: number;
  remaining: number;
};

export type AccountStatus = {
  ok: boolean;
  trial_active: boolean;
  trial_expired: boolean;
  dias_restantes_trial: number | null;
  subscription_status: string;
  awaiting_payment: boolean;
  dias_restantes_pago: number | null;
  blocked: boolean;
  blocked_reason: "trial_expired" | "payment_overdue" | null;
  wa_confirmacion: UsageCounter;
  ia_wa: UsageCounter;
};

export function useAccountStatus(tenantId: string) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch(
          `${BACKEND_URL}/billing/account-status?tenant_id=${tenantId}`
        );
        const data = await res.json();
        if (!cancelled && res.ok) setStatus(data);
      } catch {
        // si falla, no bloqueamos la UI por esto — el backend igual
        // aplica cualquier enforcement real que exista en otros lados
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return { status, loaded };
}

function UsagePill({
  icon: Icon,
  label,
  usage,
  textMuted,
  textMain,
  borderColor,
  bg,
}: {
  icon: typeof MessageCircle;
  label: string;
  usage: UsageCounter;
  textMuted: string;
  textMain: string;
  borderColor: string;
  bg: string;
}) {
  const isUnlimitedOrOff = usage.total <= 0;
  const nearLimit = !isUnlimitedOrOff && usage.remaining <= Math.max(1, Math.round(usage.total * 0.1));

  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2"
      style={{ borderColor, background: bg }}
    >
      <Icon size={15} style={{ color: nearLimit ? "rgb(244,63,94)" : textMuted }} />
      <div className="min-w-0">
        <p className="text-[11px]" style={{ color: textMuted }}>
          {label}
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: nearLimit ? "rgb(244,63,94)" : textMain }}
        >
          {isUnlimitedOrOff ? "No incluido" : `${usage.used} / ${usage.total}`}
        </p>
      </div>
    </div>
  );
}

export function AccountStatusWidget({
  tenantId,
  slug,
  isNocturno,
}: {
  tenantId: string;
  slug: string;
  isNocturno: boolean;
}) {
  const { status } = useAccountStatus(tenantId);
  const [open, setOpen] = useState(false);

  if (!status) return null;

  const textMuted = "var(--text-muted)";
  const textMain = "var(--text-main)";
  const borderColor = isNocturno ? "rgba(56,189,248,0.20)" : "rgba(59,130,246,0.18)";
  const softBg = isNocturno ? "rgba(15,23,42,0.72)" : "rgba(220,232,255,0.72)";
  const dropdownBg = isNocturno ? "rgb(15,23,42)" : "rgb(236,244,255)";

  const urgent = status.blocked || status.trial_active || status.awaiting_payment;
  if (!urgent && status.wa_confirmacion.total <= 0 && status.ia_wa.total <= 0) {
    // Nada relevante que mostrar (plan sin estos add-ons y sin trial/pago pendiente).
    return null;
  }

  let pillLabel = "Mi cuenta";
  let pillTone: "danger" | "warning" | "info" | "neutral" = "neutral";

  if (status.blocked) {
    pillLabel = "Cuenta bloqueada";
    pillTone = "danger";
  } else if (status.trial_active) {
    pillLabel = `Trial: ${status.dias_restantes_trial} día${status.dias_restantes_trial === 1 ? "" : "s"}`;
    pillTone = "info";
  } else if (status.awaiting_payment) {
    pillLabel = `Pago pendiente: ${status.dias_restantes_pago} día${status.dias_restantes_pago === 1 ? "" : "s"}`;
    pillTone = "warning";
  }

  const toneColors: Record<string, { border: string; bg: string; text: string }> = {
    danger: { border: "rgba(244,63,94,0.5)", bg: "rgba(244,63,94,0.14)", text: "rgb(251,113,133)" },
    warning: { border: "rgba(245,158,11,0.5)", bg: "rgba(245,158,11,0.14)", text: "rgb(252,211,77)" },
    info: { border: "rgba(37,99,235,0.5)", bg: "rgba(37,99,235,0.14)", text: "rgb(147,197,253)" },
    neutral: { border: borderColor, bg: softBg, text: textMain },
  };
  const tone = toneColors[pillTone];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition"
        style={{ borderColor: tone.border, background: tone.bg, color: tone.text }}
      >
        {pillTone === "danger" || pillTone === "warning" ? (
          <AlertTriangle size={15} />
        ) : (
          <Clock size={15} />
        )}
        {pillLabel}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border p-4"
          style={{
            background: dropdownBg,
            borderColor,
            boxShadow: "0 12px 40px -8px rgba(0,0,0,0.28), 0 4px 16px -4px rgba(0,0,0,0.18)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: textMuted }}>
              Estado de mi cuenta
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" style={{ color: textMuted }}>
              <X size={16} />
            </button>
          </div>

          {status.blocked ? (
            <div className="mb-3 rounded-xl border p-3 text-sm" style={{ borderColor: tone.border, background: tone.bg, color: tone.text }}>
              {status.blocked_reason === "trial_expired"
                ? "Tu trial gratuito terminó. Inscribe una tarjeta para reactivar tu cuenta."
                : "Tu suscripción no tiene un cobro válido. Inscribe una tarjeta para no perder acceso."}
            </div>
          ) : status.trial_active ? (
            <div className="mb-3 rounded-xl border p-3 text-sm" style={{ borderColor: tone.border, background: tone.bg, color: tone.text }}>
              Te quedan {status.dias_restantes_trial} día{status.dias_restantes_trial === 1 ? "" : "s"} de trial gratis. Inscribe una tarjeta cuando quieras para no perder acceso al terminar.
            </div>
          ) : status.awaiting_payment ? (
            <div className="mb-3 rounded-xl border p-3 text-sm" style={{ borderColor: tone.border, background: tone.bg, color: tone.text }}>
              Faltan {status.dias_restantes_pago} día{status.dias_restantes_pago === 1 ? "" : "s"} para que tu cuenta se limite por falta de un método de pago activo.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <UsagePill
              icon={MessageCircle}
              label="WA confirmación"
              usage={status.wa_confirmacion}
              textMuted={textMuted}
              textMain={textMain}
              borderColor={borderColor}
              bg={softBg}
            />
            <UsagePill
              icon={Sparkles}
              label="IA WhatsApp"
              usage={status.ia_wa}
              textMuted={textMuted}
              textMain={textMain}
              borderColor={borderColor}
              bg={softBg}
            />
          </div>

          <Link
            href={`/dashboard/${slug}/billing`}
            onClick={() => setOpen(false)}
            className="mt-3 block w-full rounded-xl border px-3 py-2 text-center text-sm font-semibold transition"
            style={{ borderColor, color: textMain, background: softBg }}
          >
            Ir a Suscripción / Add-ons
          </Link>
        </div>
      ) : null}
    </div>
  );
}
