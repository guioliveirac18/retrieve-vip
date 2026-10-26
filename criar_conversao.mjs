// Cria a conversão personalizada "Convite Grupo VIP" (evento ConviteGrupoVIP) no pixel do cliente, se ainda não existir,
// para o evento virar coluna no Gerenciador de Anúncios. Uso: node criar_conversao.mjs <act_id> <pixel_id>
import fs from "node:fs";
const TOKEN = fs.readFileSync("C:/Users/Guilherme/retrieve/.env", "utf8").match(/^META_ACCESS_TOKEN=(.*)$/m)[1].trim();
const [act, pixel] = process.argv.slice(2);
if (!/^act_\d+$/.test(act || "") || !/^\d+$/.test(pixel || "")) throw new Error("uso: node criar_conversao.mjs <act_id> <pixel_id>");
const NOME = "Convite Grupo VIP";
async function api(m, r, campos = {}) {
  const u = new URL(`https://graph.facebook.com/v24.0/${r}`);
  const opt = { method: m };
  if (m === "GET") u.search = new URLSearchParams({ ...campos, access_token: TOKEN });
  else opt.body = new URLSearchParams({ ...campos, access_token: TOKEN });
  const j = await (await fetch(u, opt)).json();
  if (j.error) throw new Error(`${m} ${r}: ${JSON.stringify(j.error).replaceAll(TOKEN, "***")}`);
  return j;
}
const campos = "id,name,rule,custom_event_type,pixel{id},is_archived";
const existentes = (await api("GET", `${act}/customconversions`, { fields: campos, limit: "200" })).data;
let cc = existentes.find((c) => c.pixel?.id === pixel && (c.rule || "").includes("ConviteGrupoVIP") && !c.is_archived);
if (cc) console.log("já existe", cc.id);
else {
  const r = await api("POST", `${act}/customconversions`, { name: NOME, event_source_id: pixel, custom_event_type: "OTHER",
    rule: JSON.stringify({ and: [{ event: { eq: "ConviteGrupoVIP" } }, { or: [{ URL: { i_contains: "vip.assessoriaretrieve.com.br" } }] }] }) });
  cc = await api("GET", r.id, { fields: campos });
}
console.log("OK", cc.id, "|", cc.name, "|", cc.custom_event_type, "| pixel", cc.pixel?.id, "| regra", cc.rule);
