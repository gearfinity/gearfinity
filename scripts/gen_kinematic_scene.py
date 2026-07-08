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
    """Map a display-assembly component file stem to its kinematic role.
    'input'/'output' are resolved to sun/carrier by the drive mode."""
    s = stem.lower()
    if s.endswith("-sun"):
        return "sun"
    if "gear_mesh_planet" in s or "planet3" in s:
        return "planet"
    if "mock_display" in s:                      # the ring body defines the stage frame
        return "ring"
    if s.startswith(("pcb", "pct")):             # carrier plates
        return "carrier"
    if s.startswith(("pl", "pgsb")):             # long pins + sleeve bearings ride the carrier
        return "carrier"
    if s.startswith("css"):                      # crank shaft SLEEVE is the stationary bearing
        return "static"                          # (must precede the 'cs' input rule)
    if s.startswith(("cs", "ch")):               # crank shaft/handle/grip spin with the crank
        return "input"                           # (CP crank PLATE is static - falls through)
    if s.startswith("fp"):                       # fan prop turns at the train output speed
        return "output"
    if s.startswith("ds"):                       # DS<r>I* couples the sun; DS<r>O* the carrier
        return "carrier" if "o" in s.split("_")[0][3:] else "sun"
    return "static"                              # covers, short pins, frame, bearings, ...


