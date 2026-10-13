// Humo del frontend: `next start` sobre el build actual + rutas representativas
// + lib/imageCompression.ts (sharp) con un JPG y un PNG.
// Requiere un build previo (con NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// ficticios para que el middleware pueda arrancar localmente):
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npm run build
//   node scripts/smoke-web.js baseline-web         (ANTES de actualizar)
//   node scripts/smoke-web.js after-next           (compara contra baseline-web)
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const WEB = path.join(__dirname, "..").split(path.sep).join("/");
const LABEL = process.argv[2] || "run-web";
const SNAP_DIR = path.join(os.tmpdir(), "orbyx-smoke-snapshots");
fs.mkdirSync(SNAP_DIR, { recursive: true });
const PORT = 3101;

const results = {};
let fails = 0;
const ok = (c, label, extra = "") => {
  if (!c) fails++;
  console.log(`W| ${c ? "OK  " : "FAIL"} ${label} ${extra}`);
};

async function waitReady(proc) {
  return new Promise((resolve, reject) => {
    let out = "";
    const t = setTimeout(() => reject(new Error("next start no arrancó en 60s:\n" + out.slice(-800))), 60000);
    const onData = (d) => {
      out += d.toString();
      if (/Ready in|started server|Local:/.test(out)) {
        clearTimeout(t);
        resolve(out);
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (code) => reject(new Error(`next start terminó con código ${code}\n${out.slice(-800)}`)));
  });
}

async function main() {
  // ---- sharp desde TypeScript (lib/imageCompression.ts), con type-stripping de Node
  console.log("== sharp (orbyx-web/lib/imageCompression.ts)");
  const sharp = require(WEB + "/node_modules/sharp");
  results["sharp.version"] = sharp.versions.sharp;
  const mod = await import("file:///" + WEB + "/lib/imageCompression.ts");
  const compress = mod.compressImage;
  const raw = (w, h, c, hole) => {
    const b = Buffer.alloc(w * h * c);
    let s = 987;
    for (let i = 0; i < b.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; b[i] = (s >> 16) & 0xff; }
    if (hole && c === 4) for (let i = 0; i < w * h; i++) b[i * 4 + 3] = i % w < w / 2 ? 0 : 255;
    return b;
  };
  const jpg = await sharp(raw(3000, 2000, 3), { raw: { width: 3000, height: 2000, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  const png = await sharp(raw(1200, 800, 4, true), { raw: { width: 1200, height: 800, channels: 4 } }).png().toBuffer();
  for (const [label, buf] of [["jpg", jpg], ["png", png]]) {
    for (const profile of ["avatar", "campana", "documento"]) {
      const out = await compress(buf, profile);
      const meta = await sharp(out.buffer).metadata();
      results[`sharp.${label}.${profile}`] = {
        format: meta.format, width: meta.width, height: meta.height, hasAlpha: !!meta.hasAlpha,
        contentType: out.contentType, extension: out.extension, bytes: out.buffer.length,
      };
      ok(["webp", "jpeg"].includes(meta.format), `sharp ${label}→${profile}`, `${meta.format} ${meta.width}x${meta.height} ${out.buffer.length}B`);
    }
  }
  ok(results["sharp.png.avatar"].hasAlpha === true, "PNG con transparencia conserva alfa (webp)");

  // ---- next start
  console.log("== next start (build de producción)");
  const proc = spawn(process.execPath, [WEB + "/node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    cwd: WEB,
    env: { ...process.env, NODE_ENV: "production" },
  });
  try {
    await waitReady(proc);
    const BASE = `http://127.0.0.1:${PORT}`;
    const paths = [
      "/", "/login", "/signup", "/planes", "/planes/comparar", "/terminos", "/privacidad", "/nosotros",
      "/recuperar-password", "/checkout-premium", "/welcome",
      "/dashboard/demo", "/dashboard/demo/customers", "/admin", "/admin/tenants",
      "/manifest.webmanifest", "/apple-icon.png", "/icon.png",
      "/plantillas/importar-clientes-plantilla.xlsx",
      "/cancel/00000000-0000-0000-0000-000000000000",
      "/ruta-que-no-existe-xyz",
    ];
    for (const p of paths) {
      const res = await fetch(BASE + p, { redirect: "manual" });
      const body = await res.arrayBuffer();
      results[`GET ${p}`] = {
        status: res.status,
        location: res.headers.get("location"),
        contentType: (res.headers.get("content-type") || "").split(";")[0],
        hasBody: body.byteLength > 0,
      };
      console.log(`W| info GET ${p} → ${res.status} ${res.headers.get("location") || ""} ${results[`GET ${p}`].contentType}`);
    }
    ok(results["GET /dashboard/demo"].status >= 300 && results["GET /dashboard/demo"].status < 400 && /\/login/.test(results["GET /dashboard/demo"].location || ""), "middleware: /dashboard sin sesión redirige a /login");
    ok(results["GET /admin"].status >= 300 && results["GET /admin"].status < 400, "middleware: /admin sin sesión redirige");
    ok(results["GET /login"].status === 200 && results["GET /planes"].status === 200, "páginas públicas 200");
    ok(results["GET /plantillas/importar-clientes-plantilla.xlsx"].status === 200, "plantilla estática 200");

    // API route con validación previa (sin credenciales de Supabase en este entorno)
    const fd = new FormData();
    fd.append("file", new Blob([Buffer.from("no es imagen")], { type: "text/plain" }), "x.txt");
    const up = await fetch(BASE + "/api/upload-business-logo", { method: "POST", body: fd });
    results["POST /api/upload-business-logo (txt)"] = { status: up.status };
    console.log(`W| info POST /api/upload-business-logo (txt) → ${up.status}`);
  } finally {
    proc.kill();
  }

  const snapFile = path.join(SNAP_DIR, `${LABEL}.json`);
  fs.writeFileSync(snapFile, JSON.stringify(results, null, 2));
  const basePath = path.join(SNAP_DIR, "baseline-web.json");
  if (LABEL !== "baseline-web" && fs.existsSync(basePath)) {
    const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
    const norm = (v) => JSON.stringify(v, (k, x) => (k === "bytes" ? undefined : x));
    const diffs = [];
    for (const key of new Set([...Object.keys(base), ...Object.keys(results)])) {
      if (key === "sharp.version") continue;
      if (norm(base[key]) !== norm(results[key])) diffs.push(`${key}: ${norm(base[key])} → ${norm(results[key])}`);
      if (base[key]?.bytes && results[key]?.bytes) {
        const ratio = results[key].bytes / base[key].bytes;
        if (ratio < 0.9 || ratio > 1.1) diffs.push(`${key}.bytes: ${base[key].bytes} → ${results[key].bytes}`);
      }
    }
    console.log(diffs.length === 0 ? "COMPARACIÓN vs baseline-web: SIN DIFERENCIAS" : "COMPARACIÓN vs baseline-web: DIFERENCIAS\n  " + diffs.join("\n  "));
    if (diffs.length) fails++;
  }
  console.log(fails === 0 ? "\nRESULTADO WEB: TODO OK" : `\nRESULTADO WEB: ${fails} FALLAS`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error("ERROR", e.message);
  process.exit(1);
});
