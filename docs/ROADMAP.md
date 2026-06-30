# Gearfinity Roadmap

Master plan across every workstream we've opened. Each path links to its detailed
tracker. Most active work lives on the **`feature/part-naming-scheme`** branch
(draft **PR #4**).

## Status snapshot (done)

- ✅ GitHub CLI set up; `gearfinity` account is admin (see memory `gh-cli-setup`).
- ✅ Git LFS tracking for CAD/3D/media binaries (going forward).
- ✅ Part-naming scheme designed + documented ([NAMING.md](../NAMING.md)).
- ✅ Catalog migrated to new IDs with `alias` + `rev` ([parts.csv](../parts.csv)),
  enforced by [scripts/validate_parts.py](../scripts/validate_parts.py).
- ✅ Configuration model + recommended builds
  ([modules.config.json](../modules.config.json) → [MODULES.md](../MODULES.md)).
- ✅ Bundle packager + Release automation
  ([scripts/build_bundles.py](../scripts/build_bundles.py),
  [.github/workflows/build-bundles.yml](../.github/workflows/build-bundles.yml)).
- ✅ Web-viewer POC + Pages ([web/](../web/), see [WEB_VIEWER.md](WEB_VIEWER.md)).
- ✅ First part fully migrated end-to-end: **CS5**.

---

## Path 1 — Part naming & physical migration

**Goal:** every part on the new ID scheme, with files renamed and models
re-embossed, without breaking assemblies. **Tracker:**
[MIGRATION_CHECKLIST.md](../MIGRATION_CHECKLIST.md).

Remaining:
- [ ] **[YOU]** Migrate the remaining **46 parts** (rename via SolidWorks File
      Utilities → re-emboss → re-export), per the checklist. CS5 is the proven
      template; `RB-2` needs a revision re-emboss.
- [ ] **[ME]** Reconcile each migrated part into a commit (swap files, update the
      `parts.csv` File Link, stage updated assemblies, validate, tick the row).
- [ ] **Build a per-part migration skill/command** (`/migrate-part <ID>`) to
      enforce every step so nothing is skipped.
- [ ] **Finalize the bevel gear** (`BG15D`) — real description + print settings.
- [ ] Optional later: rename source `.SLDPRT`/`.SLDASM` consistently (only via a
      reference-preserving SolidWorks rename — never Save-As-then-delete).

## Path 2 — Module bundles & distribution

**Goal:** drift-free, one-click per-(module, variant) downloads + platform-ready
packages, from a single source of truth.

Remaining:
- [ ] **Phase 2 config — alternatives:** flesh out per-slot "also works" options
      across all modules in `modules.config.json`.
- [ ] **Pin counts:** add per-part `short_pin_holes` / `long_pin_holes`; compute
      `pins = Σ(holes) ÷ 2` per build (replaces the `TBD`s). See `_pin_model`.
- [ ] **Confirm remaining config assumptions** (crank_input/output decomposition;
      sleeve-bearing qty).
- [ ] **Remove duplicate exports** from `crank_module/`, `fan_module/`,
      `planetary_gear_stage/`; point their READMEs at the bundles + parts list.
- [ ] **Cut the first Release** (after merge) so the workflow publishes bundles.
- [ ] Confirm bundle split (print vs source zips) and description contents.

## Path 3 — Web viewer → configurator app

**Goal:** browser module configurator with SolidWorks-quality visuals + motion.
**Detail:** [WEB_VIEWER.md](WEB_VIEWER.md).

Remaining (high level):
- [ ] Commit a working mock `.glb`; verify live on Pages.
- [ ] **Mock registry** (printable part / submodule ↔ mock `.glb`).
- [ ] Named-node GLB exports + assembly transforms → three.js assembled view.
- [ ] Procedural gear animation; interactive crank.
- [ ] Full configurator driven by `modules.config.json`; "download these parts"
      → bundles; baked discrete clips (exploded views).

## Path 4 — SolidWorks assembly leverage

**Goal:** extract the engineering truth locked in `.SLDASM` files to feed the
config model, pin counts, and the viewer.

Remaining:
- [ ] Choose the extraction mechanism: **BOM export** (quick, quantities) vs a
      **traversal macro** (VBA `.swp`) that dumps components + quantities +
      transforms (+ mates) to JSON.
- [ ] Write the macro (aligns with the existing `scripts/*.swp` macros).
- [ ] Use extracted BOMs to **validate / auto-fill** `modules.config.json`
      quantities — including pins.
- [ ] Feed component **transforms** into the interactive viewer (Path 3).

## Path 5 — Repo infra & community

Remaining:
- [ ] **PR strategy:** PR #4 is large (naming + bundles + config + web). Decide
      whether to merge as-is when migration completes, or split off independent
      pieces (e.g., a viewer-only PR to go live sooner).
- [ ] Optional: **full-history LFS migration** to shrink the existing ~1.6 GB
      (history rewrite + force-push — deliberate, has cost).
- [ ] Populate the full **attribute columns** in `parts.csv` (ratio, slot,
      tolerance, teeth, pin-holes, …).
- [ ] Community/docs: issue templates, GitHub Discussions, repo homepage URL
      (`gearfinity.xyz`), funding links.

---

## Suggested frontier

Two independent tracks can advance in parallel:
1. **Migration grind** (Path 1) — steady part-by-part; unblocks correct bundles
   and clean module folders.
2. **Capability building** (Paths 2–4) — config Phase 2 + pin model, then the
   SolidWorks macro, which simultaneously feeds bundles *and* the viewer.

The web app (Path 3) advances opportunistically whenever a good mock export is
on hand.
