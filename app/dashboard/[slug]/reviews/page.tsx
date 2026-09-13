"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Star, EyeOff, Eye, MessageCircle } from "lucide-react";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { usePermissions } from "../../../../lib/permissions-context";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// Mismo set fijo que ALLOWED_REVIEW_REACTIONS en server.js.
const REACTIONS = ["👍", "❤️", "🙏", "😊"];

type ReviewStatus = "visible" | "hidden";

type ReviewReply = {
  id: string;
  message: string;
  created_at: string;
};

type Review = {
  id: string;
  client_name: string | null;
  client_identifier: string;
  rating: number;
  comment: string | null;
  private_feedback: string | null;
  status: ReviewStatus;
  reaction: string | null;
  replies: ReviewReply[];
  created_at: string;
  updated_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="h-3.5 w-3.5"
          fill={star <= rating ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { canEdit } = usePermissions();
  const canEditClientes = canEdit("clientes");
  const params = useParams();
  const slug = (params as { slug?: string })?.slug || "";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [reactingId, setReactingId] = useState("");
  const [openReplyFor, setOpenReplyFor] = useState<Record<string, boolean>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [sendingReplyFor, setSendingReplyFor] = useState("");

  async function loadReviews() {
    if (!slug) return;
    try {
      setLoading(true);
      setError("");
      const res = await apiFetch(`${BACKEND_URL}/reviews/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar las reseñas");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las reseñas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const visibleReviews = useMemo(
    () => reviews.filter((r) => r.status === "visible"),
    [reviews]
  );

  const average = useMemo(() => {
    if (visibleReviews.length === 0) return 0;
    return (
      visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
    );
  }, [visibleReviews]);

  async function toggleStatus(review: Review) {
    const nextStatus: ReviewStatus = review.status === "visible" ? "hidden" : "visible";
    setUpdatingId(review.id);
    try {
      const res = await apiFetch(`${BACKEND_URL}/reviews/${review.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar la reseña");

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: nextStatus } : r))
      );
    } catch (err: any) {
      alert(err?.message || "No se pudo actualizar la reseña");
    } finally {
      setUpdatingId("");
    }
  }

  async function handleReaction(review: Review, emoji: string) {
    const nextReaction = review.reaction === emoji ? null : emoji;
    setReactingId(review.id);
    try {
      const res = await apiFetch(`${BACKEND_URL}/reviews/${slug}/${review.id}/reaction`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: nextReaction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar la reacción");

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, reaction: nextReaction } : r))
      );
    } catch (err: any) {
      alert(err?.message || "No se pudo actualizar la reacción");
    } finally {
      setReactingId("");
    }
  }

  async function handleSendReply(review: Review) {
    const message = (replyDraft[review.id] || "").trim();
    if (!message) return;

    setSendingReplyFor(review.id);
    try {
      const res = await apiFetch(`${BACKEND_URL}/reviews/${slug}/${review.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar la respuesta");

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, replies: [...r.replies, data.reply] } : r
        )
      );
      setReplyDraft((prev) => ({ ...prev, [review.id]: "" }));
    } catch (err: any) {
      alert(err?.message || "No se pudo enviar la respuesta");
    } finally {
      setSendingReplyFor("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reputación"
        title="Reseñas"
        icon={<Star className="h-4 w-4" />}
        description="Reseñas de clientes verificados (con al menos una visita completada). Se publican de inmediato — puedes ocultar una puntual por abuso o spam, reaccionar y responder públicamente."
      />

      <Panel
        title="Resumen"
        description={
          visibleReviews.length > 0
            ? `${average.toFixed(1)} de 5 · ${visibleReviews.length} ${visibleReviews.length === 1 ? "reseña visible" : "reseñas visibles"}`
            : "Todavía no tienes reseñas visibles."
        }
      >
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cargando reseñas...
          </p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cuando un cliente con una visita completada deje una reseña, aparecerá acá.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: review.status === "hidden" ? "var(--bg-soft)" : "transparent",
                  opacity: review.status === "hidden" ? 0.7 : 1,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                        {review.client_name || "Cliente"}
                      </p>
                      <StarRow rating={review.rating} />
                      {review.status === "hidden" ? (
                        <span className="inline-flex items-center rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          Oculta
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {review.client_identifier} · {formatDate(review.created_at)}
                    </p>

                    {review.comment ? (
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-main)" }}>
                        {review.comment}
                      </p>
                    ) : null}

                    {review.private_feedback ? (
                      <div
                        className="mt-2 rounded-xl border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          Feedback privado
                        </p>
                        <p className="mt-0.5" style={{ color: "var(--text-main)" }}>
                          {review.private_feedback}
                        </p>
                      </div>
                    ) : null}

                    {review.replies.length > 0 ? (
                      <div
                        className="mt-3 space-y-2 border-l-2 pl-3"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        {review.replies.map((reply) => (
                          <div key={reply.id}>
                            <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                              Respuesta del negocio · {formatDate(reply.created_at)}
                            </p>
                            <p className="text-sm leading-6" style={{ color: "var(--text-main)" }}>
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {canEditClientes ? (
                      <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              disabled={reactingId === review.id}
                              onClick={() => handleReaction(review, emoji)}
                              aria-label={`Reaccionar con ${emoji}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border text-base transition disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                borderColor:
                                  review.reaction === emoji ? "var(--accent-solid)" : "var(--border-color)",
                                background:
                                  review.reaction === emoji ? "rgba(37,99,235,0.12)" : "transparent",
                              }}
                            >
                              {emoji}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              setOpenReplyFor((prev) => ({ ...prev, [review.id]: !prev[review.id] }))
                            }
                            className="ml-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                            style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Responder
                          </button>
                        </div>

                        {openReplyFor[review.id] ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={replyDraft[review.id] || ""}
                              onChange={(e) =>
                                setReplyDraft((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value.slice(0, 500),
                                }))
                              }
                              rows={2}
                              maxLength={500}
                              placeholder="Escribe una respuesta pública..."
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                {(replyDraft[review.id] || "").length}/500
                              </p>
                              <button
                                type="button"
                                disabled={
                                  sendingReplyFor === review.id ||
                                  !(replyDraft[review.id] || "").trim()
                                }
                                onClick={() => handleSendReply(review)}
                                className="inline-flex h-9 items-center rounded-xl px-4 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ background: "var(--accent-solid)" }}
                              >
                                {sendingReplyFor === review.id ? "Enviando..." : "Enviar respuesta"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {canEditClientes ? (
                    <button
                      type="button"
                      disabled={updatingId === review.id}
                      onClick={() => toggleStatus(review)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}
                    >
                      {review.status === "visible" ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Mostrar
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
