#!/usr/bin/env python3
"""Validate parts.csv against the actual files in _all_parts/.

Catches the drift that crept in while the parts list lived in a
disconnected Google Sheet:

  ERROR   a row's File Link points to a file that does not exist
  WARN    a row has no File Link yet
  INFO    an STL in _all_parts/ is not referenced by any row
          (often intentional -- the list is a curated subset)

Exit code is non-zero only when there are ERRORs, so this is safe to
run as a CI check on every PR.

Usage:  python scripts/validate_parts.py
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path
from urllib.parse import unquote

REPO = Path(__file__).resolve().parent.parent
PARTS_CSV = REPO / "parts.csv"
PARTS_DIR = REPO / "_all_parts"


def link_to_filename(link: str) -> str | None:
    """Extract the bare filename a File Link points at, or None if blank."""
    link = link.strip()
    if not link:
        return None
    return unquote(link.rstrip("/").split("/")[-1])


def main() -> int:
    if not PARTS_CSV.exists():
        print(f"ERROR: {PARTS_CSV} not found")
        return 2

    errors: list[str] = []
    warnings: list[str] = []
    referenced: set[str] = set()

    with PARTS_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if "File Link" not in (reader.fieldnames or []):
            print(f"ERROR: parts.csv missing 'File Link' column; got {reader.fieldnames}")
            return 2
        for row in reader:
            pid = (row.get("ID") or "?").strip()
            fname = link_to_filename(row.get("File Link", ""))
            if fname is None:
                warnings.append(f"{pid}: no File Link")
                continue
            referenced.add(fname.lower())
            if not (PARTS_DIR / fname).exists():
                errors.append(f"{pid}: link points to missing file '{fname}'")

    # Reverse check (informational): STLs present but not in the list.
    orphans = sorted(
        p.name
        for p in PARTS_DIR.glob("*.STL")
        if p.name.lower() not in referenced
    ) if PARTS_DIR.exists() else []
    # Also catch lowercase .stl just in case.
    orphans += sorted(
        p.name
        for p in PARTS_DIR.glob("*.stl")
        if p.name.lower() not in referenced
    )

    for e in errors:
        print(f"ERROR  {e}")
    for w in warnings:
        print(f"WARN   {w}")
    if orphans:
        print(f"INFO   {len(orphans)} STL(s) in _all_parts/ not in parts list "
              f"(may be intentional):")
        for o in orphans:
            print(f"INFO     {o}")

    print()
    print(f"Summary: {len(errors)} error(s), {len(warnings)} warning(s), "
          f"{len(orphans)} unreferenced STL(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
