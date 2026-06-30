#!/usr/bin/env python3
"""Render MODULES.md (human-readable recommended builds) from
modules.config.json + parts.csv. Expands each module variant into an
aggregated print list with quantities. This is a generated view; edit
modules.config.json, not MODULES.md.

Usage:  python scripts/render_modules.py
"""
from __future__ import annotations
import csv, json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CFG = json.loads((REPO / "modules.config.json").read_text(encoding="utf-8"))
NAMES = {r["ID"].strip(): r["Name"].strip()
         for r in csv.DictReader((REPO / "parts.csv").open(encoding="utf-8"))}

TOL = CFG["defaults"]["core_tolerance"]
CODE = CFG["core_style_codes"]
STAGE = CFG["submodules"]["planetary_stage"]


def resolve(rec, style):
    return rec.replace("{style}", CODE[style]).replace("{tol}", TOL)


def build(module):
    """Return (variant_name -> {pid: [qty, role]}, alternatives list)."""
    out = {}
    for vname, v in module["variants"].items():
        agg = {}
        def add(pid, qty, role):
            if pid in agg:
                agg[pid][0] += qty
            else:
                agg[pid] = [qty, role]
        # per-stage parts
        for style in v["stages"]:
            for sname, slot in STAGE["slots"].items():
                pid = resolve(slot["recommended"], style) if sname == "core" else slot["recommended"]
                role = f"gear core ({style})" if sname == "core" else sname.replace("_", " ")
                add(pid, slot.get("qty", 1), role)
        # cover
        if v.get("cover"):
            add(v["cover"], 1, "gearbox cover")
        # shared module-level parts
        for sname, slot in module.get("shared_slots", {}).items():
            add(slot["recommended"], slot.get("qty", 1), slot.get("role", sname.replace("_", " ")))
        out[vname] = agg
    return out


def alternatives(module):
    lines = []
    for sname, slot in module.get("shared_slots", {}).items():
        if slot.get("alternatives"):
            alts = ", ".join(f"`{a}`" for a in slot["alternatives"])
            lines.append(f"- **{slot['recommended']}** ({slot.get('role', sname)}) - alternatives: {alts}")
    lines.append(f"- **Cores**: recommended at tolerance `{TOL}`; "
                 f"tolerance `10`/`05` are tighter alternatives, and any slot style still functions.")
    return lines


md = ["# Gearfinity Modules - Recommended Builds",
      "",
      "> Generated from `modules.config.json` by `scripts/render_modules.py`. "
      "Do not edit by hand. Every build below is the **recommended** configuration; "
      "listed alternatives also work.",
      ""]

for mid, module in CFG["modules"].items():
    md.append(f"## {module['name']}")
    if module.get("assembly_video"):
        md.append(f"\n[Assembly video]({module['assembly_video']})")
    builds = build(module)
    for vname, agg in builds.items():
        total = sum(q for q, _ in agg.values())
        md.append(f"\n### {vname}  -  {total} parts to print\n")
        md.append("| Part | Qty | Name | Role |")
        md.append("|---|---|---|---|")
        for pid, (qty, role) in agg.items():
            md.append(f"| `{pid}` | {qty} | {NAMES.get(pid, '?')} | {role} |")
    alts = alternatives(module)
    if alts:
        md.append("\n**Swappable options:**")
        md += alts
    md.append("")

(REPO / "MODULES.md").write_text("\n".join(md) + "\n", encoding="utf-8")
print("Wrote MODULES.md")
for mid, module in CFG["modules"].items():
    for vname, agg in build(module).items():
        print(f"  {module['name']} / {vname}: {sum(q for q,_ in agg.values())} parts, {len(agg)} unique")
