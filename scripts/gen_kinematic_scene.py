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
import argparse, json, math, struct
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "web" / "scenes"

# GLB index, like bom_to_scene.py (per-part GLBs in web/models/ or web/parts/)
GLB = {}
for d in [REPO / "web" / "models", REPO / "web" / "parts"]:
    if d.exists():
        for p in d.glob("*.glb"):
            GLB[p.stem.lower()] = f"{d.name}/{p.name}"

# REAL tooth counts, derived from the original OpenSCAD source
# (planetary_gear_stage_no_bearings.scad): np=22 -> ns=14, nr=58.
# Exact ratio 36/7 per stage. Verified: scad planet-orbit radius (27.2mm)
# matches the PGSB62 bearing stations in the .bom.json.
NOMINAL_TEETH = {"sun": 14, "planet": 22, "ring": 58}


def glb_bbox_centre(url: str):
    """Geometry bbox centre of a GLB (metres, its own frame), or None.
    Needed because display parts extracted from the core keep the CORE's
    origin - the planet body sits ~96 mm from its part origin."""
    path = REPO / "web" / url
    if not url or not path.exists():
        return None
    b = path.read_bytes()
    if struct.unpack_from("<I", b, 0)[0] != 0x46546C67:
        return None
    off, g = 12, None
    while off < len(b):
        clen, ctype = struct.unpack_from("<II", b, off)
        if ctype == 0x4E4F534A:
            g = json.loads(b[off + 8: off + 8 + clen])
            break
        off += 8 + clen
    if not g:
        return None
    lo, hi = [float("inf")] * 3, [float("-inf")] * 3
    for mesh in g.get("meshes", []):
        for prim in mesh.get("primitives", []):
            ai = prim.get("attributes", {}).get("POSITION")
            if ai is None:
                continue
            acc = g["accessors"][ai]
            for i in range(3):
                lo[i] = min(lo[i], acc["min"][i])
                hi[i] = max(hi[i], acc["max"][i])
    if lo[0] == float("inf"):
        return None
    return [(a + b) / 2 for a, b in zip(lo, hi)]


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
    if s.startswith("ds"):                       # DS<r>I* = input (sun speed); DS<r>O* = output (carrier speed)
        return "carrier" if "o" in s.split("_")[0][3:] else "sun"
    return "static"                              # covers, short pins, ...


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("bom")
    ap.add_argument("--out", required=True, help="scene name, e.g. cfg_planetary_stage_single")
    ap.add_argument("--planet-z", type=float, default=0.0,
                    help="assembly-frame Z (metres) for re-stationed planets")
    args = ap.parse_args()

    d = json.loads(Path(args.bom).read_text(encoding="utf-8"))
    # Skip sub-assembly nodes: GetComponents(False) returns them ALONGSIDE
    # their leaf parts (which carry root-space transforms), so only .SLDPRT
    # rows are scene parts. Recursion works - leaves are placed correctly.
    comps = [c for c in d.get("components", [])
             if not c.get("suppressed") and c["file"].lower().endswith(".sldprt")]

    # planet stations = sleeve-bearing positions, sorted by angle for stable pairing
    stations = sorted(
        ((c["transform"][9], c["transform"][10]) for c in comps
         if c["file"].upper().startswith("PGSB")),
        key=lambda xy: math.atan2(xy[1], xy[0]))

    # the ring defines the stage frame; its geometry mid-plane = the gear mesh Z
    ring = next((c for c in comps if role_of(c["file"].rsplit(".", 1)[0]) == "ring"), None)
    mesh_z = args.planet_z
    if ring:
        rc = glb_bbox_centre(GLB.get(ring["file"].rsplit(".", 1)[0].lower(), ""))
        if rc:
            mesh_z = rc[2] + ring["transform"][11]

    parts, missing, planet_i = [], [], 0
    for c in comps:
        stem = c["file"].rsplit(".", 1)[0]
        role = role_of(stem)
        t = list(c["transform"])
        kin = {"role": role, "stage": 0}
        if role == "planet":
            if planet_i < len(stations):        # re-station parked display planets
                x, y = stations[planet_i]
                # display planets keep the CORE's origin (body ~96 mm off its
                # part origin), so compensate by the GLB body centre: place the
                # BODY at the station, on the ring's mesh plane.
                bc = glb_bbox_centre(GLB.get(stem.lower(), "")) or [0, 0, 0]
                t = [1, 0, 0, 0, 1, 0, 0, 0, 1,
                     x - bc[0], y - bc[1], mesh_z - bc[2]]
                kin["center"] = [x, y, mesh_z]  # spin axis through the BODY, not the part origin
                planet_i += 1
            else:
                print(f"warn: no free station for {c['name']} - left at parked pose")
        url = GLB.get(stem.lower(), "")
        if not url:
            missing.append(c["file"])
        parts.append({"src": c["file"], "url": url, "transform": t, "kin": kin})

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
