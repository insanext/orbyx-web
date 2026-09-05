"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeModal } from "../../components/dashboard/WelcomeModal";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Paleta consolidada a un solo acento (NEON, cian) + grises slate + un verde
// para "éxito/activo" -- antes se mezclaban cian, morado, índigo, ámbar y
// verde en el mismo tour, lo que se veía recargado (feedback de Camilo).
const NEON = "#00e5ff";
const SUCCESS = "#10b981";
const FONT = "'Inter','Segoe UI',system-ui,sans-serif";

const cardBase: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "rgba(15,23,42,0.9)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0,229,255,0.3)",
  borderRadius: 20,
  boxShadow:
    "0 0 40px rgba(6,182,212,0.1), 0 0 2px rgba(0,229,255,0.4), 0 24px 64px rgba(0,0,0,0.55)",
  padding: "40px 36px",
  fontFamily: FONT,
  position: "relative",
  overflow: "hidden",
};

// ─── Slide animation variants ────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir * 72, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as any } },
  exit: (dir: number) => ({ x: dir * -72, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as any } }),
};

// ─── Progress dots ────────────────────────────────────────────────────────────
function Dots({ cur, total }: { cur: number; total: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 7 }}>
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === cur ? 24 : 8, background: i === cur ? NEON : "rgba(255,255,255,0.12)" }}
            transition={{ duration: 0.3 }}
            style={{ height: 8, borderRadius: 999, boxShadow: i === cur ? `0 0 8px ${NEON}77` : "none" }}
          />
        ))}
      </div>
      <span style={{ color: "#334155", fontSize: 11 }}>Paso {cur + 1} de {total}</span>
    </div>
  );
}

// ─── Slide 1 — Bienvenida ─────────────────────────────────────────────────────
function Slide1() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>🎉</div>
      {/* Badge animado */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: `${SUCCESS}1f`, border: `1px solid ${SUCCESS}4d`,
            borderRadius: 999, padding: "5px 14px",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: SUCCESS, display: "inline-block", boxShadow: `0 0 6px ${SUCCESS}` }} />
          <span style={{ color: SUCCESS, fontSize: 12, fontWeight: 700 }}>Negocio activo</span>
        </motion.div>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 12 }}>
        ¡Tu negocio está listo!
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
        En minutos configuraste lo esencial. Te mostramos cómo sacarle el máximo provecho a Orbyx.
      </p>
    </div>
  );
}

// ─── Slide 2 — Agenda mockup ──────────────────────────────────────────────────
const SLOTS = [
  { time: "09:00", name: "María González", status: "Confirmada", color: NEON, bg: `${NEON}14`, border: `${NEON}4d` },
  { time: "11:00", name: "Carlos Muñoz",   status: "Atendido",   color: SUCCESS, bg: `${SUCCESS}14`, border: `${SUCCESS}4d` },
  { time: "14:30", name: "Ana Pérez",      status: "Pendiente",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.3)" },
];

