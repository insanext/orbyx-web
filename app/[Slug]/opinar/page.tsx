"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Step = "identify" | "form" | "success";

export default function OpinarPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean)?.[0] || "";

  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState<Step>("identify");

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
          identifier: identifier.trim(),
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {businessName || slug}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">
          Cuéntanos tu experiencia
        </h1>

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
                className="h-11 w-full rounded-none border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
                required
              />
            </div>

            {checkError ? <p className="text-sm text-rose-600">{checkError}</p> : null}

            <button
              type="submit"
              disabled={checking}
              className="h-11 w-full rounded-none bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
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
                    className="p-1"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-8 w-8"
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                Comentario público (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
                placeholder="Cuéntale a otros clientes cómo fue tu experiencia"
                className="w-full rounded-none border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">
                {comment.length}/300
              </p>
            </div>

            {showPrivateFeedback ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Gracias por tu opinión. ¿En qué podemos mejorar? (opcional, privado)
                </label>
                <textarea
                  value={privateFeedback}
                  onChange={(e) => setPrivateFeedback(e.target.value.slice(0, 500))}
                  rows={3}
                  maxLength={500}
                  placeholder="Este comentario solo lo verá el negocio"
                  className="w-full rounded-none border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
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
              className="h-11 w-full rounded-none bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Enviar reseña"}
            </button>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="text-sm font-semibold text-emerald-800">
              ¡Gracias por tu reseña!
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Tu opinión ya quedó publicada.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
