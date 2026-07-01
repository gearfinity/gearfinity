#!/usr/bin/env python3
"""Convert a *.bom.json (from DumpAssemblyBOM) into a web scene the three.js
assembly viewer loads: each part's per-part GLB + transform.

Per-part GLBs live in web/models/ or web/parts/ (export each part to
Extended Reality Binary). GLB keeps geometry in the true part-origin frame and
in metres, matching the transforms - so parts place correctly and are
swappable. Parts without a GLB yet are listed but not rendered.

Usage:
    python scripts/bom_to_scene.py _all_parts/crank_input.SLDASM.bom.json
    python scripts/bom_to_scene.py --all
"""
from __future__ import annotations
import json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ALLP = REPO / "_all_parts"
OUT = REPO / "web" / "scenes"

# per-part GLB by stem (FS is case-insensitive, so *.glb catches *.GLB too)
GLB = {}
for d in [REPO / "web" / "models", REPO / "web" / "parts"]:
    if d.exists():
        for p in d.glob("*.glb"):
            GLB[p.stem.lower()] = f"{d.name}/{p.name}"
STL = {p.stem.lower(): p.name for p in ALLP.glob("*.STL")}


def convert(bom_path: Path):
    d = json.loads(bom_path.read_text(encoding="utf-8"))
    parts, missing = [], []
    for c in d.get("components", []):
        if c.get("suppressed"):
            continue
        stem = c["file"].rsplit(".", 1)[0].lower()
        glb = GLB.get(stem)
        if glb:
            parts.append({"src": c["file"], "url": glb, "transform": c["transform"]})
        else:
            missing.append(c["file"])
            stl = STL.get(stem)
            parts.append({"src": c["file"], "url": f"../_all_parts/{stl}" if stl else "",
                          "transform": c["transform"]})
    name = Path(d.get("assembly", bom_path.stem)).stem
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.json").write_text(json.dumps({"name": name, "parts": parts}, indent=2), encoding="utf-8")
    have = len(parts) - len(missing)
    print(f"wrote web/scenes/{name}.json  ({have}/{len(parts)} parts have GLBs)"
          + (f"  need GLB for: {', '.join(missing)}" if missing else ""))


def main(argv):
    files = sorted(ALLP.glob("*.bom.json")) if argv == ["--all"] else [Path(a) for a in argv]
    if not files:
        print("No .bom.json given/found.")
        return 1
    for f in files:
        convert(f) if f.exists() else print(f"skip (missing): {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
