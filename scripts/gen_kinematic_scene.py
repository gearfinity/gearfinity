#!/usr/bin/env python3
"""Generate a KINEMATIC configurator scene (web/scenes/cfg_*.json) from a
display-assembly .bom.json (DumpAssemblyBOM output).

Adds to the plain assembly scene (bom_to_scene.py):
  - a kin role per part:  sun | planet | ring | carrier | static
  - kinematics.stages[n]: tooth counts (nominal until real ones land) + stage axis
  - planet RE-STATIONING: in the display assembly the planet gears are PARKED
    off to the side (motion-study staging); the true planet stations are where
    the PGSB62 sleeve bearings sit (120 deg apart on the carrier circle). Each
    planet is re-placed at a bearing station with identity rotation - mesh
    phase is approximate for now (owner-approved until real tooth counts land).

Usage:
    python scripts/gen_kinematic_scene.py _all_parts/planetary_stage_core_mock_display.SLDASM.bom.json \
        --out cfg_planetary_stage_single [--planet-z 0.0]
"""
from __future__ import annotations
import argparse, json, math
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "web" / "scenes"

# GLB index, like bom_to_scene.py (per-part GLBs in web/models/ or web/parts/)
GLB = {}
for d in [REPO / "web" / "models", REPO / "web" / "parts"]:
    if d.exists():
        for p in d.glob("*.glb"):
            GLB[p.stem.lower()] = f"{d.name}/{p.name}"

NOMINAL_TEETH = {"sun": 10, "planet": 15, "ring": 40}  # placeholder; real counts later


def role_of(stem: str) -> str:
    """Map a display-assembly component file stem to its kinematic role."""
    s = stem.lower()
    if s.endswith("-sun"):
        return "sun"
    if "gear_mesh_planet" in s or "planet3" in s:
        return "planet"
    if "mock_display" in s:                      # the ring body defines the frame
        return "ring"
    if s.startswith(("pcb", "pct")):             # carrier plates
        return "carrier"
    if s.startswith(("pl", "pgsb")):             # long pins + sleeve bearings ride the carrier
        return "carrier"
    if s.startswith("ds"):                       # drive shaft turns with (drives) the sun
        return "sun"
    return "static"                              # covers, short pins, ...


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("bom")
    ap.add_argument("--out", required=True, help="scene name, e.g. cfg_planetary_stage_single")
    ap.add_argument("--planet-z", type=float, default=0.0,
                    help="assembly-frame Z (metres) for re-stationed planets")
    args = ap.parse_args()

    d = json.loads(Path(args.bom).read_text(encoding="utf-8"))
    comps = [c for c in d.get("components", []) if not c.get("suppressed")]

    # planet stations = sleeve-bearing positions, sorted by angle for stable pairing
    stations = sorted(
        ((c["transform"][9], c["transform"][10]) for c in comps
         if c["file"].upper().startswith("PGSB")),
        key=lambda xy: math.atan2(xy[1], xy[0]))

    parts, missing, planet_i = [], [], 0
    for c in comps:
        stem = c["file"].rsplit(".", 1)[0]
        role = role_of(stem)
        t = list(c["transform"])
        if role == "planet":
            if planet_i < len(stations):        # re-station parked display planets
                x, y = stations[planet_i]
                t = [1, 0, 0, 0, 1, 0, 0, 0, 1, x, y, args.planet_z]
                planet_i += 1
            else:
                print(f"warn: no free station for {c['name']} - left at parked pose")
        url = GLB.get(stem.lower(), "")
        if not url:
            missing.append(c["file"])
        parts.append({"src": c["file"], "url": url, "transform": t,
                      "kin": {"role": role, "stage": 0}})

    scene = {
        "name": args.out.removeprefix("cfg_"),
        "parts": parts,
        "kinematics": {"stages": [{"teeth": NOMINAL_TEETH,
                                   "axis": {"origin": [0, 0, 0], "dir": [0, 0, 1]}}]},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{args.out}.json"
    out.write_text(json.dumps(scene, indent=2), encoding="utf-8")
    have = len(parts) - len(missing)
    print(f"wrote {out.relative_to(REPO)}  ({have}/{len(parts)} parts have GLBs, "
          f"{planet_i} planets re-stationed)")
    if missing:
        uniq = sorted(set(missing))
        print(f"need GLB exports ({len(uniq)} unique):")
        for f in uniq:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
