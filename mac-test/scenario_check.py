"""Live check of v0.7.0 on real data: climate scenarios + projection backtest + evidence grade at several sites, a small portfolio screening, and the generated validation pack."""
import json, os, sys, time, traceback

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "scenario"); os.makedirs(OUT, exist_ok=True)
SITES = [("Dhaka", 23.81, 90.41), ("London", 51.51, -0.13), ("Phoenix", 33.45, -112.07), ("Singapore", 1.35, 103.82), ("Lagos", 6.52, 3.38), ("Sydney", -33.87, 151.21)]
res = {"started": time.strftime("%Y-%m-%d %H:%M:%S"), "sites": [], "portfolio": None, "pack": None}

from cri.modellab import hazards as H, portfolio as PF, validation_pack as VP

print("== 1. scenarios + backtest + grade (rain, heat)", flush=True)
for name, la, lo in SITES:
    for hz in ("rain", "heat"):
        t = time.time(); rec = {"site": name, "hazard": hz}
        try:
            r = H.run_generic(hz, la, lo, name, {}, None)
            n = r["numbers"]; sc = n.get("scenarios") or {}
            rec.update(status=r["status"], grade=(n.get("evidence") or {}).get("grade"), score=(n.get("evidence") or {}).get("score"), maxscore=(n.get("evidence") or {}).get("max"),
                       levels={str(k): v for k, v in (n.get("levels") or {}).items()}, backtest=(sc.get("backtest") or {}), scen_error=sc.get("error"), baseline=sc.get("baseline"), cell=sc.get("cell"),
                       blocks=[b[2] for b in r["blocks"] if b[0] == "h2"])
            tb = sc.get("table") or {}
            for k in ("ssp245:2040-2059", "ssp585:2080-2099"):
                if k in tb:
                    rec[k] = {"change": tb[k]["change"], "level100": tb[k]["levels"].get(100) or tb[k]["levels"].get("100")}
        except Exception as e:                                         # noqa: BLE001
            rec["error"] = f"{type(e).__name__}: {e}"; traceback.print_exc()
        rec["secs"] = round(time.time() - t, 1); res["sites"].append(rec)
        bt = rec.get("backtest") or {}
        print(f'{name:10s} {hz:5s} grade={rec.get("grade")} backtest={bt.get("verdict")} 100y={ (rec.get("levels") or {}).get("100")} 245/2050={rec.get("ssp245:2040-2059", {}).get("change", {}).get("median")} {rec["secs"]}s {rec.get("error") or rec.get("scen_error") or ""}', flush=True)

print("== 2. portfolio screening (8 assets, rain+heat)", flush=True)
t = time.time()
try:
    csv_text = "name,lat,lon,value\nDhaka plant A,23.81,90.41,5000000\nDhaka plant B,23.78,90.35,3000000\nDhaka depot,23.83,90.43,800000\nLondon office,51.51,-0.13,9000000\nLondon warehouse,51.55,-0.10,2000000\nPhoenix DC,33.45,-112.07,4000000\nSingapore terminal,1.35,103.82,7000000\nSydney store,-33.87,151.21,1500000\n"
    assets = PF.parse_assets(csv_text)
    store = os.path.join(OUT, "portfolio.jsonl")
    pr = PF.screen(assets, ("rain", "heat"), store=store, progress=lambda m: print("   ·", m, flush=True))
    head, rows = PF.table(pr); d = PF.digest(pr)
    open(os.path.join(OUT, "portfolio.csv"), "w").write(PF.to_csv(pr))
    res["portfolio"] = {"assets": len(assets), "cells": pr["cells"], "runs": pr["runs"], "reused": pr["reused"], "secs": round(time.time() - t, 1), "digest": d, "head": head, "rows": rows}
    print(f'{len(assets)} assets in {pr["cells"]} cells; {pr["runs"]} studies run; {round(time.time() - t, 1)} s', flush=True)
    for r in rows:
        print("  ", r, flush=True)
    t2 = time.time(); pr2 = PF.screen([dict(a) for a in assets], ("rain", "heat"), store=store)
    res["portfolio"]["rerun_runs"] = pr2["runs"]; res["portfolio"]["rerun_secs"] = round(time.time() - t2, 2)
    print(f're-run: {pr2["runs"]} new studies, {round(time.time() - t2, 2)} s (resumed from the store)', flush=True)
except Exception as e:                                                 # noqa: BLE001
    res["portfolio"] = {"error": f"{type(e).__name__}: {e}"}; traceback.print_exc()

print("== 3. validation pack from the world sweep", flush=True)
try:
    sw = os.path.join(HERE, "sweep", "sweep.jsonl"); cp = os.path.join(HERE, "sweep", "compare.md")
    res["pack"] = VP.build(sw, cp, os.path.join(OUT, "validation"))
    print("pack:", json.dumps({k: v for k, v in res["pack"].items() if k != "layer1"}), flush=True)
except Exception as e:                                                 # noqa: BLE001
    res["pack"] = {"error": f"{type(e).__name__}: {e}"}; traceback.print_exc()

res["finished"] = time.strftime("%Y-%m-%d %H:%M:%S")
json.dump(res, open(os.path.join(OUT, "scenario-check.json"), "w"), indent=1, default=str)
print("== done", flush=True)
