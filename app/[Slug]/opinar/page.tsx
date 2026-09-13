"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Step = "loading" | "identify" | "form" | "success";

function ReviewIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
      <rect x="32" y="58" width="118" height="88" rx="22" fill="#3352e6" />
      <path d="M54 146 L76 146 L54 172 Z" fill="#3352e6" />
      <rect x="56" y="82" width="72" height="9" rx="4.5" fill="#c7d2fe" />
      <rect x="56" y="101" width="72" height="9" rx="4.5" fill="#c7d2fe" />
      <rect x="56" y="120" width="46" height="9" rx="4.5" fill="#c7d2fe" />
      <g transform="translate(118,28)">
        <path
          d="M22 0l6 12.9 14.2 1.4-10.6 9.7 3 13.9L22 30.7 9.4 37.9l3-13.9L1.8 14.3 16 12.9z"
          fill="#fbbf24"
        />
      </g>
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3.4 20.6a1 1 0 001.36.99l17-8a1 1 0 000-1.8l-17-8a1 1 0 00-1.36 1.34L6.5 12l-3.1 7.47a1 1 0 000 1.13z" />
    </svg>
  );
}

export default function OpinarPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean)?.[0] || "";

  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState<Step>("loading");

  // Link personalizado (?t=<token>, ver "Pedir reseña" en Clientes/Agenda):
  // si es válido, se salta la verificación manual. Si no hay token o no es
  // válido, cae al flujo manual existente (identify) sin cambios.
  const [token, setToken] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public-services/${slug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setBusinessName(data?.business?.name || ""))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const urlToken = new URLSearchParams(window.location.search).get("t");

    if (!urlToken) {
      setStep("identify");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/public-reviews/${slug}/verify-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: urlToken }),
        });
        const data = await res.json();

        if (!res.ok || !data.eligible) {
          setStep("identify");
          return;
        }

        setToken(urlToken);
        setCustomerName(data.customer_name || "");
        setStep("form");
      } catch {
        setStep("identify");
      }
    }

    verifyToken();
  }, [slug]);

  async function handleCheckEligibility(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;

    setChecking(true);
    setCheckError("");

    try {
      const res = await fetch(`/api/public-reviews/${slug}/check-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.eligible) {
        setCheckError(
          data.message ||
            data.error ||
            "No encontramos una visita completada asociada a este contacto."
        );
        return;
      }

      setCustomerName(data.customer_name || "");
      setStep("form");
    } catch {
      setCheckError("No pudimos verificar tu contacto. Intenta de nuevo.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/public-reviews/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          identifier: token ? undefined : identifier.trim(),
          rating,
          comment: comment.trim() || undefined,
          private_feedback:
            rating <= 3 ? privateFeedback.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "No pudimos guardar tu reseña. Intenta de nuevo.");
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("No pudimos guardar tu reseña. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const showPrivateFeedback = rating > 0 && rating <= 3;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  const primaryButtonClass =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6 sm:py-10">
      <div className="w-full max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] sm:grid sm:grid-cols-[260px_1fr]">
          {/* Panel izquierdo — decorativo, oculto en mobile para priorizar el
              formulario (la mayoría entra desde el link de WhatsApp en el celular). */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-8 sm:flex">
            <div>
              <h2 className="text-3xl font-bold leading-[1.15] text-white">
                Ayúdanos
                <br />
                <span className="text-sky-400">a ser mejores</span>
              </h2>
              <div className="mt-3 h-1 w-10 rounded-full bg-sky-400" />
            </div>

            <ReviewIllustration className="mx-auto h-40 w-40" />
          </div>

          {/* Panel derecho — formulario */}
          <div className="p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Tu opinión importa
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-slate-950 sm:text-[28px]">
              ¿Cómo fue tu experiencia
              {businessName ? (
                <>
                  {" "}
                  en <span className="text-blue-600">{businessName}</span>
                </>
              ) : null}
              ?
            </h1>

            {step === "loading" ? (
              <p className="mt-6 text-sm text-slate-500">Cargando...</p>
            ) : null}

            {step === "identify" ? (
              <form onSubmit={handleCheckEligibility} className="mt-6 space-y-4">
                <p className="text-sm text-slate-600">
                  Ingresa el teléfono o correo que usaste al reservar, para verificar tu
                  visita.
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Teléfono o correo
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+56 9 1234 5678 o tu@correo.com"
                    className={inputClass}
                    required
                  />
                </div>

                {checkError ? <p className="text-sm text-rose-600">{checkError}</p> : null}

                <button type="submit" disabled={checking} className={primaryButtonClass}>
                  <SendIcon className="h-4 w-4" />
                  {checking ? "Verificando..." : "Continuar"}
                </button>
              </form>
            ) : null}

            {step === "form" ? (
              <form onSubmit={handleSubmitReview} className="mt-6 space-y-5">
                {customerName ? (
                  <p className="text-sm text-slate-600">
                    Hola {customerName}, gracias por tu visita.
                  </p>
                ) : null}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-500">
                    ¿Cómo calificarías tu experiencia?
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} estrellas`}
                        className="rounded-lg border border-slate-100 p-2 transition hover:border-amber-200 hover:bg-amber-50"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-7 w-7"
                          fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                          stroke="#f59e0b"
                        >
                          <path
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                            d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.2 6.1-.6z"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.75 1.44 5.2 3.7 6.83-.13.98-.5 2.28-1.42 3.6a.5.5 0 00.53.77c2.2-.5 3.86-1.5 4.9-2.28.72.14 1.47.21 2.29.21 5.52 0 10-3.94 10-8.8S17.52 2 12 2z" />
                    </svg>
                    Comentario público (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 300))}
                    rows={3}
                    maxLength={300}
                    placeholder="Cuéntale a otros clientes cómo fue tu experiencia"
                    className={`${inputClass} resize-none`}
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {comment.length}/300
                  </p>
                </div>

                {showPrivateFeedback ? (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V6zm3 8a2 2 0 110 4 2 2 0 010-4z" />
                      </svg>
                      Gracias por tu opinión. ¿En qué podemos mejorar? (opcional, privado)
                    </label>
                    <textarea
                      value={privateFeedback}
                      onChange={(e) => setPrivateFeedback(e.target.value.slice(0, 500))}
                      rows={3}
                      maxLength={500}
                      placeholder="Este comentario solo lo verá el negocio"
                      className={`${inputClass} resize-none`}
                    />
                    <p className="mt-1 text-right text-[11px] text-slate-400">
                      {privateFeedback.length}/500
                    </p>
                  </div>
                ) : null}

                {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

                <button
                  type="submit"
                  disabled={submitting || rating < 1}
                  className={primaryButtonClass}
                >
                  <SendIcon className="h-4 w-4" />
                  {submitting ? "Enviando..." : "Enviar reseña"}
                </button>
              </form>
            ) : null}

            {step === "success" ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-emerald-800">
                  ¡Gracias por tu reseña!
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Tu opinión ya quedó publicada.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Powered by{" "}
          <a
            href="https://orbyx.cl"
            className="font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Orbyx
          </a>
        </p>
      </div>
    </main>
  );
}
