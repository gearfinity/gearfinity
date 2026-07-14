#!/usr/bin/env python3
"""Generate web/scenes/print_parts.json - the list of printable STLs (from
parts.csv) that the print-orientation preview (web/print.html) renders.

Usage:  python scripts/gen_print_manifest.py
"""
import csv, json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "web" / "scenes"

parts = []
for r in csv.DictReader((REPO / "parts.csv").open(encoding="utf-8")):
    link = r["File Link"].strip()
    if not link:
        continue
    fn = link.rstrip("/").split("/")[-1]          # <base>.STL
    if (REPO / "_all_parts" / fn).exists():
        parts.append({"id": r["ID"].strip(), "name": r["Name"].strip(),
                      "stl": "../_all_parts/" + fn})

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "print_parts.json").write_text(json.dumps({"parts": parts}, indent=2), encoding="utf-8")
print(f"wrote web/scenes/print_parts.json ({len(parts)} parts)")
