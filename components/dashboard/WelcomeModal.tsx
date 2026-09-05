"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { StarsCanvas } from "../ui/stars-canvas";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// Imagen del perrito según el mes actual (getMonth() es 0-indexado: 8 =
// septiembre, 11 = diciembre). Cualquier otro mes usa la imagen genérica.
function getWelcomeImageSrc(): string {
  const month = new Date().getMonth();
  if (month === 8) return "/welcome-perrito-fiestas-patrias.png";
  if (month === 11) return "/welcome-perrito-navidad.png";
  return "/welcome-perrito-normal.png";
}

// Modal de bienvenida, una sola vez por tenant (persistido en
// tenants.dashboard_welcome_seen_at vía POST /tenants/:id/dashboard-welcome-
// seen -- no localStorage). `open` lo controla el dashboard según
// accountStatus.dashboard_welcome_seen; acá solo se dispara el POST y se
// avisa al padre para que oculte el modal de inmediato, sin esperar la
// respuesta -- mismo criterio best-effort que el resto de los toggles de
// consentimiento de este proyecto: si el POST falla, el próximo refresh de
// account-status simplemente lo vuelve a mostrar.
export function WelcomeModal({
  tenantId,
  open,
  onDismiss,
}: {
  tenantId: string;
  open: boolean;
  onDismiss: () => void;
}) {
  const [dismissing, setDismissing] = useState(false);

  function handleClose() {
    if (dismissing) return;
    setDismissing(true);
    apiFetch(`${BACKEND_URL}/tenants/${tenantId}/dashboard-welcome-seen`, {
      method: "POST",
    }).catch(() => {
      // best-effort -- ver comentario arriba
    });
    onDismiss();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Fondo de estrellas en vez del blur del dashboard detrás -- ver
              components/ui/stars-canvas.tsx. pointer-events: none ya viene
              seteado en el propio componente, así que nunca intercepta
              clicks del contenido de encima. maxStars/speedMultiplier bajos
              a propósito: los defaults (1200 estrellas, velocidad 1) son
              pensados para un fondo de página completa, acá es un modal
              chico y a velocidad normal se veía vertiginoso. brightness en
              0.8 (no el default de 10 del componente): su propio tipo lo
              documenta como rango 0–1 -- fuera de ese rango, ctx.globalAlpha
              ignora la asignación (valores inválidos no se clampean, quedan
              en lo último válido) y el parpadeo de las estrellas no se ve. */}
          <StarsCanvas maxStars={300} speedMultiplier={0.2} brightness={0.8} />

          <motion.div
            className="relative z-10 flex max-w-lg flex-col items-center text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={getWelcomeImageSrc()}
              alt="¡Bienvenido a Orbyx!"
              className="max-h-[55vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl"
            />
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={dismissing}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #00e5ff 0%, #0ea5e9 100%)",
                color: "#0f172a",
                boxShadow: "0 0 28px rgba(0,229,255,0.55), 0 10px 30px rgba(0,0,0,0.35)",
              }}
            >
              Ir a mi panel
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
