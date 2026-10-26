// Só leitura: eventos recebidos pelo pixel nas últimas horas, por nome (confirma que a Meta registrou o teste).
// Uso: node conferir_pixel.mjs <pixel_id>
import fs from "node:fs";
const token = fs.readFileSync("C:/Users/Guilherme/retrieve/.env", "utf8").match(/^META_ACCESS_TOKEN=(.*)$/m)[1].trim();
const pixel = process.argv[2];
const u = new URL(`https://graph.facebook.com/v24.0/${pixel}/stats`);
u.searchParams.set("aggregation", "event");
u.searchParams.set("start_time", String(Math.floor(Date.now() / 1000) - 6 * 3600));
u.searchParams.set("access_token", token);
const j = await (await fetch(u)).json();
if (j.error) { console.log("ERRO", j.error.message.replace(token, "[t]")); process.exit(1); }
for (const bloco of j.data || []) for (const d of bloco.data || []) console.log(bloco.start_time, d.value, d.count);
