// imageCompression.ts
// Compresión/resize compartida para toda subida de imagen a Supabase
// Storage, aplicada server-side (Next.js API routes) antes de subir el
// buffer final. Duplicado también en imageCompression.js en el repo del
// backend (agenda-oauth) porque este frontend es un repo/deploy separado
// (Vercel) y no puede importar de acá. 3 perfiles:
//
// - avatar: foto de staff / logo del negocio.
// - campana: imágenes de campañas WhatsApp/email (no usado desde este repo
//   hoy, pero se mantiene igual al del backend por consistencia).
// - documento: comprobante de depósito / adjunto de ticket, con reducción
//   de calidad en pasos hasta quedar bajo maxBytes (o llegar al piso).
import sharp from "sharp";

export type CompressionProfile = "avatar" | "campana" | "documento";

type ProfileConfig =
  | { maxWidth: number; format: "webp"; quality: number }
  | {
      maxWidth: number;
      format: "jpeg";
      qualitySteps: number[];
      maxBytes: number;
    };

const PROFILES: Record<CompressionProfile, ProfileConfig> = {
  avatar: { maxWidth: 800, format: "webp", quality: 80 },
  campana: { maxWidth: 1600, format: "webp", quality: 83 },
  documento: {
    maxWidth: 2200,
    format: "jpeg",
    qualitySteps: [90, 85, 80, 75],
    maxBytes: 2 * 1024 * 1024,
  },
};

export interface CompressedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export async function compressImage(
  buffer: Buffer,
  profileName: CompressionProfile
): Promise<CompressedImage> {
  const profile = PROFILES[profileName];
  if (!profile) {
    throw new Error(`Perfil de compresión desconocido: ${profileName}`);
  }

  const pipeline = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: profile.maxWidth, withoutEnlargement: true });

  if (profile.format === "jpeg") {
    let out: Buffer | null = null;
    for (const quality of profile.qualitySteps) {
      out = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
      if (out.length <= profile.maxBytes) break;
    }
    return { buffer: out as Buffer, contentType: "image/jpeg", extension: "jpg" };
  }

  const out = await pipeline.webp({ quality: profile.quality }).toBuffer();
  return { buffer: out, contentType: "image/webp", extension: "webp" };
}
