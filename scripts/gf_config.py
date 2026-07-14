"""Shared helpers for the Gearfinity config model + parts catalog.
Used by render_modules.py (human view) and build_bundles.py (packager) so
the build expansion lives in exactly one place."""
from __future__ import annotations
import csv, json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def load_config():
    return json.loads((REPO / "modules.config.json").read_text(encoding="utf-8"))


def _rows():
    return list(csv.DictReader((REPO / "parts.csv").open(encoding="utf-8")))


def part_field(field):
    return {r["ID"].strip(): r[field].strip() for r in _rows()}


def build_variant(cfg, module, variant):
    """Expand a variant into an ordered dict: pid -> [qty, role].
    qty is an int, or 'TBD' for not-yet-counted parts (pins)."""
    code = cfg["core_style_codes"]
    fit = cfg["defaults"].get("core_fit", "")   # "" = standard (omitted), "T" = tight
    stage = cfg["submodules"]["planetary_stage"]
    agg: dict[str, list] = {}

    def add(pid, qty, role):
        if pid in agg:
            a = agg[pid]
            a[0] = a[0] + qty if isinstance(a[0], int) and isinstance(qty, int) else "TBD"
        else:
            agg[pid] = [qty, role]

    for style in variant["stages"]:
        for sname, slot in stage["slots"].items():
            if sname == "core":
                pid = slot["recommended"].replace("{style}", code[style]).replace("{fit}", fit)
                role = f"gear core ({style})"
            else:
                pid = slot["recommended"]
                role = sname.replace("_", " ")
            add(pid, slot.get("qty", 1), role)
    if variant.get("cover"):
        add(variant["cover"], 1, "gearbox cover")
    for sname, slot in module.get("shared_slots", {}).items():
        add(slot["recommended"], slot.get("qty", 1), slot.get("role", sname.replace("_", " ")))
    return agg


def iter_builds(cfg):
    """Yield (module_id, module, variant_name, variant, aggregated_bom)."""
    for mid, module in cfg["modules"].items():
        for vname, variant in module["variants"].items():
            yield mid, module, vname, variant, build_variant(cfg, module, variant)
