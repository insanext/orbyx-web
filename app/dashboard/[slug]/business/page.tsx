"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Store } from "lucide-react";
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
