#!/bin/bash
# Gives the local engine a CA bundle so it can reach OpenStreetMap, ESA, NASA etc. (python.org builds ship none).
HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/certs.txt"; : > "$OUT"
PY="$HOME/.climrisk/engine-venv/bin/python"
{
"$PY" -m pip install -q --upgrade certifi 2>&1 | tail -2
CA=$("$PY" -c "import certifi;print(certifi.where())")
echo "bundle: $CA"
ENVF="$HOME/.climrisk/engine.env"; touch "$ENVF"; chmod 600 "$ENVF"
grep -v '^SSL_CERT_FILE=\|^REQUESTS_CA_BUNDLE=' "$ENVF" > "$ENVF.tmp"
echo "SSL_CERT_FILE=$CA" >> "$ENVF.tmp"; echo "REQUESTS_CA_BUNDLE=$CA" >> "$ENVF.tmp"
mv "$ENVF.tmp" "$ENVF"; chmod 600 "$ENVF"
echo "engine.env keys:"; cut -d= -f1 "$ENVF"
SSL_CERT_FILE=$CA "$PY" -c "import urllib.request as u;print('osm', u.urlopen('https://overpass-api.de/api/status',timeout=20).status)" 2>&1 | tail -1
} >> "$OUT" 2>&1
echo done >> "$OUT"
