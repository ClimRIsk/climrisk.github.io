#!/usr/bin/env bash
# Publish Research Desk articles to climrisk.io (all drafts, or named slugs) — no 404s.
#   bash climrisk-web/scripts/publish_all_research.sh --check            # validate only, change nothing
#   bash climrisk-web/scripts/publish_all_research.sh                    # publish ALL drafts
#   bash climrisk-web/scripts/publish_all_research.sh slug1 slug2        # publish just these
# Steps: validate (article, meta, every image on disk + declared) -> flip status to "published"
#        -> build the static site locally (a failed build = nothing is pushed)
#        -> commit ONLY research content + images -> git push (GitHub Action deploys in ~2 min).
set -euo pipefail
cd "$(dirname "$0")/.."                      # climrisk-web/
CHECK=0; SLUGS=()
for a in "$@"; do [ "$a" = "--check" ] && CHECK=1 || SLUGS+=("$a"); done
if [ ${#SLUGS[@]} -eq 0 ]; then
  while IFS= read -r s; do SLUGS+=("$s"); done < <(python3 - <<'PY'
import json, os
d = "content/research"
for s in sorted(os.listdir(d)):
    p = os.path.join(d, s, "meta.json")
    if not s.startswith("_") and os.path.isfile(p) and json.load(open(p)).get("status") == "draft":
        print(s)
PY
)
fi
[ ${#SLUGS[@]} -gt 0 ] || { echo "No drafts to publish."; exit 0; }
echo "Articles: ${SLUGS[*]}"

# 1. validate
python3 - "${SLUGS[@]}" <<'PY'
import json, os, re, sys
bad = []
for s in sys.argv[1:]:
    base = f"content/research/{s}"
    for f in ("article.md", "meta.json"):
        if not os.path.isfile(f"{base}/{f}"): bad.append(f"{s}: missing {f}")
    if bad: continue
    m = json.load(open(f"{base}/meta.json"))
    if m.get("slug") != s: bad.append(f"{s}: meta slug is {m.get('slug')!r}")
    body = open(f"{base}/article.md").read()
    refs = set(re.findall(r"\(/research/" + re.escape(s) + r"/([^)\s]+)\)", body))
    if m.get("cover"): refs.add(m["cover"].split("/")[-1])
    for r in sorted(refs):
        if not os.path.isfile(f"public/research/{s}/{r}"): bad.append(f"{s}: image missing on disk: {r}")
    declared = {i["file"] for i in m.get("images", [])}
    for r in sorted(refs - declared - {m.get('cover','').split('/')[-1]}):
        bad.append(f"{s}: image not declared in meta.json images: {r}")
    for i in m.get("images", []):
        if not i.get("source") or i.get("kind") not in ("chart","satellite","map","table","photo","infographic"):
            bad.append(f"{s}: image provenance incomplete: {i.get('file')}")
if bad: sys.exit("VALIDATION FAILED:\n  " + "\n  ".join(bad))
print("Validation OK")
PY
[ $CHECK -eq 1 ] && { echo "--check only: nothing changed."; exit 0; }

# 2. flip to published (keeps each article's own date)
python3 - "${SLUGS[@]}" <<'PY'
import json, sys, datetime
for s in sys.argv[1:]:
    p = f"content/research/{s}/meta.json"
    m = json.load(open(p)); m["status"] = "published"
    m["date"] = m.get("date") or datetime.date.today().isoformat()
    json.dump(m, open(p, "w"), indent=2, ensure_ascii=False); print("published:", s)
PY

# 3. build locally: if this fails, nothing is pushed
[ -d node_modules ] || npm ci
npm run build
for s in "${SLUGS[@]}"; do
  [ -f "out/research/$s/index.html" ] || { echo "BUILD DID NOT PRODUCE /research/$s/ — aborting, nothing pushed"; exit 1; }
done

# 4. commit only research files, then push
cd ..
for s in "${SLUGS[@]}"; do git add "climrisk-web/content/research/$s" "climrisk-web/public/research/$s"; done
git add climrisk-web/content/research/_desk climrisk-web/scripts/publish_all_research.sh 2>/dev/null || true
git commit -m "Research: publish ${SLUGS[*]}"
git push
echo; echo "Pushed. Live in ~2 minutes (GitHub Actions) at:"
for s in "${SLUGS[@]}"; do echo "  https://climrisk.io/research/$s/"; done
