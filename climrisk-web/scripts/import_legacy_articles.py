"""
One-off: bring the articles already written in the "ClimRisk Research Article" work
(LinkedIn Content/) onto climrisk.io as full pages.

  content/research/<slug>/article.md + meta.json     public/research/<slug>/*.png

Run from climrisk-web/:  python3 scripts/import_legacy_articles.py
"""
import json
import re
import shutil
import subprocess
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
SRC = WEB.parent / "LinkedIn Content"
CONTENT = WEB / "content" / "research"
PUBLIC = WEB / "public" / "research"
AUTHOR = "Shrinivash D Kannan"

DOCX = {  # slug: (docx, image prefix map, meta)
    "the-productivity-tax": ("ARTICLE_HEATWAVE_PASTE_THIS.docx", "", {
        "date": "2026-08-21", "cover_src": "00_cover_image.png",
        "substack": "https://climriskresearch.substack.com/p/the-productivity-tax"}),
    "the-supply-chain-tax": ("SEA_SUPPLY_CHAIN_TAX_PASTE_THIS.docx", "", {
        "date": "2026-08-24", "cover_src": "sea_00_cover.png",
        "substack": "https://climriskresearch.substack.com/p/the-supply-chain-tax"}),
}
MD = {  # slug: (markdown, cover, infographic, date)
    "financial-anatomy-of-a-monsoon-deficit": ("india_monsoon_crfm_linkedin_article.md", None, "india_monsoon_infographic.png", "2026-08-13"),
    "financial-anatomy-of-a-super-el-nino": ("elnino_crfm_linkedin_article.md", "elnino_cover.png", "elnino_infographic.png", "2026-08-13"),
    "carlsberg-group-climate-risk": ("carlsberg_crfm_linkedin_article.md", "carlsberg_cover.png", "carlsberg_infographic.png", "2026-07-15"),
    "kering-group-climate-risk": ("kering_crfm_linkedin_article.md", "kering_cover.png", "kering_infographic.png", "2026-07-20"),
    "michelin-group-climate-risk": ("michelin_crfm_linkedin_article.md", "michelin_cover.png", "michelin_infographic.png", "2026-07-15"),
    "european-olive-oil-climate-risk": ("oliveoil_crfm_linkedin_article.md", "oliveoil_cover.png", "oliveoil_infographic.png", "2026-07-15"),
}


def copy_img(slug: str, name: str, new: str | None = None) -> str:
    d = PUBLIC / slug
    d.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC / name, d / (new or name))
    return f"/research/{slug}/{new or name}"


def write(slug: str, body: str, meta: dict) -> None:
    d = CONTENT / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / "article.md").write_text(body.strip() + "\n")
    (d / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    print(f"{slug}: {len(body.split())} words, {body.count('](/research/')} images")


def from_docx(slug, docx, _pref, m):
    md = subprocess.run(["pandoc", str(SRC / docx), "-t", "gfm", "--wrap=none"],
                        capture_output=True, text=True, check=True).stdout
    md = md.replace("\\_", "_")
    md = re.sub(r"<table>.*?</table>", "", md, flags=re.S)          # stat tables exist as images
    blocks = md.split("\n\n")
    # drop the posting instructions + masthead (the site header shows title, standfirst, author)
    start = next(i for i, b in enumerate(blocks) if b.startswith("By **"))
    body = "\n\n".join(blocks[start + 1:])

    alias = {"sea_chart1_heatstress_days.png": "sea_02_chart_heatstress_days.png",
             "sea_chart2_ilo_hours.png": "sea_03_chart_ilo_hours.png", "sea_chart3_ngfs.png": "sea_04_chart_ngfs.png"}

    def img(mo):
        name = mo.group(1).strip()
        name = alias.get(name, name)
        return f"![]({copy_img(slug, name)})" if (SRC / name).exists() else ""
    body = re.sub(r"\*\*▶ INSERT IMAGE \d+: ([^◄]+?) ◄\*\*", img, body)
    # the caption line pandoc renders in italics right after an image becomes the alt text
    body = re.sub(r"!\[\]\(([^)]+)\)\n\n\*([^*\n]+)\*", lambda mo: f"![{mo.group(2).strip()}]({mo.group(1)})", body)
    # bold "section headings" → real headings
    body = re.sub(r"^\*\*([^*\n]{6,90})\*\*$", r"## \1", body, flags=re.M)
    # callout blockquotes: keep as quotes but unbold
    body = re.sub(r"^> \*\*(.+)\*\*$", r"> \1", body, flags=re.M)
    # "SOURCE — IPCC AR6 …CHAPTER 16"Heat stress…" → bold source line, then the quote
    body = re.sub(r"^> (SOURCE — [^a-z]+?)(?=[\"“]?[A-Z][a-z])", r"> **\1**\n>\n> ", body, flags=re.M)
    meta = {"status": "published", "date": m["date"], "author": AUTHOR,
            "cover": copy_img(slug, m["cover_src"], "cover.png"), "substack": m["substack"]}
    write(slug, body, meta)


def from_md(slug, src, cover, info, date):
    t = (SRC / src).read_text()
    t = re.sub(r"^# .*\n", "", t, count=1)
    t = re.sub(r"^\*\*By .*\*\*\n", "", t, count=1, flags=re.M)
    t = t.lstrip("\n-").lstrip()
    if info and (SRC / info).exists():
        path = copy_img(slug, info, "infographic.png")
        parts = t.split("\n---\n", 1)
        t = parts[0] + f"\n\n![ClimRisk infographic]({path})\n\n---\n" + (parts[1] if len(parts) > 1 else "")
    meta = {"status": "published", "date": date, "author": AUTHOR}
    if cover and (SRC / cover).exists():
        meta["cover"] = copy_img(slug, cover, "cover.png")
    write(slug, t, meta)


if __name__ == "__main__":
    for s, a in DOCX.items():
        from_docx(s, *a)
    for s, a in MD.items():
        from_md(s, *a)