function Slide2() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, textAlign: "center" }}>
        Tu agenda inteligente
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, textAlign: "center", marginBottom: 18 }}>
        Ve todas tus reservas del día, cambia estados y cierra atenciones en un clic.
      </p>
      {/* Agenda card mockup */}
      <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700 }}>Hoy</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>Martes 10 Jun</span>
        </div>
        <div style={{ padding: "10px 14px", display: "grid", gap: 8 }}>
          {SLOTS.map((s, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 8, padding: "8px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600, minWidth: 36 }}>{s.time}</span>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s.name}</span>
              </div>
              <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px" }}>
                {s.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide 3 — Página pública ─────────────────────────────────────────────────
function Slide3({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(`https://orbyx.cl/${slug}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, textAlign: "center" }}>
        Tu página de reservas
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, textAlign: "center", marginBottom: 18 }}>
        Tus clientes reservan en línea 24/7. Comparte el link y empieza a recibir reservas hoy.
      </p>
      {/* URL pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,229,255,0.05)", border: `1px solid ${NEON}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <span style={{ flex: 1, color: NEON, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
          orbyx.cl/{slug}
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copy}
          style={{
            background: copied ? "rgba(34,197,94,0.15)" : "rgba(0,229,255,0.12)",
            border: `1px solid ${copied ? "#22c55e55" : NEON + "55"}`,
            color: copied ? "#22c55e" : NEON,
            borderRadius: 7, padding: "5px 13px",
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
          }}
        >
          {copied ? "¡Copiado! ✓" : "Copiar"}
        </motion.button>
      </div>
      {/* Services preview */}
      <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: NEON, display: "inline-block" }} />
          <span style={{ color: "#64748b", fontSize: 11 }}>orbyx.cl/{slug}</span>
        </div>
        <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
          {["Consulta general", "Servicio premium"].map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ color: "#475569", fontSize: 11 }}>{i === 0 ? "60 min · $15.000" : "90 min · $25.000"}</div>
              </div>
              <div style={{ background: `linear-gradient(135deg,${NEON}cc,#0ea5e9)`, color: "#0f172a", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}>
                Reservar
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide 4 — Staff y servicios ──────────────────────────────────────────────
const MOCK_STAFF = [
  { initials: "MG", name: "María G.", role: "Especialista" },
  { initials: "CP", name: "Carlos P.", role: "Profesional" },
];

function Slide4({ slug }: { slug: string }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, textAlign: "center" }}>
        Tu equipo y servicios
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, textAlign: "center", marginBottom: 18 }}>
        Agrega más profesionales y servicios desde el panel. Cada uno con sus propios horarios.
      </p>
      {/* 2x2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {MOCK_STAFF.map((s, i) => (
          <div key={i} style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${NEON}1f`, border: `1px solid ${NEON}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: NEON }}>
              {s.initials}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>{s.role}</div>
            </div>
          </div>
        ))}
        {[0, 1].map((i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ color: "#334155", fontSize: 22, lineHeight: 1 }}>+</span>
            <span style={{ color: "#334155", fontSize: 11 }}>Agregar</span>
          </div>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => window.open(`/dashboard/${slug}/services`, "_blank")}
        style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${NEON}44`, background: "rgba(0,229,255,0.06)", color: NEON, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        Ir a servicios ↗
      </motion.button>
    </div>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────
// La "Slide 5" (cohete, "¡Todo listo!") que cerraba este tour se reemplazó por
// WelcomeModal (perrito + fondo de estrellas) -- mismo componente que ya se
// usa como respaldo en el dashboard (ver dashboard/[slug]/layout.tsx) si el
// tenant llega ahí sin haber pasado por acá. Evita el flash de dashboard
// "pelado" antes de que aparezca: ahora se muestra ANTES de navegar, como
// cierre del tour, en vez de después de montar el dashboard.
function WelcomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug      = searchParams.get("slug")      || "";
  const tenantId  = searchParams.get("tenant_id") || "";
  const branchId  = searchParams.get("branch_id") || "";

  const [step, setStep] = useState(0);
  const [dir,  setDir]  = useState(1);
  const [modalOpen, setModalOpen] = useState(true);

  const cardSlides = [
    <Slide1 key="s1" />,
    <Slide2 key="s2" />,
    <Slide3 key="s3" slug={slug} />,
    <Slide4 key="s4" slug={slug} />,
  ];
  // +1: el último "paso" ya no es una slide de tarjeta, es WelcomeModal.
  const TOTAL = cardSlides.length + 1;
  const isModalStep = step === TOTAL - 1;

  // Guard
  useEffect(() => {
    if (!slug) router.replace("/login");
  }, [slug, router]);

  // Marca visto apenas se llega al paso del modal (no solo al cerrarlo): si
  // el tenant cierra la pestaña justo acá, la próxima vez que entre al
  // dashboard igual lo encontrará marcado -- el POST de WelcomeModal hace lo
  // mismo contra el backend, esto es solo el flag legacy en localStorage que
  // ya usaba este tour.
  useEffect(() => {
    if (isModalStep && slug) {
      try { localStorage.setItem(`orbyx_welcome_seen_${slug}`, "1"); } catch {}
    }
  }, [isModalStep, slug]);

  function next() { setDir(1);  setStep((s) => Math.min(s + 1, TOTAL - 1)); }
  function prev() { setDir(-1); setStep((s) => Math.max(s - 1, 0)); }

  function finish() {
    try { localStorage.setItem(`orbyx_welcome_seen_${slug}`, "1"); } catch {}
    router.push(`/dashboard/${slug}`);
  }

  // Deja que WelcomeModal termine su fade-out/scale-down (ver su duración de
  // transición) antes de navegar -- si navegáramos de inmediato, la
  // animación de salida se cortaría a mitad de camino.
  function handleModalDismiss() {
    setModalOpen(false);
    setTimeout(finish, 350);
  }

  if (isModalStep) {
    return <WelcomeModal tenantId={tenantId} open={modalOpen} onDismiss={handleModalDismiss} />;
  }

  const slides = cardSlides;

  const isFirst = step === 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)", padding: "24px 16px" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", top: "8%", left: "4%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "12%", right: "6%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={cardBase}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00e5ff,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, color: "#0f172a", boxShadow: "0 4px 14px rgba(0,229,255,0.28)" }}>
              ◆
            </div>
            <span style={{ fontSize: 19, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>Orbyx</span>
          </div>
        </div>

        <Dots cur={step} total={TOTAL} />

        {/* Slide area */}
        <div style={{ minHeight: 280, position: "relative" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {slides[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,229,255,0.18),transparent)", margin: "24px 0 20px" }} />

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          {!isFirst && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={prev}
              style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}
            >
              ← Atrás
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={next}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 15, fontFamily: FONT, letterSpacing: "0.2px",
              background: `linear-gradient(135deg,${NEON}cc 0%,#0ea5e9 50%,#06b6d4bb 100%)`,
              color: "#0f172a",
              boxShadow: `0 6px 24px rgba(0,229,255,0.3)`,
            }}
          >
            {isFirst ? "Comenzar tour →" : "Siguiente →"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#64748b", fontFamily: FONT }}>
        Cargando...
      </div>
    }>
      <WelcomeInner />
    </Suspense>
  );
}
