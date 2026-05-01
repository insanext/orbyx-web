"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export default function CampaignHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/campaigns/history/${slug}`
        );
        const data = await res.json();
        setCampaigns(data || []);
      } catch (err) {
        console.error("Error cargando historial", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  return (
    <div className="space-y-6 pb-8">

      {/* 🔙 VOLVER */}
      <button
        onClick={() => router.push(`/dashboard/${slug}/campaigns`)}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        <ArrowLeft size={16} />
        Volver a campañas
      </button>

      {/* 🧠 HEADER */}
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-main)" }}
        >
          Historial de campañas
        </h1>

        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Revisa campañas enviadas anteriormente.
        </p>
      </div>

      {/* 📋 LISTA */}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>
          Cargando historial...
        </p>
      ) : campaigns.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No hay campañas aún.
        </p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
              }}
            >
              <p
                className="font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {item.campaign_name || "Sin nombre"}
              </p>

              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {new Date(item.created_at).toLocaleString()}
              </p>

              <div className="mt-2 text-xs flex gap-3">
                <span>Enviados: {item.sent_count}</span>
                <span>Fallidos: {item.failed_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}