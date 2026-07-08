#!/usr/bin/env python3
"""Inspect GLB files: root-node transforms + overall geometry bounding box
(in the file's own frame). Diagnoses part-origin vs body-offset issues in
display exports (e.g. a planet gear whose body sits at its in-core radius).

Usage:  python scripts/inspect_glb.py web/parts/*.glb
"""
from __future__ import annotations
import json, struct, sys
from pathlib import Path


def read_glb_json(path: Path) -> dict:
    b = path.read_bytes()
    magic, _ver, _len = struct.unpack_from("<III", b, 0)
    assert magic == 0x46546C67, f"{path}: not a GLB"
    off = 12
    while off < len(b):
        clen, ctype = struct.unpack_from("<II", b, off)
        if ctype == 0x4E4F534A:  # 'JSON'
            return json.loads(b[off + 8: off + 8 + clen])
        off += 8 + clen
    raise ValueError(f"{path}: no JSON chunk")


def node_matrix(n: dict):
    if "matrix" in n:
        return n["matrix"]  # column-major 16
    parts = []
    if "translation" in n: parts.append(f"T{tuple(round(v, 5) for v in n['translation'])}")
    if "rotation" in n: parts.append(f"R{tuple(round(v, 4) for v in n['rotation'])}")
    if "scale" in n: parts.append(f"S{tuple(n['scale'])}")
    return " ".join(parts) or "identity"


def bbox(g: dict):
    """Union of all POSITION accessor min/max (local mesh frames)."""
    lo = [float("inf")] * 3
    hi = [float("-inf")] * 3
    for mesh in g.get("meshes", []):
        for prim in mesh.get("primitives", []):
            ai = prim.get("attributes", {}).get("POSITION")
            if ai is None:
                continue
            acc = g["accessors"][ai]
            for i in range(3):
                lo[i] = min(lo[i], acc["min"][i])
                hi[i] = max(hi[i], acc["max"][i])
    return lo, hi


def main(paths):
    for p in map(Path, paths):
        g = read_glb_json(p)
        lo, hi = bbox(g)
        ctr = [(a + b) / 2 for a, b in zip(lo, hi)]
        size = [b - a for a, b in zip(lo, hi)]
        print(f"\n{p.name}")
        print(f"  bbox centre (mm): ({ctr[0]*1000:8.2f}, {ctr[1]*1000:8.2f}, {ctr[2]*1000:8.2f})")
        print(f"  bbox size   (mm): ({size[0]*1000:8.2f}, {size[1]*1000:8.2f}, {size[2]*1000:8.2f})")
        scenes = g.get("scenes", [{}])
        roots = scenes[0].get("nodes", [])
        for ri in roots:
            n = g["nodes"][ri]
            print(f"  root node '{n.get('name','?')}': {node_matrix(n)}")
            for ci in n.get("children", [])[:3]:
                c = g["nodes"][ci]
                print(f"    child '{c.get('name','?')}': {node_matrix(c)}")


if __name__ == "__main__":
    main(sys.argv[1:])