def stage_rates(drive: str, n: int):
    """Exact per-stage rates (multiples of the train input speed).
    drive='sun'      reduction: sun driven, carrier out (crank module)
    drive='carrier'  speed-up:  carrier driven, sun out (fan module)
    Stages chain output -> next stage's driven member."""
    from fractions import Fraction
    Zs, Zp, Zr = (Fraction(NOMINAL_TEETH[k]) for k in ("sun", "planet", "ring"))
    R = 1 + Zr / Zs                              # 36/7 exactly
    w, out = Fraction(1), []
    for _ in range(n):
        if drive == "sun":
            sun, carrier = w, w / R
            w = carrier
        else:
            carrier, sun = w, w * R
            w = sun
        out.append({"sun": float(sun), "carrier": float(carrier),
                    "planet": float(carrier * (1 - Zr / Zp)),   # ring fixed
                    "ring": 0.0})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("bom")
    ap.add_argument("--out", required=True, help="scene name, e.g. cfg_fan_2-stage")
    ap.add_argument("--drive", choices=["sun", "carrier"], default="sun",
                    help="driven member per stage: sun=reduction (crank), carrier=speed-up (fan)")
    ap.add_argument("--reverse", action="store_true",
                    help="default spin direction is reversed (e.g. CCW fan props)")
    ap.add_argument("--planet-z", type=float, default=0.0,
                    help="fallback mesh-plane Z (metres) if the ring GLB is missing")
    args = ap.parse_args()

    d = json.loads(Path(args.bom).read_text(encoding="utf-8"))
    # Skip sub-assembly nodes: GetComponents(False) returns them ALONGSIDE
    # their leaf parts (which carry root-space transforms), so only .SLDPRT
    # rows are scene parts. Recursion works - leaves are placed correctly.
    comps = [c for c in d.get("components", [])
             if not c.get("suppressed") and c["file"].lower().endswith(".sldprt")]

    def stem_of(c):
        return c["file"].rsplit(".", 1)[0]

    # ---- stages: one per ring, ordered along +Z (stage 0 = input/crank end) --
    rings = sorted((c for c in comps if role_of(stem_of(c)) == "ring"),
                   key=lambda c: c["transform"][11])
    mids = []                                    # gear mesh plane per stage
    for rg in rings:
        rc = glb_bbox_centre(GLB.get(stem_of(rg).lower(), "")) or [0, 0, args.planet_z]
        mids.append(rg["transform"][11] + rc[2])
    n_stages = max(len(rings), 1)

    def stage_of_z(z):
        return min(range(len(mids)), key=lambda k: abs(z - mids[k])) if mids else 0

    # planet stations per stage = that stage's sleeve-bearing positions
    stations = [[] for _ in range(n_stages)]
    for c in comps:
        if c["file"].upper().startswith("PGSB"):
            t = c["transform"]
            stations[stage_of_z(t[11])].append((t[9], t[10]))
    for st in stations:
        st.sort(key=lambda xy: math.atan2(xy[1], xy[0]))

    rates = stage_rates(args.drive, n_stages)
    # input spins with stage 0's driven member; output with the last stage's output
    input_role = "sun" if args.drive == "sun" else "carrier"
    output_role = "carrier" if args.drive == "sun" else "sun"

    # The TOPMOST O-shaft is the MODULE OUTPUT (Gearfinity modules output at
    # the top): it carries the load (e.g. the fan prop) and turns at the last
    # stage's output rate. Lower O-shafts are carrier couplings (e.g. crank ->
    # carrier 0). The I/O letter alone can't tell these apart - the fan reuses
    # DS5O at both ends of the train.
    def is_o_shaft(c):
        s = stem_of(c).lower()
        return s.startswith("ds") and "o" in s.split("_")[0][3:]

    o_shafts = [c for c in comps if is_o_shaft(c)]
    top_o = max(o_shafts, key=lambda c: c["transform"][11]) if o_shafts else None

    parts, missing = [], []
    placed = [0] * n_stages
    for c in comps:
        stem = stem_of(c)
        role = role_of(stem)
        t = list(c["transform"])
        if role == "input":
            kin = {"role": input_role, "stage": 0}
        elif role == "output" or c is top_o:
            kin = {"role": output_role, "stage": n_stages - 1}
        else:
            kin = {"role": role, "stage": stage_of_z(t[11])}
        if role == "planet":
            # parked z is meaningless - assign to the next stage with a free station
            k = next((k for k in range(n_stages) if placed[k] < len(stations[k])), None)
            if k is not None:
                x, y = stations[k][placed[k]]
                placed[k] += 1
                # display planets keep the CORE's origin (body ~96 mm off its
                # part origin) - compensate by the GLB body centre: place the
                # BODY at the station, on that stage's mesh plane.
                bc = glb_bbox_centre(GLB.get(stem.lower(), "")) or [0, 0, 0]
                mz = mids[k] if mids else args.planet_z
                t = [1, 0, 0, 0, 1, 0, 0, 0, 1, x - bc[0], y - bc[1], mz - bc[2]]
                kin = {"role": "planet", "stage": k, "center": [x, y, mz]}
            else:
                print(f"warn: no free station for {c['name']} - left at parked pose")
        url = GLB.get(stem.lower(), "")
        if not url:
            missing.append(c["file"])
        parts.append({"src": c["file"], "url": url, "transform": t, "kin": kin})

    scene = {
        "name": args.out.removeprefix("cfg_"),
        "drive": args.drive,
        "direction": -1 if args.reverse else 1,
        "parts": parts,
        "kinematics": {"stages": [
            {"teeth": NOMINAL_TEETH,
             "axis": {"origin": [0, 0, 0], "dir": [0, 0, 1]},
             "rates": rates[k]} for k in range(n_stages)]},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{args.out}.json"
    out.write_text(json.dumps(scene, indent=2), encoding="utf-8")
    have = len(parts) - len(missing)
    total = 1.0
    for r in rates:
        total = r["sun"] if args.drive == "carrier" else r["carrier"]
    print(f"wrote {out.relative_to(REPO)}  ({have}/{len(parts)} parts have GLBs)")
    print(f"  {n_stages} stage(s), drive={args.drive}, planets stationed: {placed}, "
          f"output rate: {total:.4f}x input")
    if missing:
        uniq = sorted(set(missing))
        print(f"need GLB exports ({len(uniq)} unique):")
        for f in uniq:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
