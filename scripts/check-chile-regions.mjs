// Verifica que lib/chile-regions.ts esté completo: 16 regiones, 346 comunas,
// y los conteos oficiales por región. Uso: node scripts/check-chile-regions.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/chile-regions.ts", import.meta.url), "utf8");
const start = src.indexOf("export const CHILE_REGIONS");
const end = src.indexOf("export const CHILE_REGION_NAMES");
const body = src.slice(start, end).replace(/^export const CHILE_REGIONS: ChileRegion\[\] = /, "").trim().replace(/;$/, "");
const regions = new Function(`return ${body}`)();

const EXPECTED = [4, 7, 9, 9, 15, 38, 52, 33, 30, 21, 33, 32, 12, 30, 10, 11];
let ok = regions.length === 16;
let total = 0;
regions.forEach((r, i) => {
  const dup = r.communes.length !== new Set(r.communes).size;
  const good = r.communes.length === EXPECTED[i] && !dup;
  if (!good) ok = false;
  total += r.communes.length;
  console.log(`${good ? "OK " : "ERR"} ${r.name}: ${r.communes.length} (esperado ${EXPECTED[i]})${dup ? " DUPLICADAS" : ""}`);
});
console.log(`Regiones: ${regions.length} · Comunas: ${total} (esperado 346)`);
if (total !== 346) ok = false;
process.exit(ok ? 0 : 1);
