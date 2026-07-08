#!/usr/bin/env python3
"""Build per-(module, variant) download bundles from _all_parts/ and the
config model. For each recommended build, produces under dist/:

  dist/<module>/<module>_<variant>/
      <loose STL files>                 (ready to drag-drop to Printables/Thingiverse)
      <module>_<variant>_print.zip      (all STLs)
      <module>_<variant>_source.zip     (all STEP files, if any)
      <module>_<variant>_description.md (paste-ready listing)

Files are resolved through each part's File Link in parts.csv, so this stays
correct as filenames are migrated. Missing files are reported, not fatal.

STEP note: STEP files are NOT tracked in git (they're huge - see .gitignore),
so source.zip is only produced when you run this LOCALLY, where the macro-exported
STEP files exist on disk. In CI (fresh clone, no STEP) the bundles are STL-only.
To publish CAD, run this locally and attach the source.zip(s) to a GitHub Release.

Usage:  python scripts/build_bundles.py
"""
from __future__ import annotations
import shutil, zipfile
from pathlib import Path
import gf_config as gf

REPO = gf.REPO
ALLP = REPO / "_all_parts"
DIST = REPO / "dist"
LICENSE = "MIT"

cfg = gf.load_config()
NAMES = gf.part_field("Name")
LINKS = gf.part_field("File Link")
NOTES = gf.part_field("Printing Notes")


# index real files once: stem(lowercased) -> [actual Paths]  (FS is case-insensitive)
INDEX: dict[str, list[Path]] = {}
for _p in ALLP.iterdir():
    if _p.is_file() and not _p.name.startswith("~$"):
        INDEX.setdefault(_p.stem.lower(), []).append(_p)


def base_of(pid):
    link = LINKS.get(pid, "")
    return link.rstrip("/").split("/")[-1].rsplit(".", 1)[0] if link else None


def files(base, suffixes):
    return [p for p in INDEX.get(base.lower(), []) if p.suffix.lower() in suffixes]


def zip_files(path, paths):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in paths:
            z.write(p, p.name)


def description(module, vname, variant, agg):
    L = [f"# Gearfinity {module['name']} - {vname}", ""]
    if module.get("assembly_video"):
        L.append(f"Assembly video: {module['assembly_video']}\n")
    L.append("## What to print\n")
    L.append("| Part ID | Qty | Name |")
    L.append("|---|---|---|")
    for pid, (qty, _role) in agg.items():
        L.append(f"| {pid} | {qty} | {NAMES.get(pid, '?')} |")
    # swap notes
    swaps = []
    for sname, slot in module.get("shared_slots", {}).items():
        if slot.get("alternatives"):
            swaps.append(f"- {slot['recommended']} -> also works: {', '.join(slot['alternatives'])}")
    if swaps:
        L.append("\n## Swappable options\n")
        L += swaps
    L.append(f"\n## Default print settings\n")
    L.append("Most parts: 3 perimeters, 5% infill, 0.2 mm layers, no supports. "
             "Shafts and bearings: 100% infill. See parts.csv for per-part notes.")
    L.append(f"\nLicense: {LICENSE}. Part IDs follow NAMING.md.")
    return "\n".join(L) + "\n"


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    rows = []
    for mid, module, vname, variant, agg in gf.iter_builds(cfg):
        outdir = DIST / mid / f"{mid}_{vname}"
        outdir.mkdir(parents=True, exist_ok=True)
        stls, steps, missing = [], [], []
        for pid in agg:
            base = base_of(pid)
            s = files(base, {".stl"}) if base else []
            if not s:
                missing.append(pid)
                continue
            stls += s
            steps += files(base, {".step", ".stp"})
        for f in stls:
            shutil.copy2(f, outdir / f.name)
        zip_files(outdir / f"{mid}_{vname}_print.zip", stls)
        if steps:
            zip_files(outdir / f"{mid}_{vname}_source.zip", steps)
        (outdir / f"{mid}_{vname}_description.md").write_text(
            description(module, vname, variant, agg), encoding="utf-8")
        rows.append((f"{mid}/{vname}", len(stls), len(steps), missing))

    print(f"Built {len(rows)} bundles in {DIST.relative_to(REPO)}/\n")
    print(f"{'bundle':28} {'STL':>4} {'STEP':>5}  missing")
    for name, ns, nst, miss in rows:
        print(f"{name:28} {ns:>4} {nst:>5}  {', '.join(miss) if miss else '-'}")


if __name__ == "__main__":
    main()
