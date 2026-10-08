"""Live check of the insurer view on real hazard data: six sites, terms, reinsurance, SSP2-4.5 2050; plus a cross-check of one site's
ground-up average annual damage against the Risk Analyst's own physical loss simulation."""
import json, os, sys, time
from cri import insurance as I
from cri.finance.analyst import analyse_asset

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "insurance"); os.makedirs(OUT, exist_ok=True)
SITES = [
 {"name": "Plant A, Chattogram", "lat": 22.2645, "lon": 91.805, "tiv_usd": 250e6, "deductible_pct": 2, "sector": "cement"},
 {"name": "Port terminal, Chattogram", "lat": 22.31, "lon": 91.80, "tiv_usd": 120e6, "deductible_pct": 2, "sector": "logistics"},
 {"name": "Refinery, Houston", "lat": 29.72, "lon": -95.24, "tiv_usd": 400e6, "deductible_pct": 5, "sector": "refining"},
 {"name": "Warehouse, Manila", "lat": 14.60, "lon": 120.98, "tiv_usd": 60e6, "deductible_pct": 3, "sector": "logistics"},
 {"name": "Plant, Rotterdam", "lat": 51.90, "lon": 4.30, "tiv_usd": 180e6, "deductible_pct": 1, "sector": "chemicals"},
 {"name": "Plant, Kolkata", "lat": 22.55, "lon": 88.35, "tiv_usd": 90e6, "deductible_pct": 2, "sector": "steel"}]
ok = True
def check(c, msg):
    global ok
    print(("PASS " if c else "FAIL ") + msg); ok = ok and c

t0 = time.time()
r = I.run(SITES, n_years=8000, reinsurance_program={"quota_share_pct": 10, "xl": [{"attach": 20e6, "limit": 60e6, "reinstatements": 1}]},
          climate={"ssp": "ssp245", "year": 2050, "band": "median"})
json.dump(r, open(os.path.join(OUT, "result.json"), "w"), indent=1, default=float)
g = r["stats"]["gross"]
print(f"run {time.time()-t0:.0f}s  TIV ${r['tiv']/1e6:.0f}m  AAL ${g['aal']/1e6:.2f}m  1-in-100 OEP ${next(x for x in g['rows'] if x['rp']==100)['oep']/1e6:.1f}m  premium ${r['premium']['technical_total']/1e6:.2f}m")
for s in r["sites"]:
    print(f"  {s['name']:28s} AAL ${s['aal']/1e6:6.2f}m rate {s['rate_permille']:7.2f}‰ wind ${s['aal_wind']/1e6:5.2f}m river ${s['aal_river']/1e6:5.2f}m coast ${s['aal_coast']/1e6:5.2f}m  maps river={s['hazard']['river_map']} coast={s['hazard']['coast_map']}  {'; '.join(s['notes'])[:90]}")
c = r["climate"]; print(f"climate SSP2-4.5 2050: AAL {c['aal']['change_pct']:+.1f}%  1-in-100 occ {c['tail']['oep100']['change_pct']:+.1f}%")
for s in c["per_site"]: print(f"  {s['name']:28s} {s['change_pct'] if s['change_pct'] is None else round(s['change_pct'],1)}%  {s['climate'].get('why','') if not s['climate'].get('ok') else 'wind x%.3f river x%.2f sea +%.2f m' % (s['climate']['wind_scale'], s['climate']['river_depth_factor'], s['climate']['sea_add_m'])}")
by = {s["name"]: s for s in r["sites"]}
check(g["aal"] > 0 and all(x["aep"] >= 0 for x in g["rows"]), "AAL positive")
check(next(x for x in g["rows"] if x["rp"] == 100)["oep"] > g["aal"], "1-in-100 occurrence above AAL")
check(by["Refinery, Houston"]["aal_wind"] > by["Plant, Rotterdam"]["aal_wind"], "Houston wind loss above Rotterdam")
check(by["Plant A, Chattogram"]["aal"] > 0 and by["Plant, Rotterdam"]["aal_river"] <= by["Plant A, Chattogram"]["aal_river"] + by["Plant A, Chattogram"]["aal_coast"] + 1, "Rotterdam flood loss not above Chattogram (defences)")
check(c["aal"]["change"] > -1e-6, "climate does not reduce AAL")
check(r["stats"]["net"]["aal"] < g["aal"], "reinsurance lowers net AAL")

# cross-check one site against the Risk Analyst (same hazards, its own simulation)
s0 = SITES[0]
one = I.run([dict(s0, deductible_pct=0)], n_years=20000)
ours = 100 * one["stats"]["ground_up"]["aal"] / s0["tiv_usd"]
an = analyse_asset(s0["lat"], s0["lon"], name=s0["name"], sector="cement", value_usd=s0["tiv_usd"], n=6000)
eng = an["financial"]["physical"]["aal_pct"]
print(f"cross-check ground-up AAL % of value: insurer view {ours:.3f}  Risk Analyst {eng:.3f}")
check(abs(ours - eng) <= 0.25 * max(eng, 0.02) + 0.02, "ground-up AAL agrees with the Risk Analyst within 25%")
print("ALL PASS" if ok else "SOME CHECKS FAILED"); sys.exit(0 if ok else 1)
