#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  ClimRisk — GitHub Account + Pages Setup Script
#  Run this script from your "Climate Financial Risk Modelling" folder
# ═══════════════════════════════════════════════════════════════════

set -e  # stop on any error

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║     ClimRisk — GitHub Pages Publisher         ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ── STEP 1: Check prerequisites ─────────────────────────────────
echo "✔  Checking git installation..."
git --version || { echo "ERROR: git not found. Install from https://git-scm.com"; exit 1; }

echo ""
echo "📋 BEFORE YOU RUN THIS SCRIPT:"
echo ""
echo "   1. Create a GitHub account at https://github.com/signup"
echo "      Username: ClimRisk   (check availability first)"
echo "      Email:    shrinivashdkannan@gmail.com"
echo ""
echo "   2. Create a NEW repository named exactly:  climrisk.github.io"
echo "      Go to: https://github.com/new"
echo "      ✓ Name:    climrisk.github.io"
echo "      ✓ Public"
echo "      ✗ Do NOT tick 'Add README' or 'Add .gitignore'"
echo "      → Click 'Create repository'"
echo ""
echo "   3. Create a Personal Access Token:"
echo "      Go to: https://github.com/settings/tokens/new"
echo "      ✓ Name: ClimRisk deploy"
echo "      ✓ Expiration: 90 days"
echo "      ✓ Scope: tick 'repo' (full control)"
echo "      → Click 'Generate token'"
echo "      → COPY the token (looks like: ghp_xxxxxxxxxxxx)"
echo ""
read -p "   Press ENTER when all 3 steps above are done... "

# ── STEP 2: Collect credentials ─────────────────────────────────
echo ""
read -p "   Enter your GitHub username (e.g. ClimRisk): " GH_USER
read -s -p "   Paste your Personal Access Token: " GH_TOKEN
echo ""

if [ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ]; then
  echo "ERROR: Username and token are required."
  exit 1
fi

REPO_NAME="${GH_USER,,}.github.io"   # lowercase version
REMOTE_URL="https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"

# ── STEP 3: Remove stale git lock if present ─────────────────────
echo ""
echo "🔧 Cleaning up git state..."
rm -f .git/index.lock 2>/dev/null || true

# ── STEP 4: Configure git identity ──────────────────────────────
git config user.name  "ClimRisk"
git config user.email "shrinivashdkannan@gmail.com"
git branch -m main 2>/dev/null || true

# ── STEP 5: Stage all files ──────────────────────────────────────
echo "📦 Staging files..."
git add index.html CRI_Demo.html README.md CNAME .gitignore
git add climate_risk_engine/ 2>/dev/null || true

# ── STEP 6: Commit ───────────────────────────────────────────────
echo "💾 Creating initial commit..."
git commit -m "Initial release — ClimRisk CRI Engine v0.2

- ClimRisk marketing website (index.html): bold editorial design,
  lead capture, pricing, regulatory coverage, feature sections
- CRI_Demo.html: full climate risk platform (547KB, zero dependencies)
  GPS hazard engine, NGFS DCF, TCFD/IFRS S2/CSRD disclosures,
  Physical CaR, supply chain risk, data export, A-E rating system
- Python backend engine (climate_risk_engine/)
- CNAME configured for climrisk.io custom domain" 2>/dev/null || \
git commit --allow-empty -m "Re-publish ClimRisk v0.2" 2>/dev/null || true

# ── STEP 7: Push to GitHub ───────────────────────────────────────
echo "🚀 Pushing to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
git push -u origin main --force

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ✅  ALL DONE — your site is deploying now!           ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║                                                       ║"
echo "║  🌐  Website:  https://${GH_USER,,}.github.io"
echo "║  🔬  Demo:     https://${GH_USER,,}.github.io/CRI_Demo.html"
echo "║  📁  Repo:     https://github.com/${GH_USER}/${REPO_NAME}"
echo "║                                                       ║"
echo "║  ⏱  GitHub Pages takes ~2 minutes to go live.        ║"
echo "║                                                       ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  NEXT STEPS                                           ║"
echo "║                                                       ║"
echo "║  1. Enable Pages (if not auto-enabled):               ║"
echo "║     Repo → Settings → Pages                           ║"
echo "║     Source: Deploy from branch → main / (root)        ║"
echo "║                                                       ║"
echo "║  2. Custom domain (optional, ~\$12/yr):                ║"
echo "║     Register climrisk.io at Namecheap / Cloudflare    ║"
echo "║     Repo → Settings → Pages → Custom domain           ║"
echo "║     Type: climrisk.io   → Save                        ║"
echo "║     Then in your DNS: add CNAME www → climrisk.github.io"
echo "║                                                       ║"
echo "║  3. Lead capture upgrade (free):                      ║"
echo "║     Sign up at formspree.io                           ║"
echo "║     Create form → copy ID → update index.html line    ║"
echo "║     (instructions are commented inside the file)      ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
