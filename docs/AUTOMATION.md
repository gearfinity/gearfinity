# Gearfinity Export & Automation Pipeline

**Goal:** you operate only in SolidWorks — model parts, arrange assemblies,
define print orientations. Everything else (exports, assembly transforms, web
scenes, download bundles, the live viewer) regenerates itself.

---

## Part 1 — The process as it stands today (manual)

### Per part
1. Model the part in SolidWorks.
2. If it needs a special print orientation, add a coordinate system named
   **`CS_PRINT`** (see "Two frames" below).
3. Export **STL** → `_all_parts/` (print frame: `CS_PRINT` if present, else default).
4. Export **STEP** → `_all_parts/`.
5. Export **GLB** (Extended Reality Binary) → *currently* `web/models/`
   (target: `_all_parts/`), in the **default/design frame**.

### Per assembly
6. Run **`DumpAssemblyBOM`** (`scripts/macros/DumpAssemblyBOM.vba`) → writes
   `<assembly>.bom.json` (each component's file, quantity, and transform).

### Then, already automated (Python)
7. `scripts/ingest_assembly.py` → BOM with real quantities (bundles, pin counts).
8. `scripts/bom_to_scene.py` → `web/scenes/<assembly>.json` (the viewer scene).
9. `scripts/build_bundles.py` → per-(module,variant) download bundles.
10. `scripts/render_modules.py` / `validate_parts.py` → docs + catalog integrity.

### Catalog (manual + collaborative)
- `parts.csv` (IDs, descriptions, print settings), `modules.config.json`
  (configurations).

---

## Part 2 — Conventions we've validated

- **GLB export:** default **design frame**; *no motion study* (continuous gear
  rotation baked as glTF quaternion keyframes breaks the file); Draco is fine.
- **STL export:** **print frame** — a `CS_PRINT` coordinate system if the part
  needs a specific slicer orientation, else default. (STL "positive-space"
  translation is why STL can't drive the viewer — GLB does.)
- **Assembly reconstruction:** rotation `rot=row` (row-major), `up=z`
  (SolidWorks Z-up → three.js Y-up), units **metres**. Baked as the viewer
  defaults.
- **Two frames per part — never mixed:**

  | Export | Frame | Purpose |
  |---|---|---|
  | STL | **print** (`CS_PRINT` or default) | drops into the slicer oriented to print |
  | GLB | **design** (default origin) | so the viewer reconstructs assemblies from transforms |

## Tracked open anomalies

- **Crank shaft (CS5) imports 45° clocked** in the GLB assembly view. Only case
  so far; no known action shifts a part 45°, and every other part reconstructs
  correctly. **Deferred** — revisit once more GLB imports reveal a pattern.

---

## Part 3 — The target: full automation

### 3.1 Sync-export macro (SolidWorks) — the keystone to build
A macro that walks parts + assemblies and, for anything whose source
(`.SLDPRT`/`.SLDASM`) is **newer than its exports** (file-date staleness),
re-runs the exports with correct settings baked in:
- **Part** → STL (`CS_PRINT` or default), STEP, GLB (default frame) into `_all_parts/`.
- **Assembly** → `.bom.json`.
- **Reports** which parts define `CS_PRINT`, so print orientations are tracked.

Run it one-click after a modeling session, or nightly via **SolidWorks Task
Scheduler**. (True auto-on-save would need a SolidWorks add-in — a later upgrade;
the sync macro is the pragmatic 95%.)

### 3.2 Python pipeline — already built
`ingest_assembly` · `bom_to_scene` · `build_bundles` · `render_modules` ·
`validate_parts`. They re-run on the macro's outputs; no manual steps.

### 3.3 CI (GitHub Actions)
- **On push:** regenerate scenes + `validate_parts`.
- **On release:** build & attach bundles (`build-bundles.yml`, done).
- **On `web/` change:** deploy Pages (`pages.yml`, done) — with a build step
  that copies the GLBs the scenes reference from `_all_parts/` into the web
  artifact (Pages serves only `web/`).

### 3.4 Asset locations
- `_all_parts/`: `SLDPRT + STEP + STL + GLB` per part (**GLBs via Git LFS**).
- Pages build copies referenced GLBs into the deploy.

### 3.5 The flow
```
model / arrange in SolidWorks
      │  (one click)
  sync-export macro  → _all_parts/ (STL/STEP/GLB) + *.bom.json
      │  git commit + push
  CI: regenerate scenes + bundles, deploy viewer
      │
  configurator + downloads always current
```

### What stays manual (by design)
- Identifying **configurations** (`modules.config.json`: slots, variants,
  recommended vs. alternatives).
- Curating **source-of-truth data** (`parts.csv`: IDs, descriptions, print
  settings, `CS_PRINT` flags).

---

## Part 4 — Build order (to reach the target)

1. **Sync-export macro** — STL/STEP/GLB + staleness + `CS_PRINT` + assembly
   `.bom.json`. *(Biggest piece; needs confirmation of the exact export settings.)*
2. **Relocate GLBs to `_all_parts/`** + LFS; add the Pages web-build copy step.
3. **Wire CI:** scenes on push, bundles on release (done), Pages deploy (done).
4. **Print-preview mode** in the app (STL on a print bed) — slicer-orientation QA.
5. **Configurator UI** — config-driven part swapping + procedural animation.
