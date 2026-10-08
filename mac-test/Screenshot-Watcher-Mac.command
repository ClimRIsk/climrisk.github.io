#!/bin/bash
# Takes window screenshots of the ClimRisk app on request (used while Claude drives the app for the LinkedIn post).
HERE="$(cd "$(dirname "$0")" && pwd)"; DIR="$HERE/../marketing"; OUT="$DIR/screenshots"; REQ="$DIR/requests"
mkdir -p "$OUT" "$REQ"; rm -f "$REQ"/*.req "$REQ"/*.ack
echo "watching $REQ (close this window to stop)"; date > "$DIR/watcher.alive"
while true; do
  for f in "$REQ"/*.req; do
    [ -e "$f" ] || continue
    n="$(basename "$f" .req)"; wid="$(cat "$f")"
    /usr/sbin/screencapture -x -o -l "$wid" "$OUT/$n.png" 2>"$REQ/$n.err"
    if [ -s "$OUT/$n.png" ]; then echo "ok $(date +%T)" > "$REQ/$n.ack"; else echo "failed: $(cat "$REQ/$n.err")" > "$REQ/$n.ack"; fi
    rm -f "$f"
  done
  sleep 1
done
