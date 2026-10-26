"""Gera uma pasta por cliente (caminho/index.html) a partir de modelo.html e clientes.json."""
import json
from pathlib import Path

RAIZ = Path(__file__).parent

def main() -> None:
    modelo = (RAIZ / "modelo.html").read_text(encoding="utf-8")
    paginas = json.loads((RAIZ / "clientes.json").read_text(encoding="utf-8"))["paginas"]
    for p in paginas:
        if not p["grupo"].startswith("https://chat.whatsapp.com/") or not p["pixel"].isdigit():
            raise SystemExit(f"dados inválidos para {p['caminho']}")
        html = (modelo.replace("{{NOME}}", p["nome"]).replace("{{PIXEL}}", p["pixel"])
                .replace("{{GRUPO}}", p["grupo"]).replace("{{CAMINHO}}", p["caminho"]))
        destino = RAIZ / p["caminho"]
        destino.mkdir(exist_ok=True)
        (destino / "index.html").write_text(html, encoding="utf-8", newline="\n")
        print("gerado", p["caminho"])

if __name__ == "__main__":
    main()
