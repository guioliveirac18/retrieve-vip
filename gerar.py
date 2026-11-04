"""Gera uma pasta por cliente (caminho/index.html) a partir de modelo.html e clientes.json.

Cliente com "modelo": "modelo-botao.html" usa a página com botão (titulo, texto, destaques [nome, de, por] e cor)."""
import json
import re
from html import escape
from pathlib import Path

RAIZ = Path(__file__).parent


def destaques(itens: list) -> str:
    return "".join(
        f"<li><span>{escape(nome)}</span><span><s>{escape(de)}</s><b>{escape(por)}</b></span></li>"
        for nome, de, por in itens
    )


def main() -> None:
    paginas = json.loads((RAIZ / "clientes.json").read_text(encoding="utf-8"))["paginas"]
    for p in paginas:
        if not p["grupo"].startswith("https://chat.whatsapp.com/") or not p["pixel"].isdigit():
            raise SystemExit(f"dados inválidos para {p['caminho']}")
        modelo = (RAIZ / p.get("modelo", "modelo.html")).read_text(encoding="utf-8")
        html = (modelo.replace("{{NOME}}", p["nome"]).replace("{{PIXEL}}", p["pixel"])
                .replace("{{GRUPO}}", p["grupo"]).replace("{{CAMINHO}}", p["caminho"]))
        if "modelo" in p:
            if not re.fullmatch(r"#[0-9a-fA-F]{6}", p.get("cor", "")):
                raise SystemExit(f"cor inválida para {p['caminho']}")
            html = (html.replace("{{TITULO}}", escape(p["titulo"])).replace("{{TEXTO}}", escape(p["texto"]))
                    .replace("{{DESTAQUES}}", destaques(p.get("destaques", []))).replace("{{COR}}", p["cor"]))
        if "{{" in html:
            raise SystemExit(f"marcador sem valor em {p['caminho']}")
        destino = RAIZ / p["caminho"]
        destino.mkdir(exist_ok=True)
        (destino / "index.html").write_text(html, encoding="utf-8", newline="\n")
        print("gerado", p["caminho"])


if __name__ == "__main__":
    main()
