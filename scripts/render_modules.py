#!/usr/bin/env python3
"""Render MODULES.md (human-readable recommended builds) from
modules.config.json + parts.csv. Generated view - edit the config, not this.

Usage:  python scripts/render_modules.py
"""
import gf_config as gf

cfg = gf.load_config()
NAMES = gf.part_field("Name")

md = ["# Gearfinity Modules - Recommended Builds", "",
      "> Generated from `modules.config.json` by `scripts/render_modules.py`. "
      "Do not edit by hand. Every build below is the **recommended** configuration; "
      "listed alternatives also work.", ""]

current = None
for mid, module, vname, variant, agg in gf.iter_builds(cfg):
    if mid != current:
        current = mid
        md.append(f"## {module['name']}")
        if module.get("assembly_video"):
            md.append(f"\n[Assembly video]({module['assembly_video']})")
    total = sum(q for q, _ in agg.values() if isinstance(q, int))
    md.append(f"\n### {vname}  -  {total}+ parts to print (pins TBD)\n")
    md.append("| Part | Qty | Name | Role |")
    md.append("|---|---|---|---|")
    for pid, (qty, role) in agg.items():
        md.append(f"| `{pid}` | {qty} | {NAMES.get(pid, '?')} | {role} |")
    # alternatives once per module (after its first/last variant is fine; show under each module)
    last_variant = list(module["variants"]) [-1] == vname
    if last_variant:
        alts = []
        for sname, slot in module.get("shared_slots", {}).items():
            if slot.get("alternatives"):
                a = ", ".join(f"`{x}`" for x in slot["alternatives"])
                alts.append(f"- **{slot['recommended']}** ({slot.get('role', sname)}) - alternatives: {a}")
        alts.append("- **Cores**: standard fit recommended; a `T` (tight) variant "
                    "(e.g. `PGC5MT`) reduces gear skipping when a core is used standalone. "
                    "Any slot style still functions.")
        md.append("\n**Swappable options:**")
        md += alts
        md.append("")

(gf.REPO / "MODULES.md").write_text("\n".join(md) + "\n", encoding="utf-8")
print("Wrote MODULES.md")
