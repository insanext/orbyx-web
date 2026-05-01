"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// 👉 IMPORTA TODO lo que ya usabas
// ajusta rutas si es necesario
import {
  SectionCard,
  MetricCard,
  TinyMetric,
  SoftChip,
  MiniStat,
} from "@/components/ui"; // ajusta si es distinto

export default function CampaignHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // ⚠️ IMPORTANTE:
  // aquí debes reutilizar TODOS tus estados / hooks reales
  // (historyStats, filteredHistory, loadCampaignHistory, etc)
  // NO los redefino para no romper tu lógica existente

  return (
    <div className="space-y-8 pb-8">

      {/* 🔙 BOTÓN VOLVER */}
      <div>
        <button
          onClick={() => router.push(`/dashboard/${slug}/campaigns`)}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-main)" }}
        >
          <ArrowLeft size={16} />
          Volver a campañas
        </button>
      </div>

      {/* 🧠 HEADER */}
      <div>
        <h1
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--text-main)" }}
        >
          Historial de campañas
        </h1>

        <p
          className="mt-1 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Resultados, filtros y desempeño de campañas anteriores.
        </p>
      </div>

      {/* 📊 MÉTRICAS */}
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          title="Campañas filtradas"
          value={loadingHistory ? "..." : String(historyStats.total)}
          helper="Resultado según filtros activos."
        />
        <MetricCard
          title={loadingHistory ? "Envíos realizados" : historySentLabel}
          value={loadingHistory ? "..." : String(historyStats.totalSent)}
          helper="Suma total en la vista actual."
        />
        <MetricCard
          title="Tasa promedio"
          value={loadingHistory ? "..." : `${historyStats.avgSuccess}%`}
          helper="Éxito promedio según límite aplicado."
        />
        <MetricCard
          title="Último envío"
          value={
            loadingHistory
              ? "..."
              : historyStats.latest
              ? formatDate(historyStats.latest.created_at)
              : "Sin envíos"
          }
          helper="Registro más reciente."
        />
      </div>

      {/* 🎛️ FILTROS */}
      <SectionCard title="Filtros" description="Ajusta el historial que deseas visualizar.">
        <div className="space-y-6">

          {/* PERIODO */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Período
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <SoftChip active={historyPeriod === "all"} label="Todo" onClick={() => setHistoryPeriod("all")} />
              <SoftChip active={historyPeriod === "7d"} label="7 días" onClick={() => setHistoryPeriod("7d")} />
              <SoftChip active={historyPeriod === "30d"} label="30 días" onClick={() => setHistoryPeriod("30d")} />
              <SoftChip active={historyPeriod === "this_month"} label="Este mes" onClick={() => setHistoryPeriod("this_month")} />
              <SoftChip active={historyPeriod === "custom"} label="Personalizado" onClick={() => setHistoryPeriod("custom")} />
            </div>

            {historyPeriod === "custom" && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          {/* BUSQUEDA */}
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Buscar campaña..."
            className={inputClass}
          />

          {/* SELECTS */}
          <div className="grid gap-4 md:grid-cols-3">
            <select value={historyChannel} onChange={(e) => setHistoryChannel(e.target.value as any)} className={selectClass}>
              <option value="all">Todos</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            <select value={historySegment} onChange={(e) => setHistorySegment(e.target.value as any)} className={selectClass}>
              <option value="all">Todos</option>
              <option value="new">Nuevos</option>
              <option value="recurrent">Recurrentes</option>
              <option value="frequent">Frecuentes</option>
              <option value="inactive">Inactivos</option>
            </select>

            <select value={historyPerformance} onChange={(e) => setHistoryPerformance(e.target.value as any)} className={selectClass}>
              <option value="all">Todos</option>
              <option value="excellent">Excelente</option>
              <option value="good">Bueno</option>
              <option value="warning">Regular</option>
              <option value="failed">Fallido</option>
            </select>
          </div>

          {/* BOTONES */}
          <div className="flex gap-3">
            <button onClick={resetHistoryFilters} className={secondaryButtonClass}>
              Limpiar filtros
            </button>

            <button onClick={() => slug && loadCampaignHistory(slug)} className={secondaryButtonClass}>
              Recargar
            </button>
          </div>

        </div>
      </SectionCard>

      {/* 📋 LISTADO */}
      <SectionCard title="Últimas campañas">
        {loadingHistory ? (
          <HistorySkeleton />
        ) : filteredHistory.length === 0 ? (
          <p>No hay campañas</p>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => {
              const successRate = getSuccessRate(item);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedCampaign(item);
                    loadCampaignLogs(item.id);
                  }}
                  className="cursor-pointer rounded-2xl border p-4"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <p className="font-semibold">
                    {item.campaign_name || "Sin nombre"}
                  </p>

                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {formatDate(item.created_at)}
                  </p>

                  <div className="mt-2 flex gap-2 text-xs">
                    <span>Enviados: {item.sent_count}</span>
                    <span>Fallidos: {item.failed_count}</span>
                    <span>Éxito: {successRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}