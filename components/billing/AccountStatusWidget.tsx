"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Landmark, MessageCircle, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { createClient } from "../../lib/supabase/client";

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
  wa_confirmation_enabled: boolean;
  wa_reminder_enabled: boolean;
  wa_reminder_hours_before: number;
  deposit_required: boolean;
  deposit_bank_name: string;
  deposit_account_type: string;
  deposit_account_number: string;
  deposit_holder_rut: string;
  deposit_holder_name: string;
};

const DEPOSIT_ACCOUNT_TYPES = ["Cuenta Corriente", "Cuenta Vista", "Cuenta de Ahorro"];

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

// Umbrales de alerta de cupo: <80% normal, 80%-99% advertencia, 100%+ agotado.
function getUsageAlertState(usage: UsageCounter): "ok" | "warning" | "critical" {
  if (usage.total <= 0) return "ok"; // sin cupo incluido en el plan, no aplica alerta
  if (usage.used >= usage.total) return "critical";
  if (usage.used / usage.total >= 0.8) return "warning";
  return "ok";
}

function UsagePill({
  icon: Icon,
  label,
  usage,
  textMuted,
  textMain,
  borderColor,
  bg,
  pulse,
}: {
  icon: typeof MessageCircle;
  label: string;
  usage: UsageCounter;
  textMuted: string;
  textMain: string;
  borderColor: string;
  bg: string;
  pulse?: boolean;
}) {
  const isUnlimitedOrOff = usage.total <= 0;
  const alertState = getUsageAlertState(usage);

  const alertColors: Record<"ok" | "warning" | "critical", { border: string; bg: string; text: string }> = {
    ok: { border: borderColor, bg, text: textMain },
    warning: { border: "rgba(245,158,11,0.5)", bg: "rgba(245,158,11,0.12)", text: "rgb(217,119,6)" },
    critical: { border: "rgba(244,63,94,0.5)", bg: "rgba(244,63,94,0.12)", text: "rgb(225,29,72)" },
  };
  const colors = alertColors[alertState];

  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-shadow duration-500"
      style={{
        borderColor: colors.border,
        background: colors.bg,
        boxShadow: pulse ? "0 0 0 3px rgba(37,99,235,0.4)" : "0 0 0 0px transparent",
      }}
    >
      <Icon size={15} style={{ color: alertState === "ok" ? textMuted : colors.text }} />
      <div className="min-w-0">
        <p className="text-[11px]" style={{ color: textMuted }}>
          {label}
        </p>
        <p className="text-sm font-semibold" style={{ color: colors.text }}>
          {isUnlimitedOrOff ? "No incluido" : `${usage.used} / ${usage.total}`}
        </p>
        {alertState === "warning" ? (
          <p className="text-[10px] font-medium" style={{ color: colors.text }}>
            Cerca del límite
          </p>
        ) : alertState === "critical" ? (
          <p className="text-[10px] font-medium" style={{ color: colors.text }}>
            Cupo agotado este mes
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MiniToggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: checked ? "rgb(37 99 235)" : "var(--border-color)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition"
        style={{ transform: checked ? "translateX(22px)" : "translateX(4px)" }}
      />
    </button>
  );
}

export function AccountStatusWidget({
  tenantId,
  slug,
  isNocturno,
  isOwnerOrAdmin,
}: {
  tenantId: string;
  slug: string;
  isNocturno: boolean;
  isOwnerOrAdmin: boolean;
}) {
  const { status } = useAccountStatus(tenantId);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // En mobile el trigger puede caer en cualquier x del header (wrap variable),
  // así que anclar el panel a right-0 del propio botón lo empuja fuera de
  // pantalla por la izquierda. Por eso en mobile el panel es `fixed` con
  // left/right fijos al viewport (nunca se corta) y el top se mide en vivo
  // contra el botón real; en desktop se mantiene el comportamiento original
  // (absolute, anclado al botón).
  const [mobileTop, setMobileTop] = useState<number | null>(null);

  const [activeAccountTab, setActiveAccountTab] = useState<"cuenta" | "notificaciones" | "deposito">(
    "notificaciones"
  );

  const [waConfirmEnabled, setWaConfirmEnabled] = useState(false);
  const [waReminderEnabled, setWaReminderEnabled] = useState(false);
  const [waReminderHours, setWaReminderHours] = useState(1);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [notifError, setNotifError] = useState("");
  const [synced, setSynced] = useState(false);

  const [depositRequired, setDepositRequired] = useState(false);
  const [depositBankName, setDepositBankName] = useState("");
  const [depositAccountType, setDepositAccountType] = useState("");
  const [depositAccountNumber, setDepositAccountNumber] = useState("");
  const [depositHolderRut, setDepositHolderRut] = useState("");
  const [depositHolderName, setDepositHolderName] = useState("");
  const [savingDepositField, setSavingDepositField] = useState<string | null>(null);
  const [depositError, setDepositError] = useState("");

  const [depositServices, setDepositServices] = useState<
    { id: string; name: string; requires_deposit: boolean }[]
  >([]);
  const [depositServicesLoading, setDepositServicesLoading] = useState(false);
  const [depositServicesLoaded, setDepositServicesLoaded] = useState(false);
  const [depositServicesError, setDepositServicesError] = useState("");
  const [savingDepositServiceId, setSavingDepositServiceId] = useState<string | null>(null);

  // Valores "en vivo" recibidos por Realtime — sobreescriben el `used` que
  // vino del fetch inicial (status.wa_confirmacion.used / status.ia_wa.used)
  // sin tener que tocar useAccountStatus. pulseField dispara el destello
  // visual breve en la pill correspondiente.
  const [liveUsage, setLiveUsage] = useState<Partial<Record<"wa_confirmacion" | "ia_wa", number>>>({});
  const [pulseField, setPulseField] = useState<"wa_confirmacion" | "ia_wa" | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    if (typeof window === "undefined" || window.innerWidth >= 640) {
      setMobileTop(null);
      return;
    }
    if (triggerRef.current) {
      setMobileTop(triggerRef.current.getBoundingClientRect().bottom + 8);
    }
  }, [open]);

  useEffect(() => {
    if (!status || synced) return;
    setWaConfirmEnabled(status.wa_confirmation_enabled);
    setWaReminderEnabled(status.wa_reminder_enabled);
    setWaReminderHours(status.wa_reminder_hours_before);
    setDepositRequired(status.deposit_required);
    setDepositBankName(status.deposit_bank_name);
    setDepositAccountType(status.deposit_account_type);
    setDepositAccountNumber(status.deposit_account_number);
    setDepositHolderRut(status.deposit_holder_rut);
    setDepositHolderName(status.deposit_holder_name);
    setSynced(true);
  }, [status, synced]);

  // Realtime: solo mientras el dropdown está abierto (se desuscribe al
  // cerrar, para no dejar conexiones abiertas de más). Filtra por
  // tenant_id server-side (Postgres RLS en tenant_monthly_usage, no solo
  // el filtro del cliente — ver migración 2026-08-02-tenant-monthly-usage-rls.sql).
  useEffect(() => {
    if (!open || !tenantId) return;

    const supabase = createClient();
    const currentPeriod = new Date().toISOString().slice(0, 7);

    function applyChange(row: Record<string, unknown> | null) {
      if (!row) return;
      const resource = row.resource;
      if (resource !== "wa_confirmacion" && resource !== "ia_wa") return;
      if (row.period !== currentPeriod) return;

      setLiveUsage((prev) => ({ ...prev, [resource]: Number(row.used) || 0 }));
      setPulseField(resource);
      setTimeout(() => {
        setPulseField((current) => (current === resource ? null : current));
      }, 900);
    }

    const channel = supabase
      .channel(`tenant-monthly-usage-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenant_monthly_usage",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => applyChange((payload.new as Record<string, unknown>) || null)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, tenantId]);

  // Lista de servicios para el checklist "requiere depósito" — solo se carga
  // una vez que el tab de depósito está abierto y el interruptor maestro
  // está activo (no tiene sentido antes). Se limita a la sucursal activa
  // del dashboard (misma convención que el resto del panel:
  // orbyx_active_branch_${slug}), ya que los servicios son por sucursal.
  useEffect(() => {
    if (!open || activeAccountTab !== "deposito" || !depositRequired || depositServicesLoaded) {
      return;
    }

    async function loadDepositServices() {
      setDepositServicesLoading(true);
      setDepositServicesError("");
      try {
        const activeBranchId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(`orbyx_active_branch_${slug}`) || ""
            : "";

        const params = new URLSearchParams({ tenant_id: tenantId, active: "true" });
        if (activeBranchId) params.set("branch_id", activeBranchId);

        const res = await apiFetch(`${BACKEND_URL}/services?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "No se pudo cargar");

        setDepositServices(
          (data.services || []).map((s: { id: string; name: string; requires_deposit?: boolean }) => ({
            id: s.id,
            name: s.name,
            requires_deposit: Boolean(s.requires_deposit),
          }))
        );
        setDepositServicesLoaded(true);
      } catch {
        setDepositServicesError("No se pudieron cargar los servicios.");
      } finally {
        setDepositServicesLoading(false);
      }
    }

    loadDepositServices();
  }, [open, activeAccountTab, depositRequired, depositServicesLoaded, tenantId, slug]);

  async function toggleServiceRequiresDeposit(service: {
    id: string;
    name: string;
    requires_deposit: boolean;
  }) {
    const next = !service.requires_deposit;
    setDepositServicesError("");
    setDepositServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, requires_deposit: next } : s))
    );
    setSavingDepositServiceId(service.id);
    try {
      const res = await apiFetch(`${BACKEND_URL}/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, requires_deposit: next }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
    } catch {
      setDepositServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, requires_deposit: !next } : s))
      );
      setDepositServicesError("No se pudo guardar el cambio de un servicio. Intenta de nuevo.");
    } finally {
      setSavingDepositServiceId(null);
    }
  }

  async function saveWhatsAppSetting(
    field: "wa_confirmation_enabled" | "wa_reminder_enabled" | "wa_reminder_hours_before",
    value: boolean | number
  ) {
    setNotifError("");
    setSavingField(field);
    try {
      const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/whatsapp-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
    } catch {
      setNotifError("No se pudo guardar el cambio. Intenta de nuevo.");
      // revierte el valor local al estado que ya sabíamos que estaba guardado
      if (field === "wa_confirmation_enabled") setWaConfirmEnabled(!value);
      if (field === "wa_reminder_enabled") setWaReminderEnabled(!value);
      if (field === "wa_reminder_hours_before" && status) setWaReminderHours(status.wa_reminder_hours_before);
    } finally {
      setSavingField(null);
    }
  }

  const depositFieldsComplete = Boolean(
    depositBankName.trim() &&
      depositAccountType.trim() &&
      depositAccountNumber.trim() &&
      depositHolderRut.trim() &&
      depositHolderName.trim()
  );

  async function saveDepositSetting(
    field:
      | "deposit_required"
      | "deposit_bank_name"
      | "deposit_account_type"
      | "deposit_account_number"
      | "deposit_holder_rut"
      | "deposit_holder_name",
    value: boolean | string,
    revert: () => void
  ) {
    setDepositError("");
    setSavingDepositField(field);
    try {
      const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/deposit-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
    } catch {
      setDepositError("No se pudo guardar el cambio. Intenta de nuevo.");
      revert();
    } finally {
      setSavingDepositField(null);
    }
  }

  if (!status) return null;

  const liveWaConfirmacion: UsageCounter = {
    ...status.wa_confirmacion,
    used: liveUsage.wa_confirmacion ?? status.wa_confirmacion.used,
    remaining: Math.max(0, status.wa_confirmacion.total - (liveUsage.wa_confirmacion ?? status.wa_confirmacion.used)),
  };
  const liveIaWa: UsageCounter = {
    ...status.ia_wa,
    used: liveUsage.ia_wa ?? status.ia_wa.used,
    remaining: Math.max(0, status.ia_wa.total - (liveUsage.ia_wa ?? status.ia_wa.used)),
  };

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
        ref={triggerRef}
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
          className="fixed left-4 right-4 top-24 z-50 max-h-[80vh] overflow-y-auto rounded-2xl border p-4 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-80"
          style={{
            top: mobileTop !== null ? `${mobileTop}px` : undefined,
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

          {isOwnerOrAdmin ? (
            <div className="mb-3 flex gap-1 rounded-xl border p-1" style={{ borderColor, background: softBg }}>
              {(
                [
                  { key: "cuenta", label: "Cuenta", icon: Clock, color: "rgb(37,99,235)" },
                  { key: "notificaciones", label: "Notificaciones", icon: MessageCircle, color: "rgb(16,185,129)" },
                  { key: "deposito", label: "Depósito previo", icon: Landmark, color: "rgb(99,102,241)" },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const isActive = activeAccountTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveAccountTab(t.key)}
                    className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center transition"
                    style={{
                      background: isActive ? t.color : "transparent",
                      color: isActive ? "#fff" : textMuted,
                    }}
                  >
                    <Icon size={14} />
                    <span className="text-[10px] font-semibold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {!isOwnerOrAdmin || activeAccountTab === "cuenta" ? (
            <div className="grid grid-cols-2 gap-2">
              <UsagePill
                icon={MessageCircle}
                label="WA confirmación"
                usage={liveWaConfirmacion}
                textMuted={textMuted}
                textMain={textMain}
                borderColor={borderColor}
                bg={softBg}
                pulse={pulseField === "wa_confirmacion"}
              />
              <UsagePill
                icon={Sparkles}
                label="IA WhatsApp"
                usage={liveIaWa}
                textMuted={textMuted}
                textMain={textMain}
                borderColor={borderColor}
                bg={softBg}
                pulse={pulseField === "ia_wa"}
              />
            </div>
          ) : null}

          {isOwnerOrAdmin && activeAccountTab === "notificaciones" ? (
            <div>
              <div className="overflow-hidden rounded-xl" style={{ background: softBg }}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: textMain }}>
                      Confirmación al agendar
                    </p>
                    <p className="text-[11px]" style={{ color: textMuted }}>
                      Envía un WhatsApp apenas se crea la cita
                    </p>
                  </div>
                  <MiniToggle
                    checked={waConfirmEnabled}
                    disabled={savingField === "wa_confirmation_enabled"}
                    label="Confirmación por WhatsApp al agendar"
                    onChange={() => {
                      const next = !waConfirmEnabled;
                      setWaConfirmEnabled(next);
                      saveWhatsAppSetting("wa_confirmation_enabled", next);
                    }}
                  />
                </div>

                <div className="h-px" style={{ background: borderColor }} />

                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: textMain }}>
                      Recordatorio antes de la cita
                    </p>
                    <p className="text-[11px]" style={{ color: textMuted }}>
                      Envía un WhatsApp antes de que llegue el cliente
                    </p>
                  </div>
                  <MiniToggle
                    checked={waReminderEnabled}
                    disabled={savingField === "wa_reminder_enabled"}
                    label="Recordatorio por WhatsApp antes de la cita"
                    onChange={() => {
                      const next = !waReminderEnabled;
                      setWaReminderEnabled(next);
                      saveWhatsAppSetting("wa_reminder_enabled", next);
                    }}
                  />
                </div>

                {waReminderEnabled ? (
                  <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pt-0.5">
                    <p className="text-[11px]" style={{ color: textMuted }}>
                      Enviar
                    </p>
                    <div className="flex gap-1.5">
                      {[1, 2].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          disabled={savingField === "wa_reminder_hours_before"}
                          onClick={() => {
                            setWaReminderHours(hours);
                            saveWhatsAppSetting("wa_reminder_hours_before", hours);
                          }}
                          className="rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            borderColor: waReminderHours === hours ? "rgb(37,99,235)" : borderColor,
                            background: waReminderHours === hours ? "rgba(37,99,235,0.14)" : "transparent",
                            color: waReminderHours === hours ? "rgb(37,99,235)" : textMuted,
                          }}
                        >
                          {hours} hora{hours === 1 ? "" : "s"} antes
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {notifError ? (
                <p className="mt-1.5 text-xs" style={{ color: "rgb(244,63,94)" }}>
                  {notifError}
                </p>
              ) : null}

              <p className="mt-2.5 text-[11px]" style={{ color: textMuted }}>
                Uso este mes:{" "}
                <span className="font-semibold" style={{ color: textMain }}>
                  {liveWaConfirmacion.used} / {liveWaConfirmacion.total}
                </span>{" "}
                mensajes
              </p>
            </div>
          ) : null}

          {isOwnerOrAdmin && activeAccountTab === "deposito" ? (
            <div>
              <div className="overflow-hidden rounded-xl" style={{ background: softBg }}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: textMain }}>
                      Depósito requerido para confirmar
                    </p>
                    <p className="text-[11px]" style={{ color: textMuted }}>
                      El cliente sube un comprobante antes de que la hora quede en firme
                    </p>
                  </div>
                  <MiniToggle
                    checked={depositRequired}
                    disabled={savingDepositField === "deposit_required"}
                    label="Depósito requerido para confirmar"
                    onChange={() => {
                      const next = !depositRequired;
                      setDepositRequired(next);
                      saveDepositSetting("deposit_required", next, () => setDepositRequired(!next));
                    }}
                  />
                </div>

                {depositRequired ? (
                  <div className="space-y-2 px-3 pb-3 pt-1">
                    <input
                      type="text"
                      placeholder="Banco"
                      value={depositBankName}
                      disabled={savingDepositField === "deposit_bank_name"}
                      onChange={(e) => setDepositBankName(e.target.value)}
                      onBlur={() =>
                        saveDepositSetting("deposit_bank_name", depositBankName, () =>
                          setDepositBankName(status.deposit_bank_name)
                        )
                      }
                      className="h-8 w-full rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
                      style={{ borderColor, background: dropdownBg, color: textMain }}
                    />
                    <select
                      value={depositAccountType}
                      disabled={savingDepositField === "deposit_account_type"}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDepositAccountType(value);
                        saveDepositSetting("deposit_account_type", value, () =>
                          setDepositAccountType(status.deposit_account_type)
                        );
                      }}
                      className="h-8 w-full rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
                      style={{ borderColor, background: dropdownBg, color: textMain }}
                    >
                      <option value="">Tipo de cuenta</option>
                      {DEPOSIT_ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Número de cuenta"
                      value={depositAccountNumber}
                      disabled={savingDepositField === "deposit_account_number"}
                      onChange={(e) => setDepositAccountNumber(e.target.value)}
                      onBlur={() =>
                        saveDepositSetting("deposit_account_number", depositAccountNumber, () =>
                          setDepositAccountNumber(status.deposit_account_number)
                        )
                      }
                      className="h-8 w-full rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
                      style={{ borderColor, background: dropdownBg, color: textMain }}
                    />
                    <input
                      type="text"
                      placeholder="RUT titular"
                      value={depositHolderRut}
                      disabled={savingDepositField === "deposit_holder_rut"}
                      onChange={(e) => setDepositHolderRut(e.target.value)}
                      onBlur={() =>
                        saveDepositSetting("deposit_holder_rut", depositHolderRut, () =>
                          setDepositHolderRut(status.deposit_holder_rut)
                        )
                      }
                      className="h-8 w-full rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
                      style={{ borderColor, background: dropdownBg, color: textMain }}
                    />
                    <input
                      type="text"
                      placeholder="Nombre titular"
                      value={depositHolderName}
                      disabled={savingDepositField === "deposit_holder_name"}
                      onChange={(e) => setDepositHolderName(e.target.value)}
                      onBlur={() =>
                        saveDepositSetting("deposit_holder_name", depositHolderName, () =>
                          setDepositHolderName(status.deposit_holder_name)
                        )
                      }
                      className="h-8 w-full rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
                      style={{ borderColor, background: dropdownBg, color: textMain }}
                    />
                    {!depositFieldsComplete ? (
                      <p className="text-[10px] font-medium" style={{ color: "rgb(217,119,6)" }}>
                        Completa los 5 datos — los clientes no verán esta sección hasta entonces.
                      </p>
                    ) : null}

                    <div className="mt-2 border-t pt-2" style={{ borderColor }}>
                      <p className="text-[11px] font-semibold" style={{ color: textMain }}>
                        Servicios que requieren depósito
                      </p>
                      <p className="text-[10px]" style={{ color: textMuted }}>
                        Los servicios sin marcar se reservan normal, sin depósito.
                      </p>

                      {depositServicesLoading ? (
                        <p className="mt-1.5 text-[11px]" style={{ color: textMuted }}>
                          Cargando servicios...
                        </p>
                      ) : depositServices.length === 0 ? (
                        <p className="mt-1.5 text-[11px]" style={{ color: textMuted }}>
                          No hay servicios activos en esta sucursal.
                        </p>
                      ) : (
                        <div className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto">
                          {depositServices.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs"
                              style={{
                                color: textMain,
                                opacity: savingDepositServiceId === service.id ? 0.6 : 1,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={service.requires_deposit}
                                disabled={savingDepositServiceId === service.id}
                                onChange={() => toggleServiceRequiresDeposit(service)}
                              />
                              <span className="truncate">{service.name}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {depositServicesError ? (
                        <p className="mt-1 text-[10px]" style={{ color: "rgb(244,63,94)" }}>
                          {depositServicesError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {depositError ? (
                <p className="mt-1.5 text-xs" style={{ color: "rgb(244,63,94)" }}>
                  {depositError}
                </p>
              ) : null}
            </div>
          ) : null}

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
