"""Gera uma pasta por cliente (caminho/index.html) a partir de modelo.html e clientes.json.

Cliente com "modelo": "modelo-botao.html" usa a página com botão: titulo, texto e cor obrigatórios; selo, nota,
cor_texto (texto do botão, padrão branco) e destaques [nome, de, por] opcionais (sem eles, a página fica só com título, texto e botão)."""
import json
import re
from html import escape
from pathlib import Path

RAIZ = Path(__file__).parent


def destaques(itens: list) -> str:
    if not itens:
        return ""
    linhas = "".join(
        f"<li><span>{escape(nome)}</span><span><s>{escape(de)}</s><b>{escape(por)}</b></span></li>"
        for nome, de, por in itens
    )
    return f"<ul>{linhas}</ul>\n  "


def opcional(valor: str, molde: str) -> str:
    return molde.format(escape(valor)) if valor else ""


def main() -> None:
    paginas = json.loads((RAIZ / "clientes.json").read_text(encoding="utf-8"))["paginas"]
    for p in paginas:
        if not p["grupo"].startswith("https://chat.whatsapp.com/") or not p["pixel"].isdigit():
            raise SystemExit(f"dados inválidos para {p['caminho']}")
        modelo = (RAIZ / p.get("modelo", "modelo.html")).read_text(encoding="utf-8")
        html = (modelo.replace("{{NOME}}", p["nome"]).replace("{{PIXEL}}", p["pixel"])
                .replace("{{GRUPO}}", p["grupo"]).replace("{{CAMINHO}}", p["caminho"]))
        if "modelo" in p:
            cor_texto = p.get("cor_texto", "#ffffff")
            for cor in (p.get("cor", ""), cor_texto):
                if not re.fullmatch(r"#[0-9a-fA-F]{6}", cor):
                    raise SystemExit(f"cor inválida para {p['caminho']}")
            html = html.replace("{{COR_TEXTO}}", cor_texto)
            html = (html.replace("{{TITULO}}", escape(p["titulo"])).replace("{{TEXTO}}", escape(p["texto"]))
                    .replace("{{DESTAQUES}}", destaques(p.get("destaques", []))).replace("{{COR}}", p["cor"])
                    .replace("{{SELO}}", opcional(p.get("selo", ""), '<div class="selo">{}</div>\n  '))
                    .replace("{{NOTA}}", opcional(p.get("nota", ""), '<p class="nota">{}</p>')))
        if "{{" in html:
            raise SystemExit(f"marcador sem valor em {p['caminho']}")
        destino = RAIZ / p["caminho"]
        destino.mkdir(exist_ok=True)
        (destino / "index.html").write_text(html, encoding="utf-8", newline="\n")
        print("gerado", p["caminho"])


if __name__ == "__main__":
    main()
