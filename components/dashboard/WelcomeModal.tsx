"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ background: "rgba(2, 6, 23, 0.55)" }}
        >
          <motion.div
            className="flex max-w-lg flex-col items-center text-center"
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
            <button
              type="button"
              onClick={handleClose}
              disabled={dismissing}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
            >
              Ir a mi panel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
