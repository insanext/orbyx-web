"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  Star,
  Store,
  Users,
  Wand2,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const heroChips = [
    "IA que responde por WhatsApp",
    "Menos trabajo manual",
    "Más reservas y seguimiento",
  ];

  const businessTypes = [
    "Barbería",
    "Peluquería",
    "Centro de estética",
    "Spa",
    "Salón de belleza",
    "Clínica estética",
    "Consulta médica",
    "Consulta psicológica",
    "Centro médico",
    "Centro dental",
    "Kinesiología",
    "Masajes y terapias",
    "Nutrición",
    "Veterinaria",
    "Tattoo studio",
    "Estudio de uñas",
    "Lashes / cejas",
    "Gimnasio",
    "Personal trainer",
    "Estudio de yoga / pilates",
    "Academia / clases",
    "Asesorías profesionales",
    "Restaurante",
    "Cafetería",
    "Otro",
  ];

  const teamSizes = ["1", "2-3", "4-10", "10+"];

  const featureCards = [
    {
      icon: MessageCircleMore,
      title: "Atención por WhatsApp con IA",
      desc: "Aunque no tengas tiempo de responder, Orbyx puede contestar consultas frecuentes, orientar al cliente y ayudar a moverlo hacia una reserva.",
    },
    {
      icon: BellRing,
      title: "Recordatorios automáticos",
      desc: "Reduce ausencias con mensajes automáticos antes de cada cita, sin tener que escribir uno por uno todos los días.",
    },
    {
      icon: CalendarDays,
      title: "Agenda más activa y ordenada",
      desc: "Centraliza reservas, horarios, clientes y seguimiento en un solo lugar para trabajar con más orden y menos fricción.",
    },
    {
      icon: Users,
      title: "Recuperación de clientes",
      desc: "Detecta clientes inactivos y vuelve a contactarlos con campañas y seguimiento.",
    },
    {
      icon: Wand2,
      title: "Menos trabajo repetitivo",
      desc: "Tu equipo deja de perder tiempo explicando lo mismo o coordinando manualmente.",
    },
    {
      icon: Clock3,
      title: "Atención incluso cuando estás ocupado",
      desc: "Si estás atendiendo o fuera de horario, tu negocio sigue respondiendo.",
    },
  ];

  const detailPoints = [
    "Responde consultas frecuentes por WhatsApp automáticamente.",
    "Agenda consultas, vacunas y peluquería.",
    "Reduce ausencias con recordatorios automáticos.",
    "Mantiene seguimiento sin hacerlo manualmente.",
    "Centraliza clientes, historial y reservas.",
    "Da una imagen más profesional y ordenada.",
  ];

  const businessExamples = [
    "Veterinarias y clínicas veterinarias",
    "Peluquerías caninas",
    "Centros de estética y spa",
    "Barberías y peluquerías",
    "Gimnasios y clases",
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1600px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_540px]">
            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 text-5xl font-semibold leading-tight sm:text-6xl xl:text-7xl"
              >
                Responde clientes por WhatsApp
                <br />
                en tu veterinaria
                <br />
                <span className="text-blue-600">
                  incluso cuando estás atendiendo
                </span>
              </motion.h1>

              <p className="mt-8 text-lg text-slate-700 sm:text-[22px]">
                Orbyx responde consultas, agenda citas y hace seguimiento automático para que no pierdas pacientes.
                <br />
                <br />
                Mientras atiendes o no alcanzas a responder, tu veterinaria sigue funcionando.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border px-4 py-2 text-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-5">
                <Link
                  href="/planes"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-white"
                >
                  Ver planes →
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                También funciona para estética, barberías y fitness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="text-3xl font-semibold">
            Más que una agenda
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border p-6">
                  <Icon className="mb-3" />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-slate-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DETALLE */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="text-3xl font-semibold">
            Hecho para negocios reales
          </h2>

          <div className="mt-8 space-y-3">
            {detailPoints.map((item) => (
              <div key={item} className="flex gap-2">
                <CheckCircle2 className="text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}