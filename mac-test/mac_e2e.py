"""Live end-to-end check, run ON THE MAC against the real engine. Writes mac-test/e2e.json (read by Claude) and prints a readable summary."""
import json
import os
import sys
import time
import urllib.request

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:8791")
OUT = os.environ.get("E2E_OUT", os.path.dirname(os.path.abspath(__file__)))
res = {"started": time.strftime("%Y-%m-%d %H:%M:%S"), "checks": []}


def call(path, body=None, timeout=240):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def check(name, ok, detail=""):
    res["checks"].append({"name": name, "ok": bool(ok), "detail": str(detail)[:600]})
    print(("PASS " if ok else "FAIL ") + name + (" — " + str(detail)[:300] if detail else ""), flush=True)


def chat(q, wait=300):
    r = call("/resident/chat", {"session": "mac-e2e", "text": q})
    t0 = time.time()
    if r.get("job"):
        while time.time() - t0 < wait:
            j = call("/resident/job/" + r["job"])
            if j["status"] != "running":
                return {**r, "reply": j.get("reply") or j.get("error"), "blocks": j.get("blocks") or [], "job_status": j["status"], "took": round(time.time() - t0, 1)}
            time.sleep(2)
        return {**r, "job_status": "timeout", "took": round(time.time() - t0, 1)}
    return {**r, "job_status": "inline", "took": round(time.time() - t0, 1)}


try:
    sc = call("/resident/selfcheck")
    check("network: every data source reachable from this Mac", sc["ok"], sc["summary"])
    res["selfcheck"] = sc
except Exception as e:
    check("selfcheck endpoint", False, e)

try:
    kn = call("/resident/knowledge")
    res["language_model"] = kn.get("language_model")
    check("local language model detected by the engine", kn["language_model"]["available"], kn["language_model"])
except Exception as e:
    check("knowledge endpoint", False, e)

try:
    sys.path.insert(0, os.environ.get("ENGINE_SRC", ""))
    from cri.analysis.asset_intelligence import assess_asset
    t0 = time.time()
    a = assess_asset(22.2645, 91.805, "Chattogram Plant", include_visuals=True)
    d = (a.get("visual") or {}).get("dem") or {}
    check("3D terrain loads (Chattogram)", d.get("max_m", 0) - d.get("min_m", 0) > 5 and not a["data_gaps"],
          f'ground {d.get("min_m")}..{d.get("max_m")} m, elevation at site {a["terrain"].get("elevation_m")} m, gaps {a["data_gaps"]}, {round(time.time() - t0)} s')
    res["terrain"] = {"min": d.get("min_m"), "max": d.get("max_m"), "gaps": a["data_gaps"], "errors": a["errors"]}
except Exception as e:
    check("3D terrain loads (Chattogram)", False, repr(e))

for q in ["why do cyclones hit Bangladesh so hard?", "what is the difference between a storm surge and river flooding?",
          "what is CBAM and what does it mean for a cement exporter?", "and for a steel exporter?"]:
    try:
        r = chat(q)
        srcs = [b for b in r.get("blocks", []) if b.get("type") == "sources"]
        note = " ".join(b.get("text", "") for b in r.get("blocks", []) if b.get("type") == "note")
        lm = "language model" in note
        check(f"answer: {q}", r["job_status"] == "done" and srcs and "[1]" in (r.get("reply") or ""), f'{r["took"]} s · {"language model" if lm else "extractive"} · {(r.get("reply") or "")[:240]}')
        res.setdefault("answers", []).append({"q": q, "reply": r.get("reply"), "model_written": lm, "took": r["took"], "sources": [s["items"] for s in srcs]})
    except Exception as e:
        check(f"answer: {q}", False, repr(e))

try:
    r = chat("write a physical risk report for the refinery at 22.2645, 91.805", wait=420)
    files = [b for b in r.get("blocks", []) if b.get("type") == "files"]
    ok = r["job_status"] == "done" and files
    if ok:
        url = files[0]["items"][0]["url"]
        with urllib.request.urlopen(BASE + url, timeout=60) as h:
            html = h.read().decode("utf-8", "replace")
        ok = len(html) > 50000
        check("chat writes the full physical report", ok, f'{r["took"]} s · html {len(html):,} bytes · {url}')
        res["report"] = {"url": url, "bytes": len(html), "took": r["took"], "reply": r.get("reply")}
    else:
        check("chat writes the full physical report", False, r)
except Exception as e:
    check("chat writes the full physical report", False, repr(e))

res["passed"] = sum(1 for c in res["checks"] if c["ok"])
res["failed"] = sum(1 for c in res["checks"] if not c["ok"])
json.dump(res, open(os.path.join(OUT, "e2e.json"), "w"), indent=1, default=str)
print(f'\nE2E: {res["passed"]} passed, {res["failed"]} failed', flush=True)
