"use client";

import { motion } from "framer-motion";

// Mockup de teléfono con una conversación de WhatsApp real (marco de
// smartphone, notch, header con avatar + estado, fondo de chat con patrón
// sutil, burbujas recibida/enviada con checks). Las burbujas aparecen en
// secuencia una sola vez cuando el mockup entra en viewport.
export function WhatsAppMockup({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[260px] shrink-0 rounded-[38px] border-[6px] border-[#111214] bg-[#111214] shadow-[0_24px_60px_var(--pub-shadow-color)] ${className}`}
      style={{ aspectRatio: "9 / 19.5" }}
    >
      {/* Botones laterales */}
      <div className="absolute -left-[6px] top-[86px] h-6 w-[3px] rounded-l-sm bg-[#0a0a0b]" />
      <div className="absolute -left-[6px] top-[122px] h-10 w-[3px] rounded-l-sm bg-[#0a0a0b]" />
      <div className="absolute -right-[6px] top-[104px] h-12 w-[3px] rounded-r-sm bg-[#0a0a0b]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-[#0b141a]">
        {/* Dynamic island / notch */}
        <div className="absolute left-1/2 top-2 z-20 h-[18px] w-[84px] -translate-x-1/2 rounded-full bg-[#111214]" />

        {/* Header WhatsApp */}
        <div className="relative z-10 flex items-center gap-2.5 bg-[#1f2c34] px-3.5 pb-2.5 pt-7">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src="/orbyx-mark.png" alt="Orbyx" className="h-6 w-6 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-white">Orbyx</p>
            <p className="truncate text-[10px] text-[#9bb0ba]">en línea</p>
          </div>
          <div className="flex items-center gap-2.5 text-[#9bb0ba]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 1a11 11 0 100 22 11 11 0 000-22zm1 16h-2v-2h2zm0-4h-2V7h2z" />
            </svg>
          </div>
        </div>

        {/* Fondo de chat con patrón sutil */}
        <div
          className="relative flex-1 space-y-2 overflow-hidden px-3 py-3"
          style={{
            backgroundColor: "#0b141a",
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="mx-auto w-fit rounded-md bg-[#182229] px-2.5 py-1 text-center text-[9px] font-medium text-[#9bb0ba]">
            Clientes sin reservar hace 30 días
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="max-w-[86%] rounded-lg rounded-tl-sm bg-[#1f2c34] px-2.5 py-1.5 text-white shadow-sm"
          >
            <p className="text-[10.5px] leading-[15px]">
              Hola Camila 👋 Hace 1 mes de tu última visita. Como cliente
              preferente, tienes 15% OFF en tu próxima reserva. Agenda
              nuevamente →
            </p>
            <p className="mt-1 text-right text-[8.5px] text-[#9bb0ba]">10:02 a.m.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-[#005c4b] px-2.5 py-1.5 text-white shadow-sm"
          >
            <p className="text-[10.5px] leading-[15px]">¡Perfecto, ahí reservo! 👍</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[8.5px] text-[#8fe3d1]">
              <span>10:04 a.m.</span>
              <svg viewBox="0 0 16 11" className="h-2.5 w-3.5 fill-current">
                <path d="M11.1.5 4 7.6 1.4 5 .3 6.1l3.7 3.7L12.2 1.6zm3.6 0-7 7.1-.6-.6-1 1.1 1.6 1.6 8.1-8.1z" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
