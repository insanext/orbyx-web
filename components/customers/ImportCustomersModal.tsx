"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";

// Importador de clientes (Excel / CSV). Toda la lectura, validación y
// detección de duplicados la hace el backend (customerImport.js): acá solo se
// muestra el resultado y se manda el mismo archivo en "vista previa" y en
// "importar" (el backend vuelve a validar todo antes de guardar).

type FieldKey =
  | "full_name"
  | "name"
  | "last_name"
  | "phone"
  | "email"
  | "rut"
  | "birth_date"
  | "notes"
  | "last_visit"
  | "visit_count";

type Mapping = Record<FieldKey, number | null>;
type DuplicateMode = "skip" | "fill_empty";

type PreviewRow = {
  row: number;
  name: string;
  phone: string;
  email: string;
  reason: string | null;
  action: string | null;
  warnings: string[];
};

type DetailList = { items: PreviewRow[]; total: number };

type PreviewResponse = {
  ok: boolean;
  file: { name: string; kind: string; size_bytes: number; row_count: number };
  fields: { key: FieldKey; label: string }[];
  columns: { index: number; label: string; sample: string[] }[];
  mapping: Mapping;
  suggested_mapping: Mapping;
  mapping_problems: string[];
  ready: boolean;
  duplicate_mode: DuplicateMode;
  summary: {
    total_rows: number;
    new_count: number;
    error_count: number;
    duplicate_file_count: number;
    duplicate_existing_count: number;
    fill_count: number;
    skipped_count: number;
    with_history_count: number;
    warning_count: number;
  } | null;
  plan_limit: { max_customers: number; current_customers: number; available: number; exceeded: boolean } | null;
  details: {
    errors: DetailList;
    duplicates_in_file: DetailList;
    duplicates_existing: DetailList;
    warnings: DetailList;
    sample_new: PreviewRow[];
  } | null;
};

type CommitResponse = {
  ok: boolean;
  import_id: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  with_history: number;
  skipped_details: {
    errors: DetailList;
    duplicates_in_file: DetailList;
    duplicates_existing: DetailList;
  };
};

type ImportHistoryItem = {
  id: string;
  file_name: string | null;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  status: "completed" | "undone";
  created_at: string;
  undone_count: number | null;
  undone_kept_count: number | null;
};

const MAX_BYTES = 5 * 1024 * 1024;

const FIELD_HELP: Partial<Record<FieldKey, string>> = {
  full_name: "Si tu archivo trae nombre y apellido juntos en una sola columna.",
  name: "Solo el nombre (si el apellido está en otra columna).",
  last_name: "El apellido, si viene en una columna aparte.",
  phone: "Celular chileno (por ejemplo 9 1234 5678 o +56 9 1234 5678).",
  email: "Correo electrónico del cliente.",
  last_visit: "Sirve para saber si el cliente es Nuevo, Activo, En riesgo o Inactivo.",
  visit_count: "Cuántas veces ha venido. Se suma a las visitas que tenga en Orbyx.",
};

const FIELD_ORDER: FieldKey[] = [
  "full_name",
  "name",
  "last_name",
  "phone",
  "email",
  "rut",
  "birth_date",
  "notes",
  "last_visit",
  "visit_count",
];

const FIELD_LABEL_FALLBACK: Record<FieldKey, string> = {
  full_name: "Nombre completo",
  name: "Nombre",
  last_name: "Apellido",
  phone: "Teléfono / celular",
  email: "Email",
  rut: "RUT",
  birth_date: "Fecha de nacimiento",
  notes: "Notas / observaciones",
  last_visit: "Última visita",
  visit_count: "Cantidad de visitas",
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    /* sin cuerpo JSON */
  }
  return fallback;
}

