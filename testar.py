"""Testa uma página de convite: espera o site responder, abre num navegador de celular, registra os disparos do pixel
(facebook.com/tr) e para onde a página leva. Uso: python testar.py <caminho> [http|https]"""
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright

caminho = sys.argv[1]
esquema = sys.argv[2] if len(sys.argv) > 2 else "https"
url = f"{esquema}://vip.assessoriaretrieve.com.br/{caminho}/"

for tentativa in range(30):
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            if r.status == 200 and "fbq('init'" in r.read().decode("utf-8"):
                print(f"site no ar ({tentativa * 10}s)")
                break
    except Exception as e:
        ultimo = str(e)[:120]
    time.sleep(10)
else:
    raise SystemExit(f"site não respondeu: {ultimo}")

disparos, destinos = [], []
with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(**p.devices["iPhone 13"])
    pg = ctx.new_page()
    pg.on("request", lambda r: disparos.append(r.url) if "facebook.com/tr" in r.url else None)
    pg.on("framenavigated", lambda f: destinos.append(f.url) if f == pg.main_frame else None)
    pg.route("**/chat.whatsapp.com/**", lambda rota: rota.fulfill(status=200, body="convite"))
    pg.goto(url)
    pg.wait_for_timeout(3000)
    nav.close()

for d in disparos:
    q = dict(x.split("=", 1) for x in d.split("?", 1)[1].split("&") if "=" in x)
    print("pixel:", q.get("id"), "evento:", q.get("ev"))
print("caminho da página:", " -> ".join(dict.fromkeys(destinos)))
