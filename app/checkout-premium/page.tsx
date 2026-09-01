"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  plans,
  billingCycleConfig,
  cycleTotalPrice,
  applyIva,
  PAID_PLAN_IDS,
  type BillingCycle,
} from "@/lib/plans";
import { TermsAcceptanceCheckbox } from "@/components/auth/TermsAcceptanceCheckbox";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { isValidPhoneForCountry, toE164 } from "@/components/auth/countries";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type Step = "form" | "retrying" | "retry_unavailable" | "retry_error" | "error";

function CheckoutPremiumInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get("status");
  const signupIntentIdParam = searchParams.get("signup_intent_id");
  const planParam = (searchParams.get("plan") || "").toLowerCase();
  const cycleParamRaw = (searchParams.get("cycle") || "mensual").toLowerCase();
  const cycleParam: BillingCycle =
    cycleParamRaw === "semestral" || cycleParamRaw === "anual" ? cycleParamRaw : "mensual";

  const isGenericError = statusParam === "error";
  const isRetry = Boolean(signupIntentIdParam) && statusParam === "retry" && !isGenericError;

  const [step, setStep] = useState<Step>(
    isGenericError ? "error" : isRetry ? "retrying" : "form"
  );

  const plan = plans.find((p) => p.key === planParam);
  const planIsPaid = PAID_PLAN_IDS.includes(planParam);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneIso2, setPhoneIso2] = useState("CL");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const turnstileRef = useRef<any>(null);

  // Caso A: plan invalido o ausente -> vuelve a la vitrina de planes.
  useEffect(() => {
    if (step !== "form") return;
    if (!plan || !planIsPaid) {
      router.replace("/planes");
    }
  }, [step, plan, planIsPaid, router]);

  // Caso B: reintento automatico contra el mismo signup_intent_id.
  useEffect(() => {
    if (step !== "retrying" || !signupIntentIdParam) return;

    let cancelled = false;

    async function retry() {
      try {
        const res = await fetch(`${BACKEND_URL}/signup/register-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signup_intent_id: signupIntentIdParam }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data?.url) {
          window.location.href = data.url + "?token=" + data.token;
          return;
        }

        if (res.status === 400 || res.status === 404) {
          setStep("retry_unavailable");
          return;
        }

        setStep("retry_error");
      } catch {
        if (!cancelled) setStep("retry_error");
      }
    }

    retry();

    return () => {
      cancelled = true;
    };
  }, [step, signupIntentIdParam]);

  async function handleSubmit() {
    if (!plan) return;

    if (!businessName.trim()) {
      setFormError("Ingresa el nombre de tu negocio.");
      return;
    }
    if (!isValidEmail(email)) {
      setFormError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!isValidPhoneForCountry(phoneIso2, phoneNumber)) {
      setFormError("Ingresa un teléfono válido.");
      return;
    }
    if (!acceptedTerms) {
      setFormError("Debes aceptar los Términos de Servicio para continuar.");
      return;
    }
    if (!captchaToken) {
      setFormError("Completa la verificación de seguridad.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      // El backend calcula el monto real (neto + IVA) del lado del
      // servidor a partir de plan_id/periodicidad -- no se manda ni se
      // confía en un monto calculado en el cliente (fix 2026-09-01).
      const startRes = await fetch(`${BACKEND_URL}/signup/start-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          business_name: businessName,
          phone: toE164(phoneIso2, phoneNumber),
          plan_id: plan.key,
          periodicidad: cycleParam,
        }),
      });
      const startData = await startRes.json();

      if (!startRes.ok) {
        throw new Error(startData?.error || "No se pudo iniciar el registro");
      }

      const signupIntentId = startData.signup_intent_id;

      const cardRes = await fetch(`${BACKEND_URL}/signup/register-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signup_intent_id: signupIntentId }),
      });
      const cardData = await cardRes.json();

      if (!cardRes.ok) {
        throw new Error(cardData?.error || "No se pudo iniciar el registro de tarjeta");
      }

      window.location.href = cardData.url + "?token=" + cardData.token;
    } catch (e: any) {
      setFormError(e.message || "Ocurrió un error inesperado");
      turnstileRef.current?.reset();
      setCaptchaToken("");
      setSubmitting(false);
    }
  }

  const cycleLabel = billingCycleConfig[cycleParam].label;
  const cycleBadge = billingCycleConfig[cycleParam].badge;
  // Desglose neto/IVA/total -- debe calzar exactamente con el resumen de
  // /planes (fix 2026-09-01: acá se mostraba antes un solo número (el
  // precio neto del plan) mal etiquetado como "IVA incluido").
  const subtotal = plan ? cycleTotalPrice(plan.price, cycleParam) : 0;
  const total = applyIva(subtotal);
  const iva = total - subtotal;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#070d1a" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Orbyx</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(147,197,253,0.5)" }}>
            Plataforma de reservas
          </p>
        </div>

        {step === "error" && (
          <div
            className="rounded-2xl border border-red-500/20 p-8 text-center"
            style={{ background: "#0f1729" }}
          >
            <p className="text-4xl mb-3">✗</p>
            <h2 className="text-white font-semibold mb-2">Ocurrió un problema procesando tu pago</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(147,197,253,0.6)" }}>
              Escríbenos a soporte@orbyx.cl si el problema persiste.
            </p>
            <a
              href="/planes"
              className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
            >
              Volver a planes
            </a>
          </div>
        )}

        {step === "retrying" && (
          <div
            className="rounded-2xl border border-blue-900/25 p-8 text-center"
            style={{ background: "#0f1729" }}
          >
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>
              Reintentando conexión con el pago...
            </p>
          </div>
        )}

        {step === "retry_unavailable" && (
          <div
            className="rounded-2xl border border-yellow-500/20 p-8 text-center"
            style={{ background: "#0f1729" }}
          >
            <p className="text-4xl mb-3">⚠</p>
            <h2 className="text-white font-semibold mb-2">
              Este proceso de pago ya no está disponible
            </h2>
            <p className="text-sm mb-5" style={{ color: "rgba(147,197,253,0.6)" }}>
              Vuelve a elegir tu plan.
            </p>
            <a
              href="/planes"
              className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
            >
              Volver a planes
            </a>
          </div>
        )}

        {step === "retry_error" && (
          <div
            className="rounded-2xl border border-red-500/20 p-8 text-center"
            style={{ background: "#0f1729" }}
          >
            <p className="text-4xl mb-3">✗</p>
            <h2 className="text-white font-semibold mb-2">No pudimos reconectar con el pago</h2>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.6)" }}>
              Escríbenos a soporte@orbyx.cl para continuar.
            </p>
          </div>
        )}

        {step === "form" && !plan && (
          <div
            className="rounded-2xl border border-blue-900/25 p-8 text-center"
            style={{ background: "#0f1729" }}
          >
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>
              Redirigiendo...
            </p>
          </div>
        )}

        {step === "form" && plan && (
          <div
            className="rounded-2xl border border-blue-900/25 p-6"
            style={{ background: "#0f1729" }}
          >
            <h2 className="text-white font-semibold text-lg mb-1">Confirma tu plan</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(147,197,253,0.5)" }}>
              Ingresa tus datos para continuar al pago con tarjeta.
            </p>

            <div
              className={`rounded-2xl border px-4 py-4 mb-5 ${plan.borderClass} ${plan.softBgClass}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${plan.accentClass}`}>
                  Plan {plan.name}
                </span>
                <span className="text-xs" style={{ color: "rgba(147,197,253,0.6)" }}>
                  {cycleLabel}
                  {cycleBadge ? ` · ${cycleBadge}` : ""}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "rgba(147,197,253,0.6)" }}>Subtotal</span>
                  <span className="text-white">{formatCLP(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "rgba(147,197,253,0.6)" }}>IVA (19%)</span>
                  <span className="text-white">{formatCLP(iva)}</span>
                </div>
                <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "rgba(147,197,253,0.6)" }}>
                    Total {cycleLabel.toLowerCase()}
                  </span>
                  <span className="text-2xl font-bold text-white">{formatCLP(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label
                  className="text-xs mb-1.5 block"
                  style={{ color: "rgba(147,197,253,0.6)" }}
                >
                  Nombre del negocio
                </label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={submitting}
                  placeholder="Mi negocio"
                  className="w-full rounded-xl border px-3 py-2 text-sm text-white outline-none transition-colors"
                  style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                />
              </div>
              <div>
                <label
                  className="text-xs mb-1.5 block"
                  style={{ color: "rgba(147,197,253,0.6)" }}
                >
                  Correo electrónico
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  type="email"
                  placeholder="correo@empresa.com"
                  className="w-full rounded-xl border px-3 py-2 text-sm text-white outline-none transition-colors"
                  style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                />
              </div>
              <div>
                <label
                  className="text-xs mb-1.5 block"
                  style={{ color: "rgba(147,197,253,0.6)" }}
                >
                  Teléfono
                </label>
                <PhoneCountryInput
                  iso2={phoneIso2}
                  onIso2Change={setPhoneIso2}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <TermsAcceptanceCheckbox
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-center mb-5">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(t) => setCaptchaToken(t)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                options={{ theme: "dark" }}
              />
            </div>

            {formError && <p className="text-xs text-red-400 mb-3">{formError}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !businessName || !email || !captchaToken || !acceptedTerms}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              {submitting ? "Procesando..." : "Continuar al pago"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPremiumPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: "#f1f5f9" }}>Cargando...</div>}>
      <CheckoutPremiumInner />
    </Suspense>
  );
}
