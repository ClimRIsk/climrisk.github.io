"""Live check of the climate scenario -> 3D twin pipeline (v0.8.x): compose, re-run the 2D solver, compare structures now and then."""
import json, os, time, traceback
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "climate3d"); os.makedirs(OUT, exist_ok=True)
from cri import asset_twin as AT, climate_scenario as CS
SITES = [("Chattogram", 22.2645, 91.805, "cement"), ("Houston", 29.7604, -95.3698, "chemicals"), ("Rotterdam", 51.9244, 4.4777, "chemicals")]
res = []
for name, la, lo, sec in SITES:
    rec = {"site": name}; t = time.time()
    try:
        tw = AT.build_twin(la, lo, name, sector=sec, radius_m=300)
        rec["scenarios"] = [(s["id"], s["depth_m"]) for s in tw["scenarios"]["flood"]]; rec["build_s"] = round(time.time() - t)
        rec["runs"] = []
        for ssp, yr, band in (("ssp245", 2050, "median"), ("ssp585", 2070, "median"), ("ssp585", 2090, "high")):
            t = time.time(); comp = CS.compose(la, lo, ssp, yr); r = CS.apply_to_twin(tw, comp, 100, None, band)
            rec["runs"].append({"ssp": ssp, "year": yr, "band": band, "scenario": r["forcing"]["scenario_id"], "add_m": r["forcing"]["add_m"], "wind_scale": round(r["forcing"]["wind_scale"], 3), "now": r["now"], "future": r["future"], "rain_median": comp["rain"]["median"], "sea_median": (comp["sea"].get("add_m") or {}).get("median"), "secs": round(time.time() - t)})
            print(name, rec["runs"][-1], flush=True)
    except Exception as e:                                             # noqa: BLE001
        rec["error"] = f"{type(e).__name__}: {e}"; traceback.print_exc()
    res.append(rec); json.dump(res, open(os.path.join(OUT, "climate3d-check.json"), "w"), indent=1, default=str)
print("== done")