function Collapsible({
  title,
  count,
  tone,
  children,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  tone: "rose" | "amber" | "blue" | "slate";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  const color =
    tone === "rose"
      ? "var(--cust-rose-text)"
      : tone === "amber"
      ? "var(--cust-amber-text)"
      : tone === "blue"
      ? "var(--cust-blue-text)"
      : "var(--cust-ink)";
  return (
    <div className="border" style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold"
        style={{ color }}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <span className="flex-1">{title}</span>
        <span className="text-xs font-bold">{count}</span>
      </button>
      {open ? (
        <div className="border-t px-3 py-2" style={{ borderColor: "var(--cust-border)" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function RowList({ list, showWarnings = false }: { list: DetailList; showWarnings?: boolean }) {
  return (
    <div>
      <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1 text-xs">
        {list.items.map((r) => (
          <li key={`${r.row}-${r.name}`} style={{ color: "var(--cust-ink)" }}>
            <span className="font-semibold">Fila {r.row}</span>
            {r.name && r.name !== "(sin nombre)" ? ` · ${r.name}` : ""}
            {r.phone ? ` · ${r.phone}` : ""}
            {r.email ? ` · ${r.email}` : ""}
            {r.reason ? (
              <span className="block" style={{ color: "var(--cust-muted)" }}>
                {r.reason}
              </span>
            ) : null}
            {showWarnings
              ? r.warnings.map((w) => (
                  <span key={w} className="block" style={{ color: "var(--cust-amber-text)" }}>
                    {w}
                  </span>
                ))
              : null}
          </li>
        ))}
      </ul>
      {list.total > list.items.length ? (
        <p className="mt-2 text-xs" style={{ color: "var(--cust-muted)" }}>
          Mostrando {list.items.length} de {list.total}.
        </p>
      ) : null}
    </div>
  );
}

export default function ImportCustomersModal({
  slug,
  onClose,
  onImported,
}: {
  slug: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<"upload" | "columns" | "review" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CommitResponse | null>(null);
  const [undoResult, setUndoResult] = useState<{ deleted: number; kept: number } | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const endpoint = `${BACKEND_URL}/customers/import/${slug}`;

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiFetch(`${endpoint}/history`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory(Array.isArray(data.imports) ? data.imports : []);
    } catch {
      /* el historial es opcional */
    }
  }, [endpoint]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function requestPreview(f: File, m: Mapping | null, mode: DuplicateMode) {
    const fd = new FormData();
    fd.append("file", f);
    if (m) fd.append("mapping", JSON.stringify(m));
    fd.append("duplicate_mode", mode);
    const res = await apiFetch(`${endpoint}/preview`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await readError(res, "No pudimos revisar el archivo. Inténtalo de nuevo."));
    return (await res.json()) as PreviewResponse;
  }

  async function handleFile(selected: File | null) {
    setError("");
    if (!selected) return;

    const lower = selected.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
      setError("Este archivo no se puede importar. Guarda el archivo como .xlsx o .csv.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("El archivo pesa más de 5 MB. Divídelo en partes más pequeñas.");
      return;
    }
    if (selected.size === 0) {
      setError("El archivo está vacío.");
      return;
    }

    setBusy(true);
    try {
      const data = await requestPreview(selected, null, duplicateMode);
      setFile(selected);
      setPreview(data);
      setMapping(data.mapping);
      setAccepted(false);
      setStep("columns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos revisar el archivo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const mappingProblems = useMemo(() => {
    if (!mapping) return [];
    const problems: string[] = [];
    if (mapping.full_name === null && mapping.name === null) {
      problems.push("Falta indicar qué columna tiene el nombre del cliente.");
    }
    if (mapping.phone === null && mapping.email === null) {
      problems.push("Falta indicar qué columna tiene el teléfono o el email.");
    }
    return problems;
  }, [mapping]);

  async function goToReview() {
    if (!file || !mapping || mappingProblems.length > 0) return;
    setBusy(true);
    setError("");
    try {
      const data = await requestPreview(file, mapping, duplicateMode);
      setPreview(data);
      if (!data.ready) {
        setError(data.mapping_problems[0] || "Revisa las columnas elegidas.");
        return;
      }
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos revisar el archivo.");
    } finally {
      setBusy(false);
    }
  }

  async function changeDuplicateMode(mode: DuplicateMode) {
    setDuplicateMode(mode);
    if (!file || !mapping) return;
    setBusy(true);
    setError("");
    try {
      setPreview(await requestPreview(file, mapping, mode));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar la vista previa.");
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!file || !mapping || !accepted || !preview?.summary) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mapping", JSON.stringify(mapping));
      fd.append("duplicate_mode", duplicateMode);
      fd.append("accepted_terms", "true");
      const res = await apiFetch(`${endpoint}/commit`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await readError(res, "No se pudo completar la importación. No se guardó nada."));
      const data = (await res.json()) as CommitResponse;
      setResult(data);
      setStep("done");
      onImported();
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la importación. No se guardó nada.");
    } finally {
      setBusy(false);
    }
  }

  async function runUndo(importId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(`${endpoint}/${importId}/undo`, { method: "POST" });
      if (!res.ok) throw new Error(await readError(res, "No se pudo deshacer la importación."));
      const data = await res.json();
      setUndoResult({ deleted: Number(data.deleted || 0), kept: Number(data.kept || 0) });
      setConfirmUndo(null);
      onImported();
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo deshacer la importación.");
    } finally {
      setBusy(false);
    }
  }

  const steps: Array<{ key: typeof step; label: string }> = [
    { key: "upload", label: "Archivo" },
    { key: "columns", label: "Columnas" },
    { key: "review", label: "Revisar" },
    { key: "done", label: "Listo" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  const summary = preview?.summary;
  const importable = (summary?.new_count ?? 0) + (summary?.fill_count ?? 0);
  const blockedByLimit = Boolean(preview?.plan_limit?.exceeded);

  const buttonPrimary =
    "inline-flex h-10 items-center justify-center gap-2 rounded px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
  const buttonSecondary =
    "inline-flex h-10 items-center justify-center gap-2 rounded border px-4 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Importar clientes">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden border sm:max-w-3xl"
        style={{
          background: "var(--cust-card-bg)",
          borderColor: "var(--cust-border)",
          borderRadius: 8,
          color: "var(--cust-ink)",
        }}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--cust-border)" }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Importar clientes</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--cust-muted)" }}>
              Paso {stepIndex + 1} de {steps.length}: {steps[stepIndex].label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
            style={{ color: "var(--cust-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <div
              className="flex items-start gap-2 border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--cust-rose-solid)", background: "var(--cust-rose-tint)", color: "var(--cust-rose-text)", borderRadius: 6 }}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* ---------- PASO 1: archivo ---------- */}
          {step === "upload" ? (
            <>
              <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                Sube la lista de clientes que tienes en otro sistema de agendamiento. Aceptamos archivos de Excel
                (.xlsx) o CSV, de hasta 5 MB y 5.000 filas. Si tu archivo es .xls o .xlsm, ábrelo y guárdalo como .xlsx.
              </p>

              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-10 text-center transition hover:opacity-80"
                style={{ borderColor: "var(--cust-border)", background: "var(--cust-soft-bg)", borderRadius: 8 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (busy) return;
                  handleFile(e.dataTransfer.files?.[0] || null);
                }}
              >
                {busy ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cust-blue-solid)" }} /> : <Upload className="h-8 w-8" style={{ color: "var(--cust-blue-solid)" }} />}
                <span className="text-sm font-semibold">{busy ? "Revisando tu archivo..." : "Elige un archivo o arrástralo aquí"}</span>
                <span className="text-xs" style={{ color: "var(--cust-muted)" }}>
                  .xlsx o .csv · máximo 5 MB
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </label>

              <a
                href="/plantillas/importar-clientes-plantilla.xlsx"
                download
                className="inline-flex items-center gap-2 text-sm font-medium underline"
                style={{ color: "var(--cust-blue-text)" }}
              >
                <Download className="h-4 w-4" />
                Descargar archivo de ejemplo
              </a>

              {history.length > 0 ? (
                <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--cust-border)" }}>
                  <h3 className="text-sm font-semibold">Importaciones anteriores</h3>
                  {undoResult ? (
                    <p className="text-xs" style={{ color: "var(--cust-emerald-text)" }}>
                      Listo: se eliminaron {undoResult.deleted} {plural(undoResult.deleted, "cliente", "clientes")}
                      {undoResult.kept > 0
                        ? ` y se conservaron ${undoResult.kept} porque ya tienen citas u otros registros.`
                        : "."}
                    </p>
                  ) : null}
                  <ul className="space-y-2">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs"
                        style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{h.file_name || "Archivo"}</span>
                          <span style={{ color: "var(--cust-muted)" }}>
                            {formatDateTime(h.created_at)} · {h.created_count} {plural(h.created_count, "cliente creado", "clientes creados")}
                            {h.skipped_count > 0 ? ` · ${h.skipped_count} omitidos` : ""}
                            {h.status === "undone" ? " · deshecha" : ""}
                          </span>
                        </span>
                        {h.status === "completed" && h.created_count > 0 ? (
                          confirmUndo === h.id ? (
                            <span className="flex flex-wrap items-center gap-2">
                              <span style={{ color: "var(--cust-rose-text)" }}>
                                Se eliminarán los clientes de esta importación que aún no tengan citas.
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => runUndo(h.id)}
                                className="rounded px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                                style={{ background: "var(--cust-rose-solid)" }}
                              >
                                Sí, deshacer
                              </button>
                              <button type="button" disabled={busy} onClick={() => setConfirmUndo(null)} className="rounded border px-3 py-1.5" style={{ borderColor: "var(--cust-border)" }}>
                                Cancelar
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmUndo(h.id)}
                              className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 font-semibold"
                              style={{ borderColor: "var(--cust-rose-solid)", color: "var(--cust-rose-text)" }}
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Deshacer
                            </button>
                          )
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {/* ---------- PASO 2: columnas ---------- */}
          {step === "columns" && preview && mapping ? (
            <>
              <div className="flex items-start gap-2 text-sm" style={{ color: "var(--cust-muted)" }}>
                <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <b style={{ color: "var(--cust-ink)" }}>{preview.file.name}</b> · {preview.file.row_count.toLocaleString("es-CL")}{" "}
                  {plural(preview.file.row_count, "fila", "filas")} · {formatBytes(preview.file.size_bytes)}
                </span>
              </div>

              <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                Detectamos las columnas automáticamente. Revisa que cada dato esté en la columna correcta; lo que no elijas se
                ignora. Como mínimo necesitamos el <b>nombre</b> y el <b>teléfono o el email</b>.
              </p>

              <div className="space-y-3">
                {FIELD_ORDER.map((key) => {
                  const label = preview.fields.find((f) => f.key === key)?.label || FIELD_LABEL_FALLBACK[key];
                  const usedByOthers = new Set(
                    (Object.entries(mapping) as [FieldKey, number | null][])
                      .filter(([k, v]) => k !== key && v !== null)
                      .map(([, v]) => v as number)
                  );
                  const current = mapping[key];
                  return (
                    <div key={key} className="grid gap-1 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-3">
                      <label className="text-sm font-medium" htmlFor={`map-${key}`}>
                        {label}
                        {FIELD_HELP[key] ? (
                          <span className="block text-[11px] font-normal" style={{ color: "var(--cust-muted)" }}>
                            {FIELD_HELP[key]}
                          </span>
                        ) : null}
                      </label>
                      <select
                        id={`map-${key}`}
                        value={current === null ? "" : String(current)}
                        onChange={(e) =>
                          setMapping((prev) =>
                            prev ? { ...prev, [key]: e.target.value === "" ? null : Number(e.target.value) } : prev
                          )
                        }
                        className="w-full rounded border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: "var(--cust-border)", background: "var(--cust-soft-bg)", color: "var(--cust-ink)" }}
                      >
                        <option value="">— No usar —</option>
                        {preview.columns.map((c) => (
                          <option key={c.index} value={c.index} disabled={usedByOthers.has(c.index)}>
                            {c.label}
                            {c.sample.length > 0 ? ` (ej: ${c.sample[0]})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {mappingProblems.length > 0 ? (
                <ul
                  className="space-y-1 border px-3 py-2.5 text-sm"
                  style={{ borderColor: "var(--cust-amber-solid)", background: "var(--cust-amber-tint)", color: "var(--cust-amber-text)", borderRadius: 6 }}
                >
                  {mappingProblems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {/* ---------- PASO 3: vista previa ---------- */}
          {step === "review" && preview && summary && preview.details ? (
            <>
              <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                Esta es una vista previa: todavía no se guardó nada.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: "Se importarán", value: summary.new_count, color: "var(--cust-emerald-text)", bg: "var(--cust-emerald-tint)" },
                  { label: "Con error", value: summary.error_count, color: "var(--cust-rose-text)", bg: "var(--cust-rose-tint)" },
                  { label: "Repetidos en el archivo", value: summary.duplicate_file_count, color: "var(--cust-amber-text)", bg: "var(--cust-amber-tint)" },
                  { label: "Ya existen en Orbyx", value: summary.duplicate_existing_count, color: "var(--cust-blue-text)", bg: "var(--cust-blue-tint)" },
                ].map((c) => (
                  <div key={c.label} className="px-3 py-3" style={{ background: c.bg, borderRadius: 6 }}>
                    <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: c.color }}>
                      {c.value.toLocaleString("es-CL")}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium" style={{ color: c.color }}>
                      {c.label}
                    </p>
                  </div>
                ))}
              </div>

              {summary.with_history_count > 0 ? (
                <p className="text-xs" style={{ color: "var(--cust-muted)" }}>
                  {summary.with_history_count} {plural(summary.with_history_count, "cliente trae", "clientes traen")} fecha de última visita: se
                  clasificarán como Nuevo, Activo, En riesgo o Inactivo. Los que no traen historial quedan como Prospecto.
                </p>
              ) : (
                <p className="text-xs" style={{ color: "var(--cust-muted)" }}>
                  Ningún cliente trae fecha de última visita, así que quedarán como Prospecto hasta que tengan visitas en Orbyx.
                </p>
              )}

              {preview.plan_limit?.exceeded ? (
                <div
                  className="border px-3 py-2.5 text-sm"
                  style={{ borderColor: "var(--cust-rose-solid)", background: "var(--cust-rose-tint)", color: "var(--cust-rose-text)", borderRadius: 6 }}
                >
                  Tu plan permite hasta {preview.plan_limit.max_customers} clientes y ya tienes {preview.plan_limit.current_customers}. Solo
                  caben {preview.plan_limit.available} más. Importa menos clientes o cambia de plan.
                </div>
              ) : null}

              {/* Qué hacer con los que ya existen */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Si un cliente ya existe en Orbyx (mismo teléfono o email)</legend>
                {(
                  [
                    { value: "skip", title: "Omitir (recomendado)", help: "Se queda tal como está. No se cambia nada." },
                    {
                      value: "fill_empty",
                      title: "Completar solo datos vacíos",
                      help: "Le agregamos los datos que le falten. Nunca cambiamos lo que ya tiene.",
                    },
                  ] as Array<{ value: DuplicateMode; title: string; help: string }>
                ).map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-start gap-2.5 border px-3 py-2.5"
                    style={{
                      borderColor: duplicateMode === o.value ? "var(--cust-blue-solid)" : "var(--cust-border)",
                      background: duplicateMode === o.value ? "var(--cust-blue-tint)" : "transparent",
                      borderRadius: 6,
                    }}
                  >
                    <input
                      type="radio"
                      name="duplicate-mode"
                      className="mt-1"
                      checked={duplicateMode === o.value}
                      disabled={busy}
                      onChange={() => changeDuplicateMode(o.value)}
                    />
                    <span className="text-sm">
                      <span className="block font-medium">{o.title}</span>
                      <span className="block text-xs" style={{ color: "var(--cust-muted)" }}>
                        {o.help}
                        {o.value === "fill_empty" && summary.fill_count > 0
                          ? ` (${summary.fill_count} ${plural(summary.fill_count, "cliente se completará", "clientes se completarán")}).`
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>

              {/* Detalle */}
              <div className="space-y-2">
                <Collapsible title="Filas con error (no se importan)" count={preview.details.errors.total} tone="rose" defaultOpen>
                  <RowList list={preview.details.errors} />
                </Collapsible>
                <Collapsible title="Repetidos dentro del archivo (se importa solo el primero)" count={preview.details.duplicates_in_file.total} tone="amber">
                  <RowList list={preview.details.duplicates_in_file} />
                </Collapsible>
                <Collapsible title="Clientes que ya existen en Orbyx" count={preview.details.duplicates_existing.total} tone="blue">
                  <RowList list={preview.details.duplicates_existing} />
                </Collapsible>
                <Collapsible title="Avisos (se importan igual, con algún dato menos)" count={preview.details.warnings.total} tone="slate">
                  <RowList list={preview.details.warnings} showWarnings />
                </Collapsible>
                <Collapsible title="Ejemplo de clientes que se importarán" count={preview.details.sample_new.length} tone="slate">
                  <RowList list={{ items: preview.details.sample_new, total: preview.details.sample_new.length }} />
                </Collapsible>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>Declaro que tengo autorización para traspasar los datos de mis clientes a Orbyx.</span>
              </label>
            </>
          ) : null}

          {/* ---------- PASO 4: resultado ---------- */}
          {step === "done" && result ? (
            <>
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-10 w-10" style={{ color: "var(--cust-emerald-solid)" }} />
                <p className="text-base font-semibold">
                  {undoResult
                    ? "Importación deshecha"
                    : `Se importaron ${result.created.toLocaleString("es-CL")} ${plural(result.created, "cliente", "clientes")}${
                        result.skipped > 0 ? `, se omitieron ${result.skipped.toLocaleString("es-CL")} (ver detalle)` : ""
                      }.`}
                </p>
                {!undoResult && result.updated > 0 ? (
                  <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                    Además se completaron los datos vacíos de {result.updated} {plural(result.updated, "cliente que ya existía", "clientes que ya existían")}.
                  </p>
                ) : null}
                {undoResult ? (
                  <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                    Se eliminaron {undoResult.deleted} {plural(undoResult.deleted, "cliente", "clientes")}
                    {undoResult.kept > 0 ? ` y se conservaron ${undoResult.kept} porque ya tienen citas u otros registros.` : "."}
                  </p>
                ) : null}
              </div>

              {!undoResult ? (
                <div className="space-y-2">
                  <Collapsible title="Filas con error" count={result.skipped_details.errors.total} tone="rose">
                    <RowList list={result.skipped_details.errors} />
                  </Collapsible>
                  <Collapsible title="Repetidos dentro del archivo" count={result.skipped_details.duplicates_in_file.total} tone="amber">
                    <RowList list={result.skipped_details.duplicates_in_file} />
                  </Collapsible>
                  <Collapsible title="Ya existían en Orbyx" count={result.skipped_details.duplicates_existing.total} tone="blue">
                    <RowList list={result.skipped_details.duplicates_existing} />
                  </Collapsible>
                </div>
              ) : null}

              {!undoResult && result.created > 0 ? (
                <div className="border-t pt-4" style={{ borderColor: "var(--cust-border)" }}>
                  {confirmUndo === result.import_id ? (
                    <div className="space-y-2">
                      <p className="text-sm" style={{ color: "var(--cust-rose-text)" }}>
                        Se eliminarán los clientes creados en esta importación que aún no tengan citas. ¿Quieres continuar?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runUndo(result.import_id)}
                          className={buttonPrimary}
                          style={{ background: "var(--cust-rose-solid)" }}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                          Sí, deshacer importación
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmUndo(null)}
                          className={buttonSecondary}
                          style={{ borderColor: "var(--cust-border)" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmUndo(result.import_id)}
                      className={buttonSecondary}
                      style={{ borderColor: "var(--cust-rose-solid)", color: "var(--cust-rose-text)" }}
                    >
                      <Undo2 className="h-4 w-4" />
                      Deshacer importación
                    </button>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Pie con acciones */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-5"
          style={{ borderColor: "var(--cust-border)", background: "var(--cust-soft-bg)" }}
        >
          {step === "upload" ? (
            <>
              <span />
              <button type="button" onClick={onClose} className={buttonSecondary} style={{ borderColor: "var(--cust-border)" }}>
                Cerrar
              </button>
            </>
          ) : null}

          {step === "columns" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("upload");
                  setError("");
                }}
                className={buttonSecondary}
                style={{ borderColor: "var(--cust-border)" }}
              >
                Elegir otro archivo
              </button>
              <button
                type="button"
                disabled={busy || mappingProblems.length > 0}
                onClick={goToReview}
                className={buttonPrimary}
                style={{ background: "var(--cust-blue-solid)" }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continuar
              </button>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("columns");
                  setError("");
                }}
                className={buttonSecondary}
                style={{ borderColor: "var(--cust-border)" }}
              >
                Volver a las columnas
              </button>
              <button
                type="button"
                disabled={busy || !accepted || importable === 0 || blockedByLimit}
                onClick={runImport}
                className={buttonPrimary}
                style={{ background: "var(--cust-blue-solid)" }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importable === 0
                  ? "No hay clientes para importar"
                  : (summary?.new_count ?? 0) === 0
                  ? `Completar datos de ${(summary?.fill_count ?? 0).toLocaleString("es-CL")} ${plural(summary?.fill_count ?? 0, "cliente", "clientes")}`
                  : `Importar ${(summary?.new_count ?? 0).toLocaleString("es-CL")} ${plural(summary?.new_count ?? 0, "cliente", "clientes")}`}
              </button>
            </>
          ) : null}

          {step === "done" ? (
            <>
              <span />
              <button type="button" onClick={onClose} className={buttonPrimary} style={{ background: "var(--cust-blue-solid)" }}>
                Listo
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
