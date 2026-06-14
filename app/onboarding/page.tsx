"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Shared design tokens (espeja signup) ────────────────────────────────────
const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0, 229, 255, 0.4)",
  borderRadius: 20,
  boxShadow:
    "0 0 24px rgba(0, 229, 255, 0.25), 0 0 60px rgba(6, 182, 212, 0.15), 0 0 2px rgba(0, 229, 255, 0.6), 0 32px 72px rgba(0,0,0,0.55)",
  padding: "44px 40px",
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

const NEON = "#00e5ff";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const CATEGORY_GROUPS = [
  {
    group: "Salud y Bienestar",
    options: [
      { key: "medico",            category: "clinica",       label: "Médico / Consulta médica" },
      { key: "psicologo",         category: "clinica",       label: "Psicólogo(a)" },
      { key: "nutricionista",     category: "clinica",       label: "Nutricionista" },
      { key: "kinesiologo",       category: "clinica",       label: "Kinesiólogo(a)" },
      { key: "fonoaudiologo",     category: "clinica",       label: "Fonoaudiólogo(a)" },
      { key: "podologo",          category: "clinica",       label: "Podólogo(a)" },
      { key: "t_ocupacional",     category: "clinica",       label: "Terapeuta ocupacional" },
      { key: "t_complementario",  category: "clinica",       label: "Terapeuta complementario" },
      { key: "enfermeria",        category: "clinica",       label: "Enfermería" },
      { key: "centro_salud",      category: "clinica",       label: "Centro de salud" },
      { key: "dental",            category: "odontologia",   label: "Clínica dental" },
      { key: "otro_salud",        category: "clinica",       label: "Otro profesional de salud" },
    ],
  },
  {
    group: "Veterinaria y Mascotas",
    options: [
      { key: "vet_clinica",       category: "vet",           label: "Clínica veterinaria" },
      { key: "peluqueria_can",    category: "vet",           label: "Peluquería canina" },
      { key: "spa_mascotas",      category: "vet",           label: "Spa de mascotas" },
      { key: "guarderia_masc",    category: "vet",           label: "Guardería de mascotas" },
      { key: "adiestramiento",    category: "vet",           label: "Adiestramiento" },
      { key: "otro_vet",          category: "vet",           label: "Otro servicio para mascotas" },
    ],
  },
  {
    group: "Clases y actividades grupales",
    options: [
      { key: "gimnasio",          category: "group_booking", label: "Gimnasio" },
      { key: "yoga",              category: "group_booking", label: "Yoga" },
      { key: "pilates",           category: "group_booking", label: "Pilates" },
      { key: "crossfit",          category: "group_booking", label: "Crossfit" },
      { key: "talleres",          category: "group_booking", label: "Talleres" },
      { key: "academia",          category: "group_booking", label: "Academia" },
      { key: "clases_part",       category: "group_booking", label: "Clases particulares" },
      { key: "otro_grupal",       category: "group_booking", label: "Otro servicio grupal" },
    ],
  },
  {
    group: "Servicios y otros negocios",
    options: [
      { key: "taller_automotriz", category: "generico", subtype: "taller_automotriz", label: "Taller automotriz" },
      { key: "salon_belleza",     category: "generico", label: "Salón de belleza" },
      { key: "barberia",          category: "generico", label: "Barbería" },
      { key: "serv_prof",         category: "generico", label: "Servicios profesionales" },
      { key: "consultoria",       category: "generico", label: "Consultoría" },
      { key: "serv_domicilio",    category: "generico", label: "Servicios a domicilio" },
      { key: "otro_negocio",      category: "generico", label: "Otro negocio" },
    ],
  },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((g) => g.options.map((o) => [o.key, o]))
);

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>
          PASO {step} DE {total}
        </span>
        <span style={{ color: NEON, fontSize: 12, fontWeight: 700 }}>
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(step / total) * 100}%`,
            background: `linear-gradient(90deg, ${NEON}, #0ea5e9)`,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2,
              borderRadius: 999,
              background: i < step ? NEON : "rgba(255,255,255,0.08)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Button helpers ───────────────────────────────────────────────────────────
function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "13px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 15,
        background: disabled
          ? "rgba(255,255,255,0.06)"
          : `linear-gradient(135deg, ${NEON}cc 0%, #0ea5e9 50%, #06b6d4bb 100%)`,
        color: disabled ? "#475569" : "#0f172a",
        boxShadow: disabled ? "none" : `0 6px 28px rgba(0,229,255,0.35), 0 2px 8px rgba(0,229,255,0.2)`,
        transition: "all 0.2s",
        letterSpacing: "0.3px",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "13px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 14,
        background: "rgba(255,255,255,0.04)",
        color: "#94a3b8",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id") || "";
  const calendarId = searchParams.get("calendar_id") || "";
  const [currentSlug, setCurrentSlug] = useState<string>(searchParams.get("slug") || "");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("medico");

  // Step 2 — bloques globales + días activos como índices numéricos
  type DayBlock = { start: string; end: string };
  const [blocks, setBlocks] = useState<DayBlock[]>([{ start: "09:00", end: "18:00" }]);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);

  function toggleDay(i: number) {
    setActiveDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
    );
  }
  function updateBlock(idx: number, field: "start" | "end", value: string) {
    setBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  }
  function addBlock() {
    if (blocks.length >= 2) return;
    setBlocks((prev) => [...prev, { start: "15:00", end: "19:00" }]);
  }
  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }

  // Step 3 — staff
  const [resolvedBranchId, setResolvedBranchId] = useState<string>(searchParams.get("branch_id") || "");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");

  // Step 4
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

  // ── Step 1 submit ──────────────────────────────────────────────────────────
  async function handleStep1() {
    if (!businessName.trim()) { setError("Ingresa el nombre de tu negocio."); return; }
    setError(null);
    setLoading(true);
    try {
      const selectedCat = CATEGORY_MAP[category];
      const businessCategory = selectedCat?.category ?? "generico";
      const businessSubtype = (selectedCat as any)?.subtype as string | undefined;
      const res = await fetch(`${backend}/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim(),
          business_name: businessName.trim(),
          business_category: businessCategory,
          ...(businessSubtype ? { business_subtype: businessSubtype } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Error guardando el negocio");
      }
      const j = await res.json().catch(() => ({}));
      const slug = j?.slug || j?.tenant?.slug || currentSlug;
      if (slug) {
        setCurrentSlug(slug);
        const params = new URLSearchParams({
          tenant_id: tenantId,
          ...(calendarId ? { calendar_id: calendarId } : {}),
          ...(resolvedBranchId ? { branch_id: resolvedBranchId } : {}),
          slug,
        });
        router.replace(`/onboarding?${params.toString()}`);
      }
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 submit ──────────────────────────────────────────────────────────
  async function handleStep2() {
    if (activeDays.length === 0) { setError("Selecciona al menos un día."); return; }
    for (const b of blocks) {
      if (b.start >= b.end) {
        setError("Hay un bloque donde la apertura es igual o posterior al cierre.");
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      const payload: object[] = [];
      DAY_KEYS.forEach((_, i) => {
        if (!activeDays.includes(i)) {
          payload.push({ day_of_week: i, enabled: false, start_time: "09:00", end_time: "18:00" });
        } else {
          blocks.forEach((b) => {
            payload.push({ day_of_week: i, enabled: true, start_time: b.start, end_time: b.end });
          });
        }
      });
      const res = await fetch(`${backend}/business-hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, scope: "global", hours: payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Error guardando horarios");
      }
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3 submit — staff ─────────────────────────────────────────────────
  async function handleStep3() {
    if (!staffName.trim()) { setError("Ingresa el nombre del profesional."); return; }
    setError(null);
    setLoading(true);
    try {
      // Resolver branch_id: usar el que ya tenemos o pedir la primera sucursal activa
      let activeBranchId = resolvedBranchId;
      if (!activeBranchId) {
        const branchRes = await fetch(`${backend}/branches?tenant_id=${tenantId}`);
        if (branchRes.ok) {
          const branchData = await branchRes.json().catch(() => ({}));
          const branches: any[] = branchData?.branches || branchData || [];
          const first = branches.find((b: any) => b.is_active !== false) || branches[0];
          if (first?.id) {
            activeBranchId = String(first.id);
            setResolvedBranchId(activeBranchId);
          }
        }
      }
      const body: Record<string, any> = {
        tenant_id: tenantId,
        name: staffName.trim(),
        role: staffRole.trim() || null,
        is_active: true,
      };
      if (activeBranchId) body.branch_id = activeBranchId;
      const res = await fetch(`${backend}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Error creando el profesional");
      }
      setStep(4);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 4 submit — servicio ──────────────────────────────────────────────
  async function handleStep4() {
    if (!serviceName.trim()) { setError("Ingresa el nombre del servicio."); return; }
    const dur = parseInt(duration);
    if (!dur || dur < 5) { setError("La duración debe ser al menos 5 minutos."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${backend}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...(resolvedBranchId ? { branch_id: resolvedBranchId } : {}),
          name: serviceName.trim(),
          duration_minutes: dur,
          price: price ? parseFloat(price) : 0,
          is_active: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Error creando el servicio");
      }

      await goToDashboard();
    } catch (e: any) {
      setError(e.message || "Error");
      setLoading(false);
    }
  }

  async function goToDashboard() {
    const buildWelcome = (slug: string) => {
      const p = new URLSearchParams({ slug });
      if (tenantId) p.set("tenant_id", tenantId);
      if (resolvedBranchId) p.set("branch_id", resolvedBranchId);
      return `/welcome?${p.toString()}`;
    };
    if (currentSlug) { router.push(buildWelcome(currentSlug)); return; }
    try {
      const tenantRes = await fetch(`${backend}/tenants/${tenantId}`);
      const tenantData = await tenantRes.json().catch(() => ({}));
      const slug = tenantData?.slug || tenantData?.tenant?.slug;
      router.push(slug ? buildWelcome(slug) : "/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  const stepTitles = ["Tu negocio", "Horario de atención", "Tu equipo", "Primer servicio"];
  const stepSubtitles = [
    "Cuéntanos sobre tu negocio",
    "¿Cuándo atienden tus clientes?",
    "Agrega tu primer profesional. Después podrás agregar más según tu plan.",
    "Agrega tu primer servicio",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: "24px 16px",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed", top: "10%", left: "5%", width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "15%", right: "8%", width: 250, height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={CARD_STYLE}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: `linear-gradient(135deg, ${NEON}, #0ea5e9)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: `0 4px 14px rgba(0,229,255,0.3)`,
                color: "#0f172a", fontWeight: 900,
              }}
            >
              ◆
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
              Orbyx
            </span>
          </div>
        </div>

        <StepIndicator step={step} total={4} />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 4, textAlign: "center" }}>
          {stepTitles[step - 1]}
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginBottom: 28 }}>
          {stepSubtitles[step - 1]}
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)", marginBottom: 28 }} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={{ display: "grid", gap: 18 }}>
            <div>
              <label style={LABEL_STYLE}>Nombre del negocio</label>
              <input
                style={INPUT_STYLE}
                placeholder="Ej: Clínica Veterinaria San Juan"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep1()}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ ...INPUT_STYLE, appearance: "none" as any }}
              >
                {CATEGORY_GROUPS.map((g) => (
                  <optgroup key={g.group} label={g.group} style={{ background: "#1e293b", color: "#94a3b8" }}>
                    {g.options.map((o) => (
                      <option key={o.key} value={o.key} style={{ background: "#1e293b" }}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {error && <ErrorMsg text={error} />}
            <div style={{ marginTop: 4 }}>
              <PrimaryBtn onClick={handleStep1} disabled={loading || !businessName.trim()}>
                {loading ? "Guardando..." : "Siguiente →"}
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Chips de días */}
            <div>
              <label style={LABEL_STYLE}>Días de atención</label>
              <div style={{ display: "flex", flexWrap: "wrap" as any, gap: 8 }}>
                {DAYS.map((day, i) => {
                  const active = activeDays.includes(i);
                  return (
                    <button key={i} type="button" onClick={() => toggleDay(i)}
                      style={{
                        padding: "7px 13px", borderRadius: 8,
                        border: `1px solid ${active ? NEON + "80" : "rgba(255,255,255,0.1)"}`,
                        background: active ? "rgba(0,229,255,0.1)" : "rgba(255,255,255,0.04)",
                        color: active ? NEON : "#64748b",
                        fontSize: 13, fontWeight: active ? 700 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloques globales */}
            <div style={{ display: "grid", gap: 10 }}>
              {blocks.map((b, bi) => (
                <div key={bi} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Inicio</label>
                    <input type="time" value={b.start} step="1800"
                      onChange={(e) => updateBlock(bi, "start", e.target.value)}
                      style={{ ...INPUT_STYLE, padding: "8px 10px" }} />
                  </div>
                  <span style={{ color: "#475569", fontSize: 12, paddingBottom: 10 }}>–</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Cierre</label>
                    <input type="time" value={b.end} step="1800"
                      onChange={(e) => updateBlock(bi, "end", e.target.value)}
                      style={{ ...INPUT_STYLE, padding: "8px 10px" }} />
                  </div>
                  {bi > 0 && (
                    <button type="button" onClick={() => removeBlock(bi)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, paddingBottom: 8 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              {blocks.length < 2 && (
                <button type="button" onClick={addBlock}
                  style={{ alignSelf: "flex-start", background: "none", border: `1px solid ${NEON}66`, color: NEON, borderRadius: 8, padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>
                  ＋ Agregar bloque
                </button>
              )}
            </div>

            <p style={{ margin: 0, color: "#475569", fontSize: 12 }}>
              ¿Necesitas horarios distintos por día? Configúralo después desde el panel.
            </p>

            {error && <ErrorMsg text={error} />}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <SecondaryBtn onClick={() => { setStep(1); setError(null); }}>← Atrás</SecondaryBtn>
              <PrimaryBtn onClick={handleStep2} disabled={loading}>
                {loading ? "Guardando..." : "Siguiente →"}
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* ── STEP 3 — equipo ── */}
        {step === 3 && (
          <div style={{ display: "grid", gap: 18 }}>
            <div>
              <label style={LABEL_STYLE}>Nombre del profesional</label>
              <input
                style={INPUT_STYLE}
                placeholder="Ej: Dr. Martínez, Ana López"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rol / especialidad</label>
              <input
                style={INPUT_STYLE}
                placeholder="Ej: Doctor, Estilista, Entrenador"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
              />
            </div>
            {error && <ErrorMsg text={error} />}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)", margin: "4px 0" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryBtn onClick={() => { setStep(2); setError(null); }}>← Atrás</SecondaryBtn>
              <PrimaryBtn onClick={handleStep3} disabled={loading || !staffName.trim()}>
                {loading ? "Guardando..." : "Siguiente →"}
              </PrimaryBtn>
            </div>
            <p style={{ textAlign: "center", margin: 0 }}>
              <button type="button" onClick={() => { setError(null); setStep(4); }}
                style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Omitir por ahora
              </button>
            </p>
          </div>
        )}

        {/* ── STEP 4 — servicio ── */}
        {step === 4 && (
          <div style={{ display: "grid", gap: 18 }}>
            <div>
              <label style={LABEL_STYLE}>Nombre del servicio</label>
              <input
                style={INPUT_STYLE}
                placeholder="Ej: Consulta general, Clase de yoga"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Duración (min)</label>
                <input
                  type="number" min={5} step={5}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Precio (CLP)</label>
                <input
                  type="number" min={0} placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            {error && <ErrorMsg text={error} />}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)", margin: "4px 0" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryBtn onClick={() => { setStep(3); setError(null); }}>← Atrás</SecondaryBtn>
              <PrimaryBtn onClick={handleStep4} disabled={loading || !serviceName.trim()}>
                {loading ? "Finalizando..." : "Finalizar ✓"}
              </PrimaryBtn>
            </div>
            <p style={{ textAlign: "center", margin: 0 }}>
              <button type="button" onClick={() => goToDashboard()}
                style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Omitir por ahora
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <p style={{
      color: "#f87171", fontSize: 13,
      background: "#ef444415", border: "1px solid #ef444430",
      borderRadius: 8, padding: "10px 14px", margin: 0,
    }}>
      {text}
    </p>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#64748b", fontFamily: "system-ui" }}>
        Cargando...
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
