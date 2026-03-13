"use client";

import { useMemo, useState } from "react";

type BusinessData = {
  businessName: string;
  category: string;
  email: string;
};

type ServiceData = {
  serviceName: string;
  duration: string;
  price: string;
};

type ScheduleData = {
  startTime: string;
  endTime: string;
  days: string[];
};

const DAY_OPTIONS = [
  { label: "Lun", value: "monday" },
  { label: "Mar", value: "tuesday" },
  { label: "Mié", value: "wednesday" },
  { label: "Jue", value: "thursday" },
  { label: "Vie", value: "friday" },
  { label: "Sáb", value: "saturday" },
  { label: "Dom", value: "sunday" },
];

export default function StartPage() {
  const [step, setStep] = useState<number>(1);

  const [business, setBusiness] = useState<BusinessData>({
    businessName: "",
    category: "",
    email: "",
  });

  const [service, setService] = useState<ServiceData>({
    serviceName: "",
    duration: "",
    price: "",
  });

  const [schedule, setSchedule] = useState<ScheduleData>({
    startTime: "",
    endTime: "",
    days: [],
  });

  const slugPreview = useMemo(() => {
    return (
      business.businessName
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || "tunegocio"
    );
  }, [business.businessName]);

  function toggleDay(day: string) {
    setSchedule((prev) => {
      const exists = prev.days.includes(day);

      if (exists) {
        return {
          ...prev,
          days: prev.days.filter((d) => d !== day),
        };
      }

      return {
        ...prev,
        days: [...prev.days, day],
      };
    });
  }

  function canContinueStep1() {
    return (
      business.businessName.trim() !== "" &&
      business.category.trim() !== "" &&
      business.email.trim() !== ""
    );
  }

  function canContinueStep2() {
    return service.serviceName.trim() !== "" && service.duration.trim() !== "";
  }

  function canContinueStep3() {
    return (
      schedule.startTime.trim() !== "" &&
      schedule.endTime.trim() !== "" &&
      schedule.days.length > 0
    );
  }

  function nextStep() {
    if (step === 1 && !canContinueStep1()) return;
    if (step === 2 && !canContinueStep2()) return;
    if (step === 3 && !canContinueStep3()) return;

    setStep((prev) => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <a
            href="/"
            className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
          >
            ← Volver a Orbyx
          </a>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Onboarding Orbyx
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Configura tu negocio
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  En pocos pasos dejarás lista la base de tu sistema de reservas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                Paso <span className="font-semibold text-slate-900">{step}</span> de 4
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-2 rounded-full ${
                    item <= step ? "bg-sky-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
              <span className={step === 1 ? "font-semibold text-sky-700" : ""}>
                Negocio
              </span>
              <span className={step === 2 ? "font-semibold text-sky-700" : ""}>
                Servicio
              </span>
              <span className={step === 3 ? "font-semibold text-sky-700" : ""}>
                Horarios
              </span>
              <span className={step === 4 ? "font-semibold text-sky-700" : ""}>
                Página lista
              </span>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {step === 1 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Cuéntanos sobre tu negocio
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Estos datos servirán para crear tu página pública de reservas.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nombre del negocio
                    </label>
                    <input
                      type="text"
                      value={business.businessName}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                      placeholder="Ej: Juan Barber"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Rubro
                    </label>
                    <input
                      type="text"
                      value={business.category}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      placeholder="Ej: Barbería"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Correo de contacto
                    </label>
                    <input
                      type="email"
                      value={business.email}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Ej: contacto@tunegocio.cl"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Vista previa de tu página
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    orbyx.cl/
                    <span className="font-semibold text-sky-700">{slugPreview}</span>
                  </p>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Crea tu primer servicio
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Este será el primer servicio que tus clientes podrán reservar.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nombre del servicio
                    </label>
                    <input
                      type="text"
                      value={service.serviceName}
                      onChange={(e) =>
                        setService((prev) => ({
                          ...prev,
                          serviceName: e.target.value,
                        }))
                      }
                      placeholder="Ej: Corte de cabello"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Duración
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={service.duration}
                      onChange={(e) =>
                        setService((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="Ej: 30"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">En minutos.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Precio <span className="text-slate-400">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={service.price}
                      onChange={(e) =>
                        setService((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="Ej: 10000"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Define tus horarios de atención
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Selecciona los días en que atiendes y el rango horario base.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Días de atención
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const isActive = schedule.days.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            isActive
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Configuración lista
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Tu base ya está preparada
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Ya tienes definidos tu negocio, tu primer servicio y tu horario de atención.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Negocio</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {business.businessName || "Tu negocio"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{business.category}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Primer servicio</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {service.serviceName || "Servicio"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.duration || "0"} min
                      {service.price ? ` · $${service.price}` : " · Precio no visible"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Horario base</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {schedule.days.length > 0
                        ? schedule.days.join(", ")
                        : "Sin días seleccionados"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                    <p className="text-sm text-slate-500">Vista previa de tu link</p>
                    <p className="mt-1 font-medium text-sky-700">
                      orbyx.cl/{slugPreview}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                  >
                    Volver al inicio
                  </a>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
                  >
                    Continuar después
                  </button>
                </div>
              </section>
            )}

            {step < 4 && (
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Volver
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
                >
                  {step === 3 ? "Finalizar" : "Continuar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}