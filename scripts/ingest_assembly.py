#!/usr/bin/env python3
"""Turn a *.bom.json (from DumpAssemblyBOM.swp) into a part-ID BOM with
quantities, by mapping each component's file to a part via parts.csv.

This is how we get GROUND-TRUTH quantities (including pin counts) out of the
SolidWorks assemblies to validate / fill modules.config.json, and the per-
component transforms for the web viewer.

Usage:
    python scripts/ingest_assembly.py <file.bom.json> [more.bom.json ...]
    python scripts/ingest_assembly.py --all        # every *.bom.json under _all_parts/
"""
from __future__ import annotations
import csv, json, sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ALLP = REPO / "_all_parts"


def id_by_stem():
    """Map a file stem (lowercased, no extension) -> part ID, via parts.csv links."""
    m = {}
    for r in csv.DictReader((REPO / "parts.csv").open(encoding="utf-8")):
        link = r["File Link"].strip()
        if link:
            stem = link.rstrip("/").split("/")[-1].rsplit(".", 1)[0].lower()
            m[stem] = r["ID"].strip()
    return m


def ingest(path, lut):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    qty, unknown, subassemblies = Counter(), Counter(), Counter()
    for c in data.get("components", []):
        if c.get("suppressed"):
            continue
        fname = c.get("file", "")
        stem, _, ext = fname.rpartition(".")
        stem, ext = (stem or fname).lower(), ext.lower()
        if ext in ("sldasm", "asm"):
            subassemblies[fname] += 1
            continue
        pid = lut.get(stem)
        (qty if pid else unknown)[pid or fname] += 1
    return data.get("assembly", path), qty, unknown, subassemblies


def report(name, qty, unknown, subs):
    print(f"\n=== {name} ===")
    print(f"BOM: {sum(qty.values())} part instances, {len(qty)} unique")
    for pid, n in sorted(qty.items()):
        print(f"  {pid:12} x{n}")
    if subs:
        print("  sub-assemblies (expanded into their parts):",
              ", ".join(f"{k} x{v}" for k, v in subs.items()))
    if unknown:
        print("  UNMAPPED files (not in parts.csv):")
        for f, n in sorted(unknown.items()):
            print(f"    {f} x{n}")


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    files = sorted(ALLP.glob("*.bom.json")) if argv == ["--all"] else [Path(a) for a in argv]
    if not files:
        print("No .bom.json files found. Run DumpAssemblyBOM.swp on an assembly first.")
        return 1
    lut = id_by_stem()
    for f in files:
        if not f.exists():
            print(f"skip (missing): {f}")
            continue
        name, qty, unknown, subs = ingest(f, lut)
        report(name, qty, unknown, subs)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
