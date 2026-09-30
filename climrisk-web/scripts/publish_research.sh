#!/usr/bin/env bash
# Publish one Research Desk article to climrisk.io.
#   bash climrisk-web/scripts/publish_research.sh <slug> [substack-url]
# Flips content/research/<slug>/meta.json to "published" (dated today), commits ONLY that
# article's files, and pushes — the GitHub Action then rebuilds and deploys climrisk.io.
set -euo pipefail
cd "$(dirname "$0")/.."                       # climrisk-web/
SLUG="${1:?usage: publish_research.sh <slug> [substack-url]}"
SUB="${2:-}"
META="content/research/$SLUG/meta.json"
[ -f "$META" ] || { echo "No article at $META"; exit 1; }
[ -f "content/research/$SLUG/article.md" ] || { echo "Missing article.md"; exit 1; }

python3 - "$META" "$SUB" <<'PY'
import json, sys, datetime
p, sub = sys.argv[1], sys.argv[2]
m = json.load(open(p))
m["status"] = "published"
m["date"] = m.get("date") or datetime.date.today().isoformat()
if sub:
    m["substack"] = sub
json.dump(m, open(p, "w"), indent=2, ensure_ascii=False)
print(f"{m['title']} → published {m['date']}")
PY

# Refuse to publish images that are not declared as real/factual in meta.json
python3 - "$META" <<'PY'
import json, sys
m = json.load(open(sys.argv[1]))
imgs = m.get("images", [])
bad = [i["file"] for i in imgs if i.get("kind") not in ("chart", "satellite", "map", "table", "photo", "infographic")]
missing = [i["file"] for i in imgs if not i.get("source")]
if bad or missing:
    sys.exit(f"Image provenance incomplete — kind: {bad}, source: {missing}")
PY

cd ..                                           # repo root
git add "climrisk-web/content/research/$SLUG" "climrisk-web/public/research/$SLUG"
git commit -m "Research: $SLUG"
git push
echo "Pushed. climrisk.io/research/$SLUG/ is live in ~2 minutes (GitHub Actions)."
