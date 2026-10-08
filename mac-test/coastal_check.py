"""Live check of v0.8.0: sea-level rise, storm surge with gauge hindcast, station check, future fire/drought, cyclone scaling."""
import json, os, time, traceback
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "coastal"); os.makedirs(OUT, exist_ok=True)
from cri.modellab import hazards as H
RUNS = [("sealevel", "New York Battery", 40.70, -74.01), ("sealevel", "Galveston", 29.31, -94.79), ("sealevel", "Dhaka-Chattogram coast", 22.27, 91.80), ("sealevel", "Mumbai", 18.93, 72.83),
        ("surge", "Charleston", 32.78, -79.93), ("surge", "Norfolk", 36.95, -76.33), ("surge", "Galveston", 29.31, -94.79), ("surge", "Miami", 25.77, -80.18), ("surge", "Chattogram", 22.27, 91.80),
        ("fire", "Los Angeles", 34.05, -118.24), ("fire", "Sydney", -33.87, 151.21), ("fire", "Athens", 37.98, 23.73),
        ("drought", "London", 51.51, -0.13), ("drought", "Nairobi", -1.29, 36.82),
        ("cyclone", "Miami", 25.77, -80.18), ("cyclone", "Manila", 14.60, 120.98),
        ("rain", "London", 51.51, -0.13), ("rain", "Houston", 29.76, -95.37)]
res = []
for hz, name, la, lo in RUNS:
    t = time.time(); rec = {"hazard": hz, "site": name}
    try:
        r = H.run_generic(hz, la, lo, name, {}, None); n = r["numbers"]
        ev = n.get("evidence") or {}
        rec.update(status=r["status"], grade=ev.get("grade"), headline=[list(h) for h in r["headline"]], blocks=[b[2] for b in r["blocks"] if b[0] == "h2"],
                   skill=n.get("skill"), levels={str(k): v for k, v in (n.get("levels") or {}).items()}, crosscheck=n.get("crosscheck"), limits=[l for l in r["limitations"] if "roject" in l or "gauge" in l.lower()][:3])
        sc = n.get("scenarios")
        if isinstance(sc, dict):
            rec["scenarios_keys"] = list(sc.keys())[:6]
        if n.get("future"):
            rec["future"] = n["future"]
    except Exception as e:                                             # noqa: BLE001
        rec["error"] = f"{type(e).__name__}: {e}"; traceback.print_exc()
    rec["secs"] = round(time.time() - t, 1); res.append(rec)
    print(f'{hz:8s} {name:22s} grade={rec.get("grade")} {rec.get("status") or rec.get("error")} {rec["secs"]}s', flush=True)
    json.dump(res, open(os.path.join(OUT, "coastal-check.json"), "w"), indent=1, default=str)
print("== done")
