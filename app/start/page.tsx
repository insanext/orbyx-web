"use client";

import { useMemo, useState } from "react";

type BusinessData = {
  businessName: string;
  category: string;
  phone: string;
};

type ServiceData = {
  serviceName: string;
  duration: string;
  price: string;
};

type WeeklyScheduleItem = {
  label: string;
  value: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type SpecialDayConfig = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const INITIAL_WEEKLY_SCHEDULE: WeeklyScheduleItem[] = [
  { label: "Lunes", value: "monday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { label: "Martes", value: "tuesday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { label: "Miércoles", value: "wednesday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { label: "Jueves", value: "thursday", enabled: true, startTime: "08:00", endTime: "18:00" },
  { label: "Viernes", value: "friday", enabled: true, startTime: "08:00", endTime: "16:00" },
  { label: "Sábado", value: "saturday", enabled: true, startTime: "09:00", endTime: "14:00" },
  { label: "Domingo", value: "sunday", enabled: false, startTime: "09:00", endTime: "14:00" },
];

function pad2(value: number | string) {
  return String(value).padStart(2, "0");
}

function parseTime(value: string) {
  const [hourStr = "00", minuteStr = "00"] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return {
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildTime(hour: number, minute: number) {
  return `${pad2(clamp(hour, 0, 23))}:${pad2(clamp(minute, 0, 59))}`;
}

function sanitizePhone(value: string) {
  return value.replace(/[^\d+\s()-]/g, "");
}

type TimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

function TimeField({ value, onChange }: TimeFieldProps) {
  const { hour, minute } = parseTime(value);

  function handleHourChange(raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned === "") {
      onChange(buildTime(0, minute));
      return;
    }
    onChange(buildTime(Number(cleaned), minute));
  }

  function handleMinuteChange(raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned === "") {
      onChange(buildTime(hour, 0));
      return;
    }
    onChange(buildTime(hour, Number(cleaned)));
  }

  function handleHourBlur() {
    onChange(buildTime(hour, minute));
  }

  function handleMinuteBlur() {
    onChange(buildTime(hour, minute));
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5">
      <input
        type="number"
        min={0}
        max={23}
        value={hour}
        onChange={(e) => handleHourChange(e.target.value)}
        onBlur={handleHourBlur}
        className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />

      <span className="text-base font-semibold text-slate-500">:</span>

      <input
        type="number"
        min={0}
        max={59}
        value={minute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        onBlur={handleMinuteBlur}
        className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

type SpecialDateCardProps = {
  title: string;
  config: SpecialDayConfig;
  onToggle: (checked: boolean) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

function SpecialDateCard({
  title,
  config,
  onToggle,
  onStartChange,
  onEndChange,
}: SpecialDateCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-center">
        <div className="flex items-center gap-3">
          <input
            id={title}
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <label htmlFor={title} className="text-sm font-medium text-slate-800">
            {title}
          </label>
        </div>

        {config.enabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Hora inicio
              </label>
              <TimeField value={config.startTime} onChange={onStartChange} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Hora fin
              </label>
              <TimeField value={config.endTime} onChange={onEndChange} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No configurada</div>
        )}
      </div>
    </div>
  );
}

export default function StartPage() {
  const [step, setStep] = useState(1);

  const [business, setBusiness] = useState<BusinessData>({
    businessName: "",
    category: "",
    phone: "",
  });

  const [service, setService] = useState<ServiceData>({
    serviceName: "",
    duration: "",
    price: "",
  });

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>(
    INITIAL_WEEKLY_SCHEDULE
  );

  const [specialDates, setSpecialDates] = useState({
    disableHolidays: true,
    nationalHolidayEve: {
      enabled: false,
      startTime: "09:00",
      endTime: "14:00",
    } as SpecialDayConfig,
    christmasEve: {
      enabled: false,
      startTime: "09:00",
      endTime: "13:00",
    } as SpecialDayConfig,
    newYearsEve: {
      enabled: false,
      startTime: "09:00",
      endTime: "13:00",
    } as SpecialDayConfig,
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

  function updateWeeklyDay(
    dayValue: string,
    field: keyof WeeklyScheduleItem,
    value: boolean | string
  ) {
    setWeeklySchedule((prev) =>
      prev.map((day) =>
        day.value === dayValue ? { ...day, [field]: value } : day
      )
    );
  }

  function updateSpecialDate(
    key: "nationalHolidayEve" | "christmasEve" | "newYearsEve",
    field: keyof SpecialDayConfig,
    value: boolean | string
  ) {
    setSpecialDates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  }

  function canContinueStep1() {
    const phoneIsValid =
      business.phone.trim() !== "" && /^[0-9+\s()-]+$/.test(business.phone);

    return (
      business.businessName.trim() !== "" &&
      business.category.trim() !== "" &&
      phoneIsValid
    );
  }

  function canContinueStep2() {
    return service.serviceName.trim() !== "" && service.duration.trim() !== "";
  }

  function canContinueStep3() {
    const enabledDays = weeklySchedule.filter((day) => day.enabled);
    if (enabledDays.length === 0) return false;

    return enabledDays.every(
      (day) => day.startTime.trim() !== "" && day.endTime.trim() !== ""
    );
  }

  function canContinueStep4() {
    const specialConfigs = [
      specialDates.nationalHolidayEve,
      specialDates.christmasEve,
      specialDates.newYearsEve,
    ];

    return specialConfigs.every((item) => {
      if (!item.enabled) return true;
      return item.startTime.trim() !== "" && item.endTime.trim() !== "";
    });
  }

  function nextStep() {
    if (step === 1 && !canContinueStep1()) return;
    if (step === 2 && !canContinueStep2()) return;
    if (step === 3 && !canContinueStep3()) return;
    if (step === 4 && !canContinueStep4()) return;

    setStep((prev) => Math.min(prev + 1, 5));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
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
                  Deja lista la base de tu sistema de reservas en pocos pasos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                Paso <span className="font-semibold text-slate-900">{step}</span> de 5
              </div>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className={`h-2 rounded-full ${
                    item <= step ? "bg-sky-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-5">
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
                Fechas especiales
              </span>
              <span className={step === 5 ? "font-semibold text-sky-700" : ""}>
                Resumen
              </span>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {step === 1 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Datos del negocio
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Esta información se usará para preparar tu página pública.
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
                      Teléfono de contacto
                    </label>
                    <input
                      type="tel"
                      value={business.phone}
                      onChange={(e) => {
                        const sanitized = sanitizePhone(e.target.value);
                        setBusiness((prev) => ({
                          ...prev,
                          phone: sanitized,
                        }));
                      }}
                      placeholder="Ej: +56 9 1234 5678"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Solo números y símbolos válidos como + ( ) -
                    </p>
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
                    Este será el primer servicio que tus clientes podrán reservar. Más adelante podrás agregar todos los servicios que quieras.
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
                      Duración (minutos)
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
                    Configura el horario de cada día según cómo realmente atiendes.
                  </p>
                </div>

                <div className="space-y-3">
                  {weeklySchedule.map((day) => (
                    <div
                      key={day.value}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                        <div className="flex items-center gap-3">
                          <input
                            id={day.value}
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(e) =>
                              updateWeeklyDay(day.value, "enabled", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <label
                            htmlFor={day.value}
                            className="text-sm font-medium text-slate-800"
                          >
                            {day.label}
                          </label>
                        </div>

                        {day.enabled ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                Hora inicio
                              </label>
                              <TimeField
                                value={day.startTime}
                                onChange={(newValue) =>
                                  updateWeeklyDay(day.value, "startTime", newValue)
                                }
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                Hora fin
                              </label>
                              <TimeField
                                value={day.endTime}
                                onChange={(newValue) =>
                                  updateWeeklyDay(day.value, "endTime", newValue)
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">Cerrado</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Fechas especiales
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Aquí puedes dejar reglas especiales para feriados y vísperas.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      id="disableHolidays"
                      type="checkbox"
                      checked={specialDates.disableHolidays}
                      onChange={(e) =>
                        setSpecialDates((prev) => ({
                          ...prev,
                          disableHolidays: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label
                      htmlFor="disableHolidays"
                      className="text-sm font-medium text-slate-800"
                    >
                      No atender feriados
                    </label>
                  </div>
                </div>

                <SpecialDateCard
                  title="Víspera de Fiestas Patrias"
                  config={specialDates.nationalHolidayEve}
                  onToggle={(checked) =>
                    updateSpecialDate("nationalHolidayEve", "enabled", checked)
                  }
                  onStartChange={(value) =>
                    updateSpecialDate("nationalHolidayEve", "startTime", value)
                  }
                  onEndChange={(value) =>
                    updateSpecialDate("nationalHolidayEve", "endTime", value)
                  }
                />

                <SpecialDateCard
                  title="Víspera de Navidad"
                  config={specialDates.christmasEve}
                  onToggle={(checked) =>
                    updateSpecialDate("christmasEve", "enabled", checked)
                  }
                  onStartChange={(value) =>
                    updateSpecialDate("christmasEve", "startTime", value)
                  }
                  onEndChange={(value) =>
                    updateSpecialDate("christmasEve", "endTime", value)
                  }
                />

                <SpecialDateCard
                  title="Víspera de Año Nuevo"
                  config={specialDates.newYearsEve}
                  onToggle={(checked) =>
                    updateSpecialDate("newYearsEve", "enabled", checked)
                  }
                  onStartChange={(value) =>
                    updateSpecialDate("newYearsEve", "startTime", value)
                  }
                  onEndChange={(value) =>
                    updateSpecialDate("newYearsEve", "endTime", value)
                  }
                />
              </section>
            )}

            {step === 5 && (
              <section className="space-y-6">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Configuración lista
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Tu negocio ya tiene una base configurada
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Ya definiste tus datos principales, tu primer servicio, tus horarios y tus fechas especiales.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Negocio</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {business.businessName || "Tu negocio"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{business.category}</p>
                    <p className="mt-1 text-sm text-slate-600">{business.phone}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Primer servicio</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {service.serviceName || "Servicio"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.duration || "0"} min
                      {service.price ? ` · $${service.price}` : " · Precio opcional"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                    <p className="text-sm text-slate-500">Horarios semanales</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {weeklySchedule.map((day) => (
                        <div
                          key={day.value}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-slate-800">
                            {day.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {day.enabled
                              ? `${day.startTime} - ${day.endTime}`
                              : "Cerrado"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                    <p className="text-sm text-slate-500">Fechas especiales</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p>
                        Feriados:{" "}
                        <span className="font-medium">
                          {specialDates.disableHolidays ? "No atender" : "Atención normal"}
                        </span>
                      </p>

                      <p>
                        Víspera de Fiestas Patrias:{" "}
                        <span className="font-medium">
                          {specialDates.nationalHolidayEve.enabled
                            ? `${specialDates.nationalHolidayEve.startTime} - ${specialDates.nationalHolidayEve.endTime}`
                            : "No configurada"}
                        </span>
                      </p>

                      <p>
                        Víspera de Navidad:{" "}
                        <span className="font-medium">
                          {specialDates.christmasEve.enabled
                            ? `${specialDates.christmasEve.startTime} - ${specialDates.christmasEve.endTime}`
                            : "No configurada"}
                        </span>
                      </p>

                      <p>
                        Víspera de Año Nuevo:{" "}
                        <span className="font-medium">
                          {specialDates.newYearsEve.enabled
                            ? `${specialDates.newYearsEve.startTime} - ${specialDates.newYearsEve.endTime}`
                            : "No configurada"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 lg:col-span-2">
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

            {step < 5 && (
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
                  {step === 4 ? "Ver resumen" : "Continuar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}