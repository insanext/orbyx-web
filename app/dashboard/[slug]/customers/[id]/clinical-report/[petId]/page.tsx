"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

/* ── Types ── */

type Tenant = {
  name: string;
  logo_url?: string | null;
};

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type Pet = {
  id: string;
  name: string;
  species_base: string;
  species_custom?: string | null;
  breed?: string | null;
  sex?: string | null;
  weight_kg?: number | null;
  is_sterilized?: boolean;
  notes?: string | null;
};

type ClinicalNote = {
  id: string;
  pet_id: string;
  appointment_id?: string | null;
  staff_id?: string | null;
  date: string;
  control_type?: string | null;
  reason?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  observations?: string | null;
  next_control_at?: string | null;
  next_control_label?: string | null;
  created_at?: string | null;
};

/* ── Helpers ── */

function formatDateLong(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateFull(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const text = d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getPetSpeciesLabel(pet: Pet): string {
  if (pet.species_base === "otro") return pet.species_custom || "Otro";
  return pet.species_base || "—";
}

function getNoteAccentColor(controlType?: string | null): string {
  if (controlType === "Vacuna") return "#B4B2A9";
  if (controlType === "Desparasitación") return "#EF9F27";
  return "#1D9E75";
}

function getNoteBadgeStyle(
  controlType?: string | null
): { background: string; color: string } {
  if (controlType === "Vacuna")
    return { background: "#f1f5f9", color: "#64748b" };
  if (controlType === "Desparasitación")
    return { background: "#FAEEDA", color: "#854F0B" };
  return { background: "#E1F5EE", color: "#0F6E56" };
}

function getNextControlPillStyle(
  controlType?: string | null
): { background: string; color: string } {
  if (controlType === "Vacuna")
    return { background: "#f1f5f9", color: "#64748b" };
  return { background: "#E1F5EE", color: "#0F6E56" };
}

/* ── Page ── */

export default function ClinicalReportPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const customerId = params?.id as string;
  const petId = params?.petId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);

  const emissionDate = formatDateFull(new Date().toISOString());

  useEffect(() => {
    if (!slug || !customerId || !petId) return;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [tenantRes, customersRes, petsRes, notesRes] = await Promise.all([
          fetch(`${BACKEND_URL}/public/business/${slug}`),
          fetch(`${BACKEND_URL}/customers/${slug}`),
          fetch(`${BACKEND_URL}/pets/${slug}?customer_id=${customerId}`),
          fetch(
            `${BACKEND_URL}/clinical-notes/${slug}?pet_id=${petId}&limit=100`
          ),
        ]);

        const tenantData = await tenantRes.json();
        setTenant({
          name: tenantData?.business?.name || slug,
          logo_url: tenantData?.business?.logo_url || null,
        });

        const customersData = await customersRes.json();
        const found = (customersData?.customers || []).find(
          (c: Customer) => c.id === customerId
        );
        setCustomer(found || null);

        const petsData = await petsRes.json();
        const foundPet = (petsData?.pets || []).find(
          (p: Pet) => p.id === petId
        );
        setPet(foundPet || null);

        const notesData = await notesRes.json();
        const notes: ClinicalNote[] = Array.isArray(notesData?.notes)
          ? notesData.notes
          : [];
        notes.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setClinicalNotes(notes);
      } catch {
        setError("No se pudo cargar la ficha clínica. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, customerId, petId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#0F6E56",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Cargando ficha clínica...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
        }}
      >
        <p style={{ fontSize: 14, color: "#ef4444" }}>{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            fontSize: 13,
            color: "#0F6E56",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", paddingBottom: 48 }}>
      {/* ── Barra de acción (solo en pantalla) ── */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            fontSize: 13,
            color: "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 8,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#f1f5f9")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "none")
          }
        >
          ← Volver
        </button>

        <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
          {pet?.name ?? "Mascota"} — Ficha clínica
        </span>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            background: "#0F6E56",
            border: "none",
            cursor: "pointer",
            padding: "8px 18px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      {/* ── Reporte ── */}
      <div style={{ padding: "32px 16px" }}>
        <div
          className="report-container"
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header verde */}
          <div
            style={{
              background: "#0F6E56",
              padding: "22px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.55)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  marginBottom: 4,
                }}
              >
                Ficha clínica veterinaria
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {tenant?.name || slug}
              </p>
            </div>

            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt="Logo"
                style={{
                  height: 44,
                  objectFit: "contain",
                  borderRadius: 6,
                }}
              />
            ) : null}
          </div>

          {/* Barra de metadata */}
          <div
            style={{
              background: "#f8fafc",
              borderBottom: "1px solid #cbd5e1",
              padding: "9px 32px",
            }}
          >
            <span style={{ fontSize: 10, color: "#64748b" }}>
              Emitida el {emissionDate}
            </span>
          </div>

          {/* Cuerpo */}
          <div style={{ padding: "24px 32px" }}>
            {/* Grid cliente + paciente */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
                marginBottom: 24,
              }}
            >
              {/* Cliente */}
              <div>
                <p
                  style={{
                    fontSize: 9,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginBottom: 6,
                  }}
                >
                  Cliente
                </p>
                <div
                  style={{
                    borderBottom: "1px solid #cbd5e1",
                    marginBottom: 10,
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  {customer?.name || "—"}
                </p>
                <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                  {customer?.phone || "Sin teléfono"} ·{" "}
                  {customer?.email || "Sin email"}
                </p>
              </div>

              {/* Paciente */}
              <div>
                <p
                  style={{
                    fontSize: 9,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    marginBottom: 6,
                  }}
                >
                  Paciente
                </p>
                <div
                  style={{
                    borderBottom: "1px solid #cbd5e1",
                    marginBottom: 10,
                  }}
                />
                {pet ? (
                  <>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#0f172a",
                        marginBottom: 8,
                      }}
                    >
                      {pet.name}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: "#E1F5EE",
                          color: "#0F6E56",
                        }}
                      >
                        {getPetSpeciesLabel(pet)}
                      </span>

                      {(pet.sex || pet.weight_kg) ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "#f1f5f9",
                            color: "#64748b",
                          }}
                        >
                          {[
                            pet.sex,
                            pet.weight_kg ? `${pet.weight_kg} kg` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}

                      {pet.is_sterilized ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "#FAEEDA",
                            color: "#854F0B",
                          }}
                        >
                          Esterilizado
                        </span>
                      ) : null}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px 12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 9,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 2,
                          }}
                        >
                          Raza
                        </p>
                        <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                          {pet.breed || "—"}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 9,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 2,
                          }}
                        >
                          Responsable
                        </p>
                        <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                          {customer?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>
                    Mascota no encontrada
                  </p>
                )}
              </div>
            </div>

            {/* Separador */}
            <div
              style={{
                height: 2,
                background: "#e2e8f0",
                marginBottom: 24,
              }}
            />

            {/* Historial clínico */}
            <div>
              <p
                style={{
                  fontSize: 9,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  marginBottom: 6,
                }}
              >
                Historial clínico
              </p>
              <div
                style={{ borderBottom: "1px solid #cbd5e1", marginBottom: 20 }}
              />

              {clinicalNotes.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "24px 0",
                    margin: 0,
                  }}
                >
                  Sin atenciones registradas.
                </p>
              ) : (
                clinicalNotes.map((note, idx) => {
                  const isLast = idx === clinicalNotes.length - 1;
                  const accentColor = getNoteAccentColor(note.control_type);
                  const badgeStyle = getNoteBadgeStyle(note.control_type);
                  const pillStyle = getNextControlPillStyle(note.control_type);

                  return (
                    <div
                      key={note.id}
                      className="note-block"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #cbd5e1",
                        paddingBottom: isLast ? 0 : 20,
                        marginBottom: isLast ? 0 : 20,
                      }}
                    >
                      {/* Header nota */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                          marginBottom: 10,
                        }}
                      >
                        {/* Izquierda: barra + badge + motivo */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 3,
                              height: 40,
                              borderRadius: 99,
                              background: accentColor,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                padding: "2px 8px",
                                borderRadius: 99,
                                display: "inline-block",
                                marginBottom: 4,
                                ...badgeStyle,
                              }}
                            >
                              {note.control_type || "Atención"}
                            </span>
                            {note.reason ? (
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "#0f172a",
                                  margin: 0,
                                }}
                              >
                                {note.reason}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Derecha: fecha */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#334155",
                              margin: 0,
                            }}
                          >
                            {formatDateLong(note.date)}
                          </p>
                        </div>
                      </div>

                      {/* Campos clínicos */}
                      <div style={{ paddingLeft: 13 }}>
                        {(note.diagnosis || note.treatment) ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                note.diagnosis && note.treatment
                                  ? "1fr 1fr"
                                  : "1fr",
                              gap: 16,
                              marginBottom:
                                note.observations || note.next_control_at
                                  ? 10
                                  : 0,
                            }}
                          >
                            {note.diagnosis ? (
                              <div>
                                <p
                                  style={{
                                    fontSize: 9,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 3,
                                  }}
                                >
                                  Diagnóstico
                                </p>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "#334155",
                                    lineHeight: 1.5,
                                    margin: 0,
                                  }}
                                >
                                  {note.diagnosis}
                                </p>
                              </div>
                            ) : null}
                            {note.treatment ? (
                              <div>
                                <p
                                  style={{
                                    fontSize: 9,
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 3,
                                  }}
                                >
                                  Tratamiento
                                </p>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "#334155",
                                    lineHeight: 1.5,
                                    margin: 0,
                                  }}
                                >
                                  {note.treatment}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {note.observations ? (
                          <div
                            style={{
                              marginBottom: note.next_control_at ? 10 : 0,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 9,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginBottom: 3,
                              }}
                            >
                              Observaciones
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                color: "#334155",
                                lineHeight: 1.5,
                                margin: 0,
                              }}
                            >
                              {note.observations}
                            </p>
                          </div>
                        ) : null}

                        {note.next_control_at ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "4px 12px",
                              borderRadius: 99,
                              ...pillStyle,
                            }}
                          >
                            <span>📅</span>
                            <span>
                              Próximo control:{" "}
                              {formatDateLong(note.next_control_at)}
                              {note.next_control_label
                                ? ` · ${note.next_control_label}`
                                : ""}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "2px solid #e2e8f0",
                marginTop: 32,
                paddingTop: 14,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {tenant?.name || slug}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                {emissionDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .report-container { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          .note-block:last-child { border-bottom: none; }
        }
      `}</style>
    </div>
  );
}
