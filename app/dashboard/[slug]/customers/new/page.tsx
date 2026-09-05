"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        className="block text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500";

const TEXTAREA_CLASS =
  "w-full rounded-xl border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";

function inputStyle() {
  return {
    borderColor: "var(--border-color)",
    background: "var(--bg-soft)",
    color: "var(--text-main)",
  };
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function NewCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (params as any)?.slug as string;

  // Query params for appointment context
  const appointmentId = searchParams.get("appointment_id") ?? "";
  const appointmentDateParam = searchParams.get("date") ?? "";

  const [businessCategory, setBusinessCategory] = useState("");
  const [businessSubcategory, setBusinessSubcategory] = useState("");

  const isVeterinaria =
    businessCategory === "veterinaria" || businessCategory === "vet";
  const isClinica = businessCategory === "clinica";

  // ─── Base fields ───────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [occupation, setOccupation] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [knownAllergies, setKnownAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [habits, setHabits] = useState("");

  // ─── Date field ────────────────────────────────────────────────
  // If appointment_id is present → date locked (from query param or appointment fetch)
  const [appointmentDate, setAppointmentDate] = useState(appointmentDateParam);
  const [attendanceDate, setAttendanceDate] = useState(todayISO());

  // ─── Subcategory conditional fields ────────────────────────────
  const [treatmentZone, setTreatmentZone] = useState("");
  const [intakeDiagnosis, setIntakeDiagnosis] = useState("");
  const [consultReason, setConsultReason] = useState("");
  const [relevantHistory, setRelevantHistory] = useState("");
  const [dentalHistory, setDentalHistory] = useState("");
  const [anesthesiaAllergy, setAnesthesiaAllergy] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState("");

  // ─── Pet fields (vet only) ──────────────────────────────────────
  const [petName, setPetName] = useState("");
  const [petSpeciesBase, setPetSpeciesBase] = useState("perro");
  const [petSpeciesCustom, setPetSpeciesCustom] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petSex, setPetSex] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petSterilized, setPetSterilized] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    apiFetch(`${BACKEND_URL}/public/business/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const b = data?.business;
        if (b) {
          setBusinessCategory(
            String(b.business_category || "").trim().toLowerCase()
          );
          setBusinessSubcategory(
            String(b.business_subcategory || "").trim().toLowerCase()
          );
        }
      })
      .catch(() => {});
  }, [slug]);

  // If appointment_id present but no date in query params, try to fetch the date
  useEffect(() => {
    if (!appointmentId || appointmentDateParam) return;
    apiFetch(`${BACKEND_URL}/appointments/by-range/${slug}?from=2020-01-01&to=2099-12-31`)
      .then((r) => r.json())
      .then((data) => {
        const found = Array.isArray(data?.appointments)
          ? data.appointments.find((a: any) => a.id === appointmentId)
          : null;
        if (found?.start_at) {
          setAppointmentDate(found.start_at.split("T")[0]);
        }
      })
      .catch(() => {});
  }, [appointmentId, appointmentDateParam, slug]);

  // Build intake_notes from subcategory fields
  const intakeNotesValue = useMemo(() => {
    const parts: string[] = [];
    if (treatmentZone) parts.push(`Zona de tratamiento: ${treatmentZone}`);
    if (intakeDiagnosis) parts.push(`Diagnóstico de ingreso: ${intakeDiagnosis}`);
    if (consultReason) parts.push(`Motivo de consulta: ${consultReason}`);
    if (relevantHistory) parts.push(`Antecedentes: ${relevantHistory}`);
    if (dentalHistory) parts.push(`Antecedentes dentales: ${dentalHistory}`);
    if (anesthesiaAllergy)
      parts.push(`Alergias a anestesia: ${anesthesiaAllergy}`);
    if (weight) parts.push(`Peso: ${weight} kg`);
    if (height) parts.push(`Talla: ${height} cm`);
    if (goal) parts.push(`Objetivo: ${goal}`);
    return parts.join("\n");
  }, [
    treatmentZone,
    intakeDiagnosis,
    consultReason,
    relevantHistory,
    dentalHistory,
    anesthesiaAllergy,
    weight,
    height,
    goal,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (isVeterinaria && petName.trim() && petSpeciesBase === "otro" && !petSpeciesCustom.trim()) {
      setError("Indica la especie del paciente.");
      return;
    }

    try {
      setSaving(true);

      const res = await apiFetch(`${BACKEND_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          rut: rut.trim() || null,
          birth_date: birthDate || null,
          sex: sex || null,
          occupation: occupation.trim() || null,
          health_insurance: healthInsurance || null,
          emergency_contact_name: emergencyContactName.trim() || null,
          emergency_contact_phone: emergencyContactPhone.trim() || null,
          known_allergies: knownAllergies.trim() || null,
          chronic_conditions: chronicConditions.trim() || null,
          family_history: familyHistory.trim() || null,
          habits: habits.trim() || null,
          intake_notes: intakeNotesValue || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando paciente");

      const customerId: string = data.customer.id;

      if (isVeterinaria && petName.trim()) {
        await apiFetch(`${BACKEND_URL}/pets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            customer_id: customerId,
            name: petName.trim(),
            species_base: petSpeciesBase,
            species_custom: petSpeciesCustom.trim() || null,
            breed: petBreed.trim() || null,
            sex: petSex || null,
            weight_kg: petWeight ? Number(petWeight) : null,
            is_sterilized: petSterilized,
          }),
        });
      }

      router.push(`/dashboard/${slug}/customers/${customerId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error guardando ficha");
    } finally {
      setSaving(false);
    }
  }

  const sectionCard = "rounded-2xl border p-4 sm:p-5 space-y-4";
  const sectionCardStyle = {
    borderColor: "var(--border-color)",
    background: "var(--bg-card)",
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {isVeterinaria || isClinica ? "Pacientes" : "Clientes"}
        </p>
        <h1
          className="mt-1 text-2xl font-bold"
          style={{ color: "var(--text-main)" }}
        >
          Nueva ficha{isVeterinaria ? " de paciente" : ""}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Completa los datos del{" "}
          {isVeterinaria ? "tutor y su mascota" : "paciente"}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─── FECHA DE ATENCIÓN ─── */}
        <div className={sectionCard} style={sectionCardStyle}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
            Fecha de atención
          </h2>
          {appointmentId ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Fecha de la cita
              </p>
              <p
                className="rounded-xl border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                  opacity: 0.75,
                }}
              >
                {appointmentDate ? formatDate(appointmentDate) : "Cargando…"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Fecha asociada a la cita vinculada.
              </p>
            </div>
          ) : (
            <Field label="Fecha">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </Field>
          )}
        </div>

        {/* ─── SECCIÓN BASE ─── */}
        <div className={sectionCard} style={sectionCardStyle}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
            {isVeterinaria ? "Datos del tutor" : "Datos del paciente"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre y Apellido *">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y Apellido"
                required
              />
            </Field>

            <Field label="Teléfono">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                type="tel"
              />
            </Field>

            <Field label="Email">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </Field>

            <Field label="RUT">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="12.345.678-9"
              />
            </Field>

            <Field label="Fecha de nacimiento">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                type="date"
              />
            </Field>

            <Field label="Sexo">
              <select
                className={INPUT_CLASS}
                style={inputStyle()}
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">Sin especificar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </Field>

            <Field label="Ocupación">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="ej. profesora"
              />
            </Field>

            <Field label="Previsión de salud">
              <select
                className={INPUT_CLASS}
                style={inputStyle()}
                value={healthInsurance}
                onChange={(e) => setHealthInsurance(e.target.value)}
              >
                <option value="">Sin especificar</option>
                <option value="Fonasa">Fonasa</option>
                <option value="Isapre">Isapre</option>
                <option value="Capredena">Capredena</option>
                <option value="Dipreca">Dipreca</option>
                <option value="Particular / Ninguna">Particular / Ninguna</option>
              </select>
            </Field>

            {/* Contacto de emergencia — misma fila */}
            <Field label="Contacto de emergencia — Nombre y Apellido">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="ej. María González"
              />
            </Field>

            <Field label="Contacto de emergencia — teléfono">
              <input
                className={INPUT_CLASS}
                style={inputStyle()}
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+56 9 8765 4321"
                type="tel"
              />
            </Field>
          </div>

          {/* Textareas en columna completa */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alergias conocidas">
              <textarea
                className={TEXTAREA_CLASS}
                style={inputStyle()}
                value={knownAllergies}
                onChange={(e) => setKnownAllergies(e.target.value)}
                rows={3}
                placeholder="ej. penicilina, látex…"
              />
            </Field>

            <Field label="Patologías crónicas">
              <textarea
                className={TEXTAREA_CLASS}
                style={inputStyle()}
                value={chronicConditions}
                onChange={(e) => setChronicConditions(e.target.value)}
                rows={3}
                placeholder="ej. hipertensión, diabetes…"
              />
            </Field>

            <Field label="Antecedentes familiares relevantes">
              <textarea
                className={TEXTAREA_CLASS}
                style={inputStyle()}
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                rows={3}
                placeholder="ej. diabetes materna, cáncer…"
              />
            </Field>

            <Field label="Hábitos">
              <textarea
                className={TEXTAREA_CLASS}
                style={inputStyle()}
                value={habits}
                onChange={(e) => setHabits(e.target.value)}
                rows={3}
                placeholder="ej. fumador, sedentario, alcohol ocasional…"
              />
            </Field>
          </div>
        </div>

        {/* ─── SECCIÓN REHABILITACION ─── */}
        {businessSubcategory === "rehabilitacion" ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              Rehabilitación — ingreso
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Zona de tratamiento">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={treatmentZone}
                  onChange={(e) => setTreatmentZone(e.target.value)}
                  placeholder="ej. rodilla izquierda"
                />
              </Field>
              <Field label="Diagnóstico de ingreso">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={intakeDiagnosis}
                  onChange={(e) => setIntakeDiagnosis(e.target.value)}
                  placeholder="ej. rotura de ligamento"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* ─── SECCIÓN SALUD MENTAL ─── */}
        {businessSubcategory === "salud_mental" ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              Salud mental — ingreso
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Motivo de consulta inicial">
                <textarea
                  className={TEXTAREA_CLASS}
                  style={inputStyle()}
                  value={consultReason}
                  onChange={(e) => setConsultReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo principal…"
                />
              </Field>
              <Field label="Antecedentes relevantes">
                <textarea
                  className={TEXTAREA_CLASS}
                  style={inputStyle()}
                  value={relevantHistory}
                  onChange={(e) => setRelevantHistory(e.target.value)}
                  rows={3}
                  placeholder="Historial clínico relevante…"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* ─── SECCIÓN DENTAL ─── */}
        {businessSubcategory === "dental" ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              Dental — ingreso
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Antecedentes dentales">
                <textarea
                  className={TEXTAREA_CLASS}
                  style={inputStyle()}
                  value={dentalHistory}
                  onChange={(e) => setDentalHistory(e.target.value)}
                  rows={3}
                  placeholder="Tratamientos previos, extracciones…"
                />
              </Field>
              <Field label="Alergias a anestesia">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={anesthesiaAllergy}
                  onChange={(e) => setAnesthesiaAllergy(e.target.value)}
                  placeholder="ej. lidocaína"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* ─── SECCIÓN NUTRICIÓN ─── */}
        {businessSubcategory === "nutricion" ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              Nutrición — ingreso
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Peso (kg)">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="70"
                />
              </Field>
              <Field label="Talla (cm)">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="170"
                />
              </Field>
              <Field label="Objetivo">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="ej. bajar 5 kg"
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* ─── SECCIÓN MASCOTA (vet) ─── */}
        {isVeterinaria ? (
          <div className={sectionCard} style={sectionCardStyle}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              Mascota
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Opcional — puedes agregar mascotas después desde la ficha del tutor.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la mascota">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="ej. Luna"
                />
              </Field>

              <Field label="Especie">
                <select
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={petSpeciesBase}
                  onChange={(e) => setPetSpeciesBase(e.target.value)}
                >
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>

              {petSpeciesBase === "otro" ? (
                <Field label="Especie personalizada">
                  <input
                    className={INPUT_CLASS}
                    style={inputStyle()}
                    value={petSpeciesCustom}
                    onChange={(e) => setPetSpeciesCustom(e.target.value)}
                    placeholder="ej. conejo"
                  />
                </Field>
              ) : null}

              <Field label="Raza">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  placeholder="ej. Labrador"
                />
              </Field>

              <Field label="Sexo de la mascota">
                <select
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={petSex}
                  onChange={(e) => setPetSex(e.target.value)}
                >
                  <option value="">Sin especificar</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </Field>

              <Field label="Peso (kg)">
                <input
                  className={INPUT_CLASS}
                  style={inputStyle()}
                  value={petWeight}
                  onChange={(e) => setPetWeight(e.target.value)}
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="5.2"
                />
              </Field>

              <div className="flex items-center gap-3 sm:col-span-2">
                <input
                  id="sterilized"
                  type="checkbox"
                  checked={petSterilized}
                  onChange={(e) => setPetSterilized(e.target.checked)}
                  className="h-4 w-4 rounded border accent-emerald-600"
                />
                <label
                  htmlFor="sterilized"
                  className="text-sm"
                  style={{ color: "var(--text-main)" }}
                >
                  Esterilizado/a
                </label>
              </div>
            </div>
          </div>
        ) : null}

        {/* ─── ERROR ─── */}
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        ) : null}

        {/* ─── ACCIONES ─── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${slug}/customers`)}
            className="inline-flex h-10 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition hover:shadow-sm"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-main)",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Crear ficha"}
          </button>
        </div>
      </form>
    </div>
  );
}
