"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, Store } from "lucide-react";
import BusinessPanel from "./BusinessPanel";
import BranchesPage from "../branches/page";

type TabKey = "negocio" | "sucursales";

// "Mi Negocio" — unifica lo que antes eran 2 ítems separados del sidebar
// (Negocio y Sucursales) en un solo panel con pestañas. BusinessPanel y
// BranchesPage son exactamente los mismos componentes que antes vivían
// como page.tsx de cada ruta, sin ningún cambio interno — solo cambia
// dónde se montan. El tab activo vive en el query param `tab` para que
// siga siendo enlazable/bookmarkeable.
export default function MiNegocioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const activeTab: TabKey = searchParams.get("tab") === "sucursales" ? "sucursales" : "negocio";

  function setTab(tab: TabKey) {
    const query = tab === "sucursales" ? "?tab=sucursales" : "";
    router.replace(`/dashboard/${slug}/business${query}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <section
        className="relative overflow-hidden rounded-2xl border px-4 py-2.5 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)]"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.42),rgba(34,211,238,0.35),transparent)]" />
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex max-w-3xl items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">Negocio</p>
              <h1 className="mt-0.5 text-lg font-semibold">Configura tu negocio aquí</h1>
              <p className="mt-0.5 text-sm leading-5">
                Administra la configuración global, reservas, horarios por sucursal y excepciones del calendario.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "var(--border-color)" }}>
        <button
          type="button"
          onClick={() => setTab("negocio")}
          className="inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition"
          style={
            activeTab === "negocio"
              ? { borderColor: "var(--accent-solid)", color: "var(--accent-solid)" }
              : { borderColor: "transparent", color: "var(--text-muted)" }
          }
        >
          <Briefcase className="h-4 w-4" />
          Negocio
        </button>
        <button
          type="button"
          onClick={() => setTab("sucursales")}
          className="inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition"
          style={
            activeTab === "sucursales"
              ? { borderColor: "var(--accent-solid)", color: "var(--accent-solid)" }
              : { borderColor: "transparent", color: "var(--text-muted)" }
          }
        >
          <Store className="h-4 w-4" />
          Sucursales
        </button>
      </div>

      {activeTab === "negocio" ? <BusinessPanel /> : null}
      {activeTab === "sucursales" ? <BranchesPage /> : null}
    </div>
  );
}
