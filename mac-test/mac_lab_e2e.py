"""Model Lab end-to-end on the Mac: real terrain, real rainfall record, real meteorology, the local language model. Writes lab-e2e.json and copies the reports to out/."""
import json, os, time, urllib.request

BASE = os.environ.get("E2E_BASE", "http://127.0.0.1:8793")
OUT = os.environ.get("E2E_OUT", os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(OUT, "out"), exist_ok=True)
res = {"started": time.strftime("%Y-%m-%d %H:%M:%S"), "studies": []}


def call(path, body=None, timeout=300):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def js(path, body=None, timeout=300):
    return json.loads(call(path, body, timeout))


def study(text, wait=900):
    t0 = time.time()
    r = js("/resident/chat", {"session": "lab-e2e", "text": text})
    rec = {"text": text, "intent": r.get("intent"), "first_reply": r.get("reply")[:200], "ok": False}
    if not r.get("job"):
        rec["error"] = "no job started: " + r.get("reply", "")[:200]; res["studies"].append(rec); print("FAIL", text, rec["error"], flush=True); return
    last = None
    while time.time() - t0 < wait:
        j = js("/resident/job/" + r["job"])
        if j.get("progress") != last:
            last = j.get("progress"); print("   ·", last, flush=True)
        if j["status"] != "running":
            rec["status"] = j["status"]; rec["took_s"] = round(time.time() - t0, 1)
            if j["status"] == "done":
                files = next((b for b in j["blocks"] if b["type"] == "files"), {"items": []})["items"]
                table = next((b for b in j["blocks"] if b["type"] == "table"), {"rows": []})["rows"]
                rec["table"] = table; rec["reply"] = j["reply"][:700]
                if files:
                    html = call(files[0]["url"], timeout=60)
                    name = files[0]["url"].rsplit("/", 1)[1]
                    open(os.path.join(OUT, "out", name), "wb").write(html)
                    rec["html_bytes"] = len(html); rec["file"] = name
                    rec["ok"] = len(html) > 60000
            else:
                rec["error"] = j.get("error")
            break
        time.sleep(3)
    res["studies"].append(rec)
    print(("PASS " if rec["ok"] else "FAIL ") + text + f' — {rec.get("took_s")} s · {rec.get("html_bytes")} bytes', flush=True)
    for row in rec.get("table", []):
        print("     ", " | ".join(str(c) for c in row), flush=True)


try:
    kn = js("/resident/knowledge"); res["language_model"] = kn.get("language_model"); print("language model:", kn.get("language_model"), flush=True)
except Exception as e:
    print("knowledge endpoint failed", e)
for q in ["what can the model lab do?", "build a flood model for 22.2645, 91.805", "air quality model for 28.6139, 77.2090", "build an air quality model for 23.8103, 90.4125"]:
    try:
        if q.startswith("what can"):
            r = js("/resident/chat", {"session": "lab-e2e", "text": q}); print("lab help:", r["reply"][:160], flush=True); res["help"] = r["reply"]; continue
        study(q)
    except Exception as e:
        print("FAIL", q, repr(e), flush=True); res["studies"].append({"text": q, "ok": False, "error": repr(e)})
res["passed"] = sum(1 for s in res["studies"] if s["ok"]); res["failed"] = sum(1 for s in res["studies"] if not s["ok"])
json.dump(res, open(os.path.join(OUT, "lab-e2e.json"), "w"), indent=1, default=str)
print(f'\nLAB E2E: {res["passed"]} passed, {res["failed"]} failed', flush=True)
