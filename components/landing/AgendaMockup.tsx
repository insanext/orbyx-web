"use client";

import { motion } from "framer-motion";

const agendaStaff = [
  { name: "Camila R.", role: "Estilista", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
  { name: "Andrés M.", role: "Barbero", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
  { name: "Sofía P.", role: "Estilista", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
];

const agendaHours = ["09:00", "10:00", "11:00", "12:00", "13:00"];

const agendaAppts = [
  { col: 0, top: 0, h: 67, time: "09:00", service: "Corte", client: "M. González", status: "booked" as const },
  { col: 0, top: 135, h: 90, time: "10:30", service: "Tinte", client: "P. Soto", status: "completed" as const },
  { col: 0, top: 315, h: 45, time: "12:30", service: "Brushing", client: "L. Díaz", status: "booked" as const },
  { col: 1, top: 45, h: 67, time: "09:30", service: "Manicure", client: "C. Rojas", status: "booked" as const },
  { col: 1, top: 180, h: 45, time: "11:00", service: "Pedicure", client: "V. Torres", status: "booked" as const },
  { col: 1, top: 360, h: 90, time: "13:00", service: "Uñas gel", client: "A. Muñoz", status: "completed" as const },
  { col: 2, top: 0, h: 90, time: "09:00", service: "Masaje", client: "R. Silva", status: "booked" as const },
  { col: 2, top: 135, h: 45, time: "10:30", service: "Facial", client: "I. Vargas", status: "completed" as const },
  { col: 2, top: 270, h: 135, time: "12:00", service: "Depilación", client: "F. Herrera", status: "booked" as const },
];

export function AgendaMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] shadow-[0_16px_40px_var(--pub-shadow-color),0_0_50px_-20px_var(--pub-accent)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-[var(--pub-border-soft)] bg-[var(--pub-bg)] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
          </div>
          <div className="mx-auto rounded-md bg-[var(--pub-bg-soft)] px-4 py-1 text-[10px] text-[var(--pub-text-faint)]">
            orbyx.cl/dashboard/mi-negocio/agenda
          </div>
        </div>

        {/* Agenda content */}
        <div className="h-[400px] overflow-hidden sm:h-[420px] lg:h-[440px]">
          {/* Staff header */}
          <div
            className="grid border-b border-[var(--pub-border-soft)]"
            style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}
          >
            <div className="flex items-center justify-center border-r border-[var(--pub-border-soft)] px-2 py-2.5 text-[10px] font-medium text-[var(--pub-text-faint)]">
              Hora
            </div>
            {agendaStaff.map((staff) => (
              <div
                key={staff.name}
                className="flex items-center gap-2 border-r border-[var(--pub-border-soft)] px-2 py-2.5 last:border-r-0"
              >
                <img
                  src={staff.photo}
                  alt={staff.name}
                  className="h-8 w-8 shrink-0 rounded-full border border-[var(--pub-border)] object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold leading-tight text-[var(--pub-text)]">{staff.name}</p>
                  <p className="truncate text-[9px] text-[var(--pub-text-faint)]">{staff.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Time grid + appointment columns */}
          <div className="grid" style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}>
            {/* Time labels column */}
            <div className="relative border-r border-[var(--pub-border-soft)]" style={{ height: 450 }}>
              {agendaHours.map((hour, i) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-[var(--pub-border-soft)] px-1.5 pt-1 text-[10px] text-[var(--pub-text-faint)]"
                  style={{ top: i * 90 }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Staff columns */}
            {agendaStaff.map((staff, colIndex) => (
              <div
                key={staff.name}
                className="relative border-r border-[var(--pub-border-soft)] last:border-r-0"
                style={{ height: 450 }}
              >
                {/* Hour grid lines */}
                {[90, 180, 270, 360].map((y) => (
                  <div key={y} className="absolute left-0 right-0 border-t border-[var(--pub-border-soft)]" style={{ top: y }} />
                ))}
                {/* Half-hour lines */}
                {[45, 135, 225, 315, 405].map((y) => (
                  <div key={y} className="absolute left-0 right-0 border-t border-dashed border-[var(--pub-border-soft)]" style={{ top: y }} />
                ))}
                {/* Appointment blocks — aparecen en cascada al entrar en viewport */}
                {agendaAppts
                  .filter((a) => a.col === colIndex)
                  .map((appt, i) => (
                    <motion.div
                      key={`${appt.time}-${appt.service}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.3, delay: 0.15 + (colIndex * 3 + i) * 0.06 }}
                      className="absolute left-1 right-1 overflow-hidden rounded-[4px] px-1.5 py-1 text-white"
                      style={{
                        top: appt.top,
                        height: appt.h,
                        background:
                          appt.status === "booked"
                            ? "linear-gradient(135deg, rgba(30,64,175,0.90), rgba(59,130,246,0.56))"
                            : "linear-gradient(135deg, rgba(6,95,70,0.90), rgba(16,185,129,0.56))",
                        boxShadow:
                          appt.status === "booked"
                            ? "0 0 18px -10px rgba(96,165,250,0.85)"
                            : "0 0 18px -10px rgba(52,211,153,0.85)",
                      }}
                    >
                      <p className="truncate text-[9px] font-semibold leading-tight">
                        {appt.client} · {appt.service}
                      </p>
                      {appt.h > 50 && <p className="mt-0.5 truncate text-[8px] text-white/70">{appt.time}</p>}
                    </motion.div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Laptop base */}
      <div className="mx-auto h-[6px] w-[45%] rounded-b-lg bg-[var(--pub-border)]" />
    </div>
  );
}
