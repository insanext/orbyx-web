"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Star, EyeOff, Eye, MessageCircle, Trash2, ChevronDown } from "lucide-react";
import { usePermissions } from "../../../../lib/permissions-context";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// Mismo set fijo que ALLOWED_REVIEW_REACTIONS en server.js.
const REACTIONS = ["👍", "❤️", "🙏", "😊"];

// Mismo set fijo que ALLOWED_HIDDEN_REASONS en server.js.
const HIDDEN_REASONS = ["Spam", "Insultos", "Contenido inapropiado"];

type ReviewStatus = "visible" | "hidden";
type StatusFilter = "all" | "visible" | "hidden";
type SortOrder = "recent" | "rating_desc" | "rating_asc";

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
  hidden_reason: string | null;
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [updatingId, setUpdatingId] = useState("");
  const [hidingReasonFor, setHidingReasonFor] = useState("");
  const [reactingId, setReactingId] = useState("");
  const [openReplyFor, setOpenReplyFor] = useState<Record<string, boolean>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [sendingReplyFor, setSendingReplyFor] = useState("");
  const [deletingReplyId, setDeletingReplyId] = useState("");

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
  const hiddenReviews = useMemo(
    () => reviews.filter((r) => r.status === "hidden"),
    [reviews]
  );

  const average = useMemo(() => {
    if (visibleReviews.length === 0) return 0;
    return (
      visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
    );
  }, [visibleReviews]);

  const displayedReviews = useMemo(() => {
    const base =
      statusFilter === "all"
        ? reviews
        : statusFilter === "visible"
        ? visibleReviews
        : hiddenReviews;

    const sorted = [...base];
    if (sortOrder === "rating_desc") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === "rating_asc") {
      sorted.sort((a, b) => a.rating - b.rating);
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return sorted;
  }, [reviews, visibleReviews, hiddenReviews, statusFilter, sortOrder]);

  async function handleSetStatus(review: Review, nextStatus: ReviewStatus, reason?: string) {
    setUpdatingId(review.id);
    try {
      const res = await apiFetch(`${BACKEND_URL}/reviews/${review.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          hidden_reason: nextStatus === "hidden" ? reason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar la reseña");

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? {
                ...r,
                status: nextStatus,
                hidden_reason: nextStatus === "hidden" ? reason || null : null,
              }
            : r
        )
      );
      setHidingReasonFor("");
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

  async function handleDeleteReply(review: Review, reply: ReviewReply) {
    if (!confirm("¿Borrar esta respuesta? No se puede deshacer.")) return;

    setDeletingReplyId(reply.id);
    try {
      const res = await apiFetch(
        `${BACKEND_URL}/reviews/${slug}/${review.id}/replies/${reply.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo borrar la respuesta");

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? { ...r, replies: r.replies.filter((rep) => rep.id !== reply.id) }
            : r
        )
      );
    } catch (err: any) {
      alert(err?.message || "No se pudo borrar la respuesta");
    } finally {
      setDeletingReplyId("");
    }
  }

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: reviews.length },
    { key: "visible", label: "Visibles", count: visibleReviews.length },
    { key: "hidden", label: "Ocultas", count: hiddenReviews.length },
  ];

  return (
    <div className="orbyx-reviews-page space-y-4">
      <div
        className="relative overflow-hidden rounded border px-4 py-2.5 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.5),0_0_34px_-24px_rgba(59,130,246,0.42)]"
        style={{
          borderColor: "var(--reviews-hero-border)",
          background: "var(--reviews-hero-bg)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(37,99,235,0.42), rgba(59,130,246,0.35), transparent)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border shadow-[0_18px_32px_-16px_rgba(37,99,235,0.85)]"
            style={{
              borderColor: "rgba(147,197,253,0.72)",
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            }}
          >
            <Star className="h-4 w-4 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--reviews-hero-title)" }}>
              Reseñas
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--reviews-hero-muted)" }}>
              Conoce lo que opinan tus clientes. Las reseñas se publican de inmediato.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div
          className="grid flex-1 grid-cols-1 gap-3 rounded border p-4 sm:grid-cols-3"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
        >
          <div
            className="flex items-center gap-3 sm:border-r sm:pr-3"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Star className="h-5 w-5 shrink-0 text-amber-500" fill="currentColor" />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "var(--text-main)" }}>
                {average.toFixed(1)}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Calificación promedio
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 sm:border-r sm:px-3"
            style={{ borderColor: "var(--border-color)" }}
          >
            <MessageCircle className="h-5 w-5 shrink-0" style={{ color: "var(--accent-solid)" }} />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "var(--text-main)" }}>
                {visibleReviews.length}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Reseñas visibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:pl-3">
            <Eye className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "var(--text-main)" }}>
                {reviews.length}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Total de reseñas
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 rounded border p-3"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className="rounded px-3 py-2 text-sm font-semibold transition"
                style={
                  statusFilter === tab.key
                    ? { background: "var(--accent-solid)", color: "#ffffff" }
                    : { background: "var(--bg-soft)", color: "var(--text-main)" }
                }
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-10 appearance-none rounded border py-2 pl-3 pr-8 text-sm font-medium outline-none"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-main)",
              }}
            >
              <option value="recent">Más recientes</option>
              <option value="rating_desc">Mejor calificación primero</option>
              <option value="rating_asc">Peor calificación primero</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </div>
      </div>

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
      ) : displayedReviews.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No hay reseñas en este filtro.
        </p>
      ) : (
        <div className="space-y-3">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="rounded border p-4"
              style={{
                borderColor: "var(--border-color)",
                background: review.status === "hidden" ? "var(--bg-soft)" : "var(--bg-card)",
                opacity: review.status === "hidden" ? 0.85 : 1,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                      {review.client_name || "Cliente"}
                    </p>
                    <StarRow rating={review.rating} />
                    <span
                      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold"
                      style={
                        review.status === "visible"
                          ? { background: "rgba(16,185,129,0.12)", color: "rgb(5 150 105)" }
                          : { background: "rgba(100,116,139,0.15)", color: "var(--text-muted)" }
                      }
                    >
                      {review.status === "visible" ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "rgb(16 185 129)" }} />
                          Visible
                        </>
                      ) : (
                        <>Oculta{review.hidden_reason ? ` · ${review.hidden_reason}` : ""}</>
                      )}
                    </span>
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
                      className="mt-2 rounded border px-3 py-2 text-sm"
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
                      className="mt-3 space-y-2 border-l-[3px] pl-3"
                      style={{ borderColor: "var(--accent-solid)" }}
                    >
                      {review.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold" style={{ color: "var(--accent-solid)" }}>
                              Respuesta del negocio · {formatDate(reply.created_at)}
                            </p>
                            <p className="text-sm leading-6" style={{ color: "var(--text-main)" }}>
                              {reply.message}
                            </p>
                          </div>
                          {canEditClientes ? (
                            <button
                              type="button"
                              disabled={deletingReplyId === reply.id}
                              onClick={() => handleDeleteReply(review, reply)}
                              aria-label="Borrar respuesta"
                              title="Borrar respuesta"
                              className="shrink-0 rounded p-1 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {canEditClientes ? (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenReplyFor((prev) => ({ ...prev, [review.id]: !prev[review.id] }))
                          }
                          className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition"
                          style={{ color: "var(--text-main)" }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Responder
                        </button>

                        <span className="h-4 w-px" style={{ background: "var(--border-color)" }} />

                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            disabled={reactingId === review.id}
                            onClick={() => handleReaction(review, emoji)}
                            aria-label={`Reaccionar con ${emoji}`}
                            className="flex h-8 w-8 items-center justify-center rounded border text-base transition disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              borderColor:
                                review.reaction === emoji ? "var(--accent-solid)" : "var(--border-color)",
                              background:
                                review.reaction === emoji ? "rgba(37,99,235,0.12)" : "var(--bg-soft)",
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
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
                            className="w-full rounded border px-3 py-2 text-sm outline-none transition focus:border-blue-400"
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
                              className="inline-flex h-9 items-center rounded px-4 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
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
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      disabled={updatingId === review.id}
                      onClick={() => {
                        if (review.status === "visible") {
                          setHidingReasonFor((prev) => (prev === review.id ? "" : review.id));
                        } else {
                          handleSetStatus(review, "visible");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}
                    >
                      {review.status === "visible" ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Ocultar <ChevronDown className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Mostrar
                        </>
                      )}
                    </button>

                    {hidingReasonFor === review.id ? (
                      <div
                        className="absolute right-0 top-full z-20 mt-2 w-56 rounded border p-2 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.55)]"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                      >
                        <p className="mb-1.5 px-1 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                          Motivo para ocultar
                        </p>
                        {HIDDEN_REASONS.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            disabled={updatingId === review.id}
                            onClick={() => handleSetStatus(review, "hidden", reason)}
                            className="block w-full rounded px-2 py-1.5 text-left text-xs transition hover:bg-slate-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ color: "var(--text-main)" }}
                          >
                            {reason}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setHidingReasonFor("")}
                          className="mt-1 block w-full rounded px-2 py-1.5 text-left text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .orbyx-reviews-page {
          --reviews-hero-bg: linear-gradient(135deg, #f0edff, #e8f1ff);
          --reviews-hero-border: rgba(37, 99, 235, 0.35);
          --reviews-hero-title: #172033;
          --reviews-hero-muted: #64748b;
        }

        :global(:root[data-theme="nocturno"]) .orbyx-reviews-page {
          --reviews-hero-bg: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.96),
            rgba(12, 32, 66, 0.92) 50%,
            rgba(17, 24, 39, 0.96)
          );
          --reviews-hero-border: rgba(56, 189, 248, 0.28);
          --reviews-hero-title: #f8fafc;
          --reviews-hero-muted: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
