#!/usr/bin/env python3
"""Validate parts.csv: file links resolve, and IDs obey the naming grammar
defined in NAMING.md.

Checks
------
ERROR  a row's File Link points to a file that does not exist
ERROR  duplicate ID
ERROR  ID uses an unregistered family prefix
ERROR  ID has illegal characters / bad hyphen use (hyphen only before rev)
ERROR  rev column disagrees with the ID's -N suffix
WARN   a row has no File Link yet
INFO   an STL in _all_parts/ is not referenced (often intentional)

Exit code is non-zero only on ERRORs, so this is safe as a CI check.

Usage:  python scripts/validate_parts.py
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO = Path(__file__).resolve().parent.parent
PARTS_CSV = REPO / "parts.csv"
PARTS_DIR = REPO / "_all_parts"

# Registered family codes (NAMING.md Part 4). Longest-prefix wins.
FAMILIES = [
    "CHG", "CSP", "CSS", "CS", "CA", "CP", "CH",
    "DS", "FC", "FF", "FP", "GC",
    "HPB", "HP", "H",
    "PGSB", "PGC", "PCB", "PCT", "PSC", "PT", "P",
    "RB", "BG",
]
FAMILIES.sort(key=len, reverse=True)

ID_CHARS = re.compile(r"^[A-Z0-9]+(-[0-9]+)?$")


def family_of(stem: str) -> str | None:
    for fam in FAMILIES:
        if stem.startswith(fam):
            return fam
    return None


def link_to_filename(link: str) -> str | None:
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
    seen_ids: set[str] = set()

    with PARTS_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {"ID", "rev", "File Link"}
        missing_cols = required - set(reader.fieldnames or [])
        if missing_cols:
            print(f"ERROR: parts.csv missing columns: {sorted(missing_cols)}")
            return 2

        for row in reader:
            pid = (row.get("ID") or "").strip()
            if not pid:
                errors.append("row with empty ID")
                continue

            # uniqueness
            if pid in seen_ids:
                errors.append(f"{pid}: duplicate ID")
            seen_ids.add(pid)

            # charset + hyphen invariant (hyphen only before a numeric rev)
            if not ID_CHARS.match(pid):
                errors.append(f"{pid}: illegal characters or hyphen not before rev")

            # split optional -rev suffix
            stem, _, rev_suffix = pid.partition("-")
            # registered family
            if family_of(stem) is None:
                errors.append(f"{pid}: unregistered family prefix")

            # rev column agrees with ID suffix
            rev_col = (row.get("rev") or "").strip()
            id_rev = rev_suffix if rev_suffix else "1"
            if rev_col != id_rev:
                errors.append(
                    f"{pid}: rev column is '{rev_col}' but ID implies rev {id_rev}"
                )

            # file link resolves
            fname = link_to_filename(row.get("File Link", ""))
            if fname is None:
                warnings.append(f"{pid}: no File Link")
            else:
                referenced.add(fname.lower())
                if not (PARTS_DIR / fname).exists():
                    errors.append(f"{pid}: link points to missing file '{fname}'")

    orphans = sorted(
        {p.name for p in PARTS_DIR.glob("*.STL")} | {p.name for p in PARTS_DIR.glob("*.stl")}
    ) if PARTS_DIR.exists() else []
    orphans = [o for o in orphans if o.lower() not in referenced]

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
