"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function GroupBookingPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";
  const groupKey =
    ((params as { groupKey?: string })?.groupKey as string) || "";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/dashboard/${encodeURIComponent(slug)}/agenda`}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
          }}
        >
          ← Volver a Agenda
        </Link>

        <section
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            Lista completa de inscritos
          </h1>

          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Esta vista se usará para gestionar inscritos del grupo.
          </p>

          <div
            className="mt-5 rounded-xl border p-3 text-xs"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-muted)",
            }}
          >
            groupKey: {decodeURIComponent(groupKey)}
          </div>
        </section>
      </div>
    </main>
  );
}
