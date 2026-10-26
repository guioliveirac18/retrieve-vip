// Troca o link dos anúncios de convite VIP de uma conta: cria criativo igual com o link novo e põe no anúncio.
// Uso: node trocar_link.mjs <act_id> <link_antigo_contém> <link_novo> <1|todos> <pixel_id>
// Também marca "Eventos do site" no anúncio (tracking_specs offsite_conversion com o pixel).
// Backup do criativo antigo de cada anúncio em backups/meta/troca-link-vip-<act>.json (para desfazer).
import fs from "node:fs";
const TOKEN = fs.readFileSync("C:/Users/Guilherme/retrieve/.env", "utf8").match(/^META_ACCESS_TOKEN=(.*)$/m)[1].trim();
const [act, antigo, novo, modo, pixel] = process.argv.slice(2);
if (!/^\d+$/.test(pixel || "")) throw new Error("informe o pixel_id");
const BACKUP = `C:/Users/Guilherme/retrieve/backups/meta/troca-link-vip-${act}.json`;
const limpar = (s) => JSON.stringify(s).replaceAll(TOKEN, "***");
async function api(m, r, campos = {}) {
  let url = `https://graph.facebook.com/v24.0/${r}`;
  const opt = { method: m };
  if (m === "GET") url += `?${new URLSearchParams({ ...campos, access_token: TOKEN })}`;
  else { const b = new URLSearchParams({ access_token: TOKEN }); for (const [k, v] of Object.entries(campos)) b.append(k, typeof v === "string" ? v : JSON.stringify(v)); opt.body = b; }
  const j = await (await fetch(url, opt)).json();
  if (j.error) throw new Error(`${m} ${r}: ${limpar(j.error)}`);
  return j;
}
const backup = fs.existsSync(BACKUP) ? JSON.parse(fs.readFileSync(BACKUP, "utf8")) : {};
const ads = await api("GET", `${act}/ads`, { fields: "id,name,effective_status,tracking_specs,creative{id,name,object_story_spec,degrees_of_freedom_spec,url_tags}", limit: "200",
  filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE", "IN_PROCESS", "PENDING_REVIEW"] }]) });
const alvo = ads.data.filter((a) => JSON.stringify(a.creative.object_story_spec || {}).includes(antigo));
console.log(alvo.length, "anúncios com o link antigo");
for (const a of modo === "todos" ? alvo : alvo.slice(0, 1)) {
  const spec = JSON.parse(JSON.stringify(a.creative.object_story_spec).replaceAll(JSON.stringify(antigo).slice(1, -1), "§").replace(/https?:\/\/[^"]*§[^"]*/g, novo));
  if (JSON.stringify(spec).includes(antigo)) throw new Error(`${a.name}: link antigo continua no criativo`);
  for (const k of ["video_data", "link_data"]) if (spec[k]) { delete spec[k].image_url_hash; if (spec[k].image_hash) delete spec[k].image_url; }
  backup[a.id] = { nome: a.name, criativo_antigo: a.creative.id, tracking_specs_antigo: a.tracking_specs || [] };
  const outros = (a.tracking_specs || []).filter((t) => !(t["action.type"] || []).includes("offsite_conversion"));
  const anterior = (a.tracking_specs || []).find((t) => (t["action.type"] || []).includes("offsite_conversion"));
  if (anterior) console.log("  eventos do site antes:", JSON.stringify(anterior.fb_pixel));
  fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 1));
  const campos = { name: `${a.creative.name || a.name} [link vip]`, object_story_spec: spec };
  if (a.creative.degrees_of_freedom_spec) {
    // "aprimoramentos padrão" foi descontinuado; os recursos individuais continuam no spec
    delete a.creative.degrees_of_freedom_spec.creative_features_spec?.standard_enhancements;
    campos.degrees_of_freedom_spec = a.creative.degrees_of_freedom_spec;
  }
  const cr = await api("POST", `${act}/adcreatives`, campos);
  await api("POST", a.id, { creative: { creative_id: cr.id }, tracking_specs: [{ "action.type": ["offsite_conversion"], fb_pixel: [pixel] }, ...outros] });
  const r = await api("GET", a.id, { fields: "name,effective_status,tracking_specs,creative{object_story_spec}" });
  const s = JSON.stringify(r.creative.object_story_spec);
  const ev = (r.tracking_specs || []).some((t) => (t["action.type"] || []).includes("offsite_conversion") && (t.fb_pixel || []).includes(pixel));
  console.log("OK", r.name, r.effective_status, "| link novo:", s.includes(novo), "| antigo some:", !s.includes(antigo), "| eventos do site:", ev);
}
