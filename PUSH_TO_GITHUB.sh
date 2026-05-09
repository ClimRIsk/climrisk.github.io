#!/bin/bash
# ClimRisk — Push website files to GitHub Pages
# Usage: TOKEN=your_github_token bash PUSH_TO_GITHUB.sh
#
# Get a token at: github.com → Settings → Developer settings
#   → Personal access tokens → Tokens (classic) → Generate new token (classic)
#   Tick the "repo" scope, generate, then run:
#   TOKEN=ghp_xxxx bash PUSH_TO_GITHUB.sh

set -e

if [ -z "$TOKEN" ]; then
  echo "❌  TOKEN is not set. Usage: TOKEN=ghp_xxxx bash PUSH_TO_GITHUB.sh"
  exit 1
fi

REPO="ClimRisk/climrisk.github.io"
DIR="$(cd "$(dirname "$0")" && pwd)"

push_file() {
  local REMOTE_PATH="$1"
  local LOCAL_PATH="$2"
  local MSG="$3"

  echo "→ Fetching current SHA for $REMOTE_PATH..."
  SHA=$(curl -s "https://api.github.com/repos/$REPO/contents/$REMOTE_PATH" \
    -H "Authorization: token $TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null)

  if [ -z "$SHA" ]; then
    echo "  (new file — will create)"
  fi

  echo "→ Pushing $REMOTE_PATH..."
  RESULT=$(python3 - <<PYEOF
import base64, json, urllib.request, urllib.error, sys

token = "$TOKEN"
sha   = "$SHA"
repo  = "$REPO"
remote_path = "$REMOTE_PATH"
local_path  = """$LOCAL_PATH"""
msg = """$MSG"""

with open(local_path, 'rb') as f:
    content = base64.b64encode(f.read()).decode()

body = {"message": msg, "content": content}
if sha:
    body["sha"] = sha   # update existing file
# omit sha to create new file

payload = json.dumps(body).encode()

req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{remote_path}",
    data=payload,
    headers={
        "Authorization": f"token {token}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
    },
    method="PUT"
)
try:
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read())
        print("OK:" + result['commit']['sha'][:8])
except urllib.error.HTTPError as e:
    print("ERR:" + e.read().decode())
    sys.exit(1)
PYEOF
)

  if [[ "$RESULT" == OK:* ]]; then
    echo "✅  $REMOTE_PATH pushed — commit ${RESULT#OK:}"
  else
    echo "❌  Push failed: $RESULT"
    exit 1
  fi
}

push_file "index.html" "$DIR/index.html" \
  "feat(validation): add model validation section — live scores, 23/28 pass, issues, DOCX download"

push_file "CRI_Demo.html" "$DIR/CRI_Demo.html" \
  "chore: sync CRI_Demo.html"

push_file "CRI_Validation_Study_v1.0.docx" "$DIR/CRI_Validation_Study_v1.0.docx" \
  "docs(validation): add CRI Validation Study v1.0 — 28 tests, live engine results 8 May 2026"

echo ""
echo "🚀  Done! GitHub Pages redeploys in ~1 min."
echo "    Hard-refresh with Cmd+Shift+R after that."
echo ""
echo "🔑  To access the engine as owner (bypass gate):"
echo "    Visit: https://climrisk.io/CRI_Demo.html?unlock=climrisk-owner"
echo "    (this only needs to be done once per browser)"
echo ""
echo "📄  Validation study will be live at:"
echo "    https://climrisk.io/CRI_Validation_Study_v1.0.docx"
