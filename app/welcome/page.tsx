"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ── Design tokens (espeja onboarding/signup) ─────────────────────────────────
const NEON = "#00e5ff";
const BG = "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)";

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "rgba(15, 23, 42, 0.88)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0, 229, 255, 0.4)",
  borderRadius: 20,
  boxShadow:
    "0 0 24px rgba(0,229,255,0.22), 0 0 60px rgba(6,182,212,0.13), 0 0 2px rgba(0,229,255,0.55), 0 32px 72px rgba(0,0,0,0.55)",
  padding: "44px 40px",
  fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  position: "relative",
  overflow: "hidden",
};

// ── Slide variants ────────────────────────────────────────────────────────────
function variants(dir: number) {
  return {
    enter: { x: dir * 60, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
    exit: { x: dir * -60, opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  };
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 999,
            background: i === current ? NEON : "rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
            boxShadow: i === current ? `0 0 8px ${NEON}88` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Agenda SVG illustration ───────────────────────────────────────────────────
function AgendaSVG() {
  const colors = [NEON, "#818cf8", "#f472b6", "#34d399", "#fbbf24"];
  return (
    <svg viewBox="0 0 200 120" width="100%" style={{ maxWidth: 200, margin: "0 auto", display: "block" }}>
      <rect x="10" y="10" width="180" height="100" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
      {/* Header */}
      <rect x="10" y="10" width="180" height="22" rx="10" fill="rgba(0,229,255,0.1)" />
      <rect x="10" y="22" width="180" height="10" fill="rgba(0,229,255,0.1)" />
      <circle cx="25" cy="21" r="5" fill={NEON} opacity="0.7" />
      <rect x="35" y="17" width="60" height="8" rx="4" fill="rgba(255,255,255,0.15)" />
      {/* Blocks */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={20 + i * 34} y="40" width="26" height={20 + (i % 3) * 12} rx="4" fill={colors[i]} opacity="0.7" />
          <rect x={20 + i * 34} y="88" width="26" height="8" rx="3" fill="rgba(255,255,255,0.06)" />
        </g>
      ))}
    </svg>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      style={{
        background: copied ? "rgba(34,197,94,0.15)" : "rgba(0,229,255,0.1)",
        border: `1px solid ${copied ? "#22c55e66" : NEON + "55"}`,
        color: copied ? "#22c55e" : NEON,
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap" as const,
        flexShrink: 0,
      }}
    >
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

// ── Cards data ────────────────────────────────────────────────────────────────
type CardDef = {
  icon: string;
  title: string;
  body: React.ReactNode;
};

function buildCards(slug: string): CardDef[] {
  const publicUrl = `orbyx.cl/${slug}`;
  const fullPublicUrl = `https://orbyx.cl/${slug}`;

  return [
    {
      icon: "🎉",
      title: "¡Tu negocio está listo!",
      body: (
        <p style={bodyStyle}>
          En menos de 5 minutos configuraste lo esencial. Ahora te mostramos cómo sacarle el
          máximo provecho a Orbyx.
        </p>
      ),
    },
    {
      icon: "📅",
      title: "Tu agenda inteligente",
      body: (
        <>
          <p style={bodyStyle}>
            Desde la agenda puedes ver todas tus reservas del día, cambiar estados, agregar
            reservas manuales y cerrar atenciones.
          </p>
          <div style={{ marginTop: 20 }}>
            <AgendaSVG />
          </div>
        </>
      ),
    },
    {
      icon: "🌐",
      title: "Tu página de reservas",
      body: (
        <>
          <p style={bodyStyle}>
            Tus clientes pueden reservar en línea desde tu página pública. Comparte el link y
            empieza a recibir reservas hoy.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 20,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: NEON,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {publicUrl}
            </span>
            <CopyButton text={fullPublicUrl} />
          </div>
        </>
      ),
    },
    {
      icon: "👥",
      title: "Agrega tu equipo y servicios",
      body: (
        <>
          <p style={bodyStyle}>
            Puedes agregar más profesionales y servicios desde el panel. Cada profesional
            puede tener sus propios horarios.
          </p>
          <button
            onClick={() => window.open(`/dashboard/${slug}/services`, "_blank")}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 10,
              border: `1px solid ${NEON}55`,
              background: "rgba(0,229,255,0.07)",
              color: NEON,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Ir a servicios ↗
          </button>
        </>
      ),
    },
    {
      icon: "🚀",
      title: "¡Todo listo para despegar!",
      body: (
        <>
          <p style={bodyStyle}>
            Explora el panel, configura tu negocio y empieza a recibir reservas. Si necesitas
            ayuda, escríbenos.
          </p>
        </>
      ),
    },
  ];
}

const bodyStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
};

// ── Main inner component ──────────────────────────────────────────────────────
function WelcomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = backward

  // Guard: sin slug → login
  useEffect(() => {
    if (!slug) { router.replace("/login"); return; }
    // marcar como visto
    try { localStorage.setItem(`orbyx_welcome_seen_${slug}`, "1"); } catch {}
  }, [slug, router]);

  const cards = buildCards(slug);
  const total = cards.length;
  const card = cards[step];

  function goNext() {
    setDir(1);
    setStep((s) => Math.min(s + 1, total - 1));
  }
  function goPrev() {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  }
  function finishToDashboard() {
    router.push(`/dashboard/${slug}`);
  }
  function openPublic() {
    window.open(`https://orbyx.cl/${slug}`, "_blank");
  }

  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        padding: "24px 16px",
      }}
    >
      {/* Blobs */}
      <div style={{ position: "fixed", top: "8%", left: "4%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "12%", right: "6%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={CARD_STYLE}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${NEON},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 4px 14px rgba(0,229,255,0.3)`, color: "#0f172a", fontWeight: 900 }}>◆</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>Orbyx</span>
          </div>
        </div>

        <ProgressDots current={step} total={total} />

        {/* Card content with AnimatePresence */}
        <div style={{ minHeight: 240, position: "relative" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 60, opacity: 0 }),
                center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
                exit: (d: number) => ({ x: d * -60, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Icon */}
              <div style={{ textAlign: "center", fontSize: 44, marginBottom: 16, lineHeight: 1 }}>
                {card.icon}
              </div>

              {/* Title */}
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", textAlign: "center", marginBottom: 12 }}>
                {card.title}
              </h2>

              {/* Body */}
              <div>{card.body}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,229,255,0.18),transparent)", margin: "28px 0 20px" }} />

        {/* Navigation */}
        {isLast ? (
          <div style={{ display: "grid", gap: 10 }}>
            <button
              onClick={finishToDashboard}
              style={{
                padding: "13px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                background: `linear-gradient(135deg,${NEON}cc 0%,#0ea5e9 50%,#06b6d4bb 100%)`,
                color: "#0f172a",
                boxShadow: `0 6px 28px rgba(0,229,255,0.35)`,
                letterSpacing: "0.3px",
              }}
            >
              Ir a mi panel →
            </button>
            <button
              onClick={openPublic}
              style={{
                padding: "11px",
                borderRadius: 10,
                border: `1px solid ${NEON}44`,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                background: "rgba(0,229,255,0.06)",
                color: NEON,
              }}
            >
              Ver mi página pública ↗
            </button>
            <button
              type="button"
              onClick={goPrev}
              style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: "4px 0" }}
            >
              ← Atrás
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {!isFirst && (
              <button
                onClick={goPrev}
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
                }}
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={goNext}
              style={{
                flex: 1,
                padding: "13px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                background: `linear-gradient(135deg,${NEON}cc 0%,#0ea5e9 50%,#06b6d4bb 100%)`,
                color: "#0f172a",
                boxShadow: `0 6px 28px rgba(0,229,255,0.3)`,
                letterSpacing: "0.3px",
              }}
            >
              {isFirst ? "Comenzar tour →" : "Siguiente →"}
            </button>
          </div>
        )}

        {/* Step counter */}
        <p style={{ textAlign: "center", color: "#334155", fontSize: 11, marginTop: 16, marginBottom: 0 }}>
          {step + 1} de {total}
        </p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#64748b", fontFamily: "system-ui" }}>
        Cargando...
      </div>
    }>
      <WelcomeInner />
    </Suspense>
  );
}
