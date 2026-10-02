"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

// Control de subida del banner de portada: recorte fijo 3:1 con zoom y
// desplazamiento (misma idea que el editor del logo, pero rectangular).
// Sube a /api/upload-business-banner y avisa la URL con onChange; el guardado
// real lo hace el formulario que lo contiene.

const OUT_W = 1500;
const OUT_H = 500;
const PREVIEW_W = 900;
const PREVIEW_H = 300;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number
) {
  // panX/panY van de -100 a 100: 0 = centrado, ±100 = borde de la imagen
  // pegado al borde del recuadro (nunca queda espacio vacío).
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const maxPanX = (dw - w) / 2;
  const maxPanY = (dh - h) / 2;
  const x = (w - dw) / 2 + (panX / 100) * maxPanX;
  const y = (h - dh) / 2 + (panY / 100) * maxPanY;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, x, y, dw, dh);
}

export default function BannerUploadField({
  value,
  tenantId,
  branchId,
  disabled,
  title = "Banner de portada",
  hint,
  onChange,
}: {
  value: string;
  tenantId: string;
  branchId?: string;
  disabled?: boolean;
  title?: string;
  hint?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function resetDraft() {
    if (draftUrl) URL.revokeObjectURL(draftUrl);
    setDraftUrl("");
    setImg(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }

  useEffect(() => {
    return () => {
      if (draftUrl) URL.revokeObjectURL(draftUrl);
    };
  }, [draftUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !img) return;
    drawCover(ctx, img, PREVIEW_W, PREVIEW_H, zoom, panX, panY);
  }, [img, zoom, panX, panY]);

  function handleFileSelected(file?: File | null) {
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato inválido. Usa JPG, PNG o WebP");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("El banner supera el máximo permitido de 5 MB");
      return;
    }

    resetDraft();
    setError("");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setDraftUrl(url);
      setImg(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("No se pudo leer la imagen");
    };
    image.src = url;
  }

  async function applyAndUpload() {
    if (!img) return;
    try {
      setUploading(true);
      setError("");

      if (!tenantId) throw new Error("No se encontró el negocio");

      const canvas = document.createElement("canvas");
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar el recorte");
      drawCover(ctx, img, OUT_W, OUT_H, zoom, panX, panY);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("No se pudo generar el banner recortado");

      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], "business-banner.jpg", { type: "image/jpeg" })
      );
      formData.append("tenant_id", tenantId);
      if (branchId) formData.append("branch_id", branchId);

      const res = await apiFetch("/api/upload-business-banner", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo subir el banner");
      if (!data.public_url) throw new Error("El upload no devolvió una URL válida");

      onChange(data.public_url);
      resetDraft();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo subir el banner");
    } finally {
      setUploading(false);
    }
  }

  const labelStyle = { color: "var(--text-muted)" } as const;
  const btnStyle = {
    borderColor: "var(--border-color)",
    background: "var(--bg-card)",
    color: "var(--text-main)",
  } as const;
  const btnClass =
    "inline-flex h-11 items-center justify-center rounded border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
        {title}
      </p>
      <p className="mt-1 text-xs leading-5" style={labelStyle}>
        {hint ||
          "Foto panorámica que se muestra arriba en tu página de reservas, detrás del logo."}
      </p>

      <div
        className="mt-3 w-full overflow-hidden rounded border"
        style={{
          aspectRatio: "3 / 1",
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        {img ? (
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="block h-full w-full"
          />
        ) : value ? (
          <img src={value} alt="Banner de portada" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs"
            style={labelStyle}
          >
            Sin banner
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFileSelected(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || !tenantId}
          className={btnClass}
          style={btnStyle}
        >
          {value ? "Cambiar banner" : "Subir banner"}
        </button>

        <button
          type="button"
          onClick={() => {
            resetDraft();
            setError("");
            onChange("");
          }}
          disabled={disabled || uploading || (!value && !img)}
          className="inline-flex h-11 items-center justify-center rounded border border-rose-300/60 bg-rose-500/10 px-5 text-sm font-medium text-rose-300 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Eliminar banner
        </button>
      </div>

      {img ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium" style={labelStyle}>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-medium" style={labelStyle}>
              Posición horizontal
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={panX}
                onChange={(e) => setPanX(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-xs font-medium" style={labelStyle}>
              Posición vertical
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={panY}
                onChange={(e) => setPanY(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applyAndUpload}
              disabled={disabled || uploading}
              className="inline-flex h-11 items-center justify-center rounded px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
            >
              {uploading ? "Guardando banner..." : "Aplicar recorte"}
            </button>
            <button
              type="button"
              onClick={resetDraft}
              disabled={uploading}
              className={btnClass}
              style={btnStyle}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-rose-300">{error}</p>
      ) : (
        <p className="mt-2 text-xs" style={labelStyle}>
          JPG, PNG o WebP. Máximo 5 MB. Se recorta en proporción 3:1.
        </p>
      )}
    </div>
  );
}
