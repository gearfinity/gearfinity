# SolidWorks Assembly → Web App: the pipeline

How a SolidWorks assembly becomes an **animated, configurable 3D scene** in the
web configurator (`web/configurator.html`). This is the definitive process +
the hard-won conventions. Proven end-to-end on
`planetary_stage_core_mock_display.SLDASM` (2026-07).

## The pipeline at a glance

```
SolidWorks display assembly (.SLDASM)
   │
   ├─ DumpAssemblyBOM (macro)      →  <assembly>.bom.json      WHERE parts sit
   ├─ ExportAssemblyGLBs (macro)   →  web/parts/*.glb          WHAT parts look like
   │
   └─ scripts/gen_kinematic_scene.py
          →  web/scenes/cfg_<module>_<variant>.json            HOW parts move
                 │
                 └─ web/configurator.html renders + animates it
                    (kinematics: web/js/gear-train.js)
```

Three macro/script runs per assembly. No hand-exporting, no hand-typed
transforms.

## Step by step

1. **Model a display assembly** (see "Display assemblies" below).
2. Open it in SolidWorks, **activate the configuration to capture**, and run
   **DumpAssemblyBOM** (`scripts/macros/DumpAssemblyBOM.swp`) → writes
   `<assembly>.<config>.bom.json` next to it: every component instance + its
   transform. Variant masters (one assembly with 1/2/3-stage configurations)
   are dumped once per configuration — the filenames never collide.
3. Run **ExportAssemblyGLBs** (`scripts/macros/ExportAssemblyGLBs.swp`)
   → exports every *unique* component part to `web/parts/<stem>.glb`
   (instances share one file: 3 planets → 1 GLB). Date-checked, so re-runs
   only export what changed.
4. Generate the scene:
   ```
   python scripts/gen_kinematic_scene.py _all_parts/<assembly>.<config>.bom.json \
       --out cfg_<module>_<variant>
   ```
5. Open `web/configurator.html`, pick the module/variant — the mode indicator
   shows `scene: … (n/n GLBs)`. Missing GLBs are listed and skipped gracefully.

## Display assemblies (the third asset class)

The printable core is **print-in-place** — one fused mesh that cannot animate.
A *display assembly* holds the **kinematic decomposition**: the sun, each
planet, and the ring as separate movable parts, plus the real printable parts
around them (carriers, covers, pins, shafts, bearings).

- Display parts are **visualization-only**: they never enter `parts.csv`.
- Asset classes: **STL** = print (CS_PRINT frame) · **STEP** = CAD (local-only,
  Releases) · **GLB + bom.json** = display (design frame, metres).
- **Planets may be parked.** In a motion-study assembly the planet gears can
  sit off to the side; the generator re-stations them automatically onto the
  **PGSB62 sleeve-bearing positions** (the true 120°-apart orbit stations) at
  the ring's gear mid-plane.

### Naming conventions the generator relies on (`role_of`)

| Component file matches | Kinematic role | Turns at |
|---|---|---|
| `*-sun` | `sun` | stage input speed |
| `*gear_mesh_planet*` / `*planet3*` | `planet` | orbit = carrier, spin = planet rate |
| `*mock_display*` (the ring body) | `ring` | fixed — **defines the stage frame** |
| `PCB*` / `PCT*` (carrier plates), `PL*` (long pins), `PGSB*` (sleeve bearings) | `carrier` | carrier rate |
| `DS<r>I*` | `sun` of the stage its **geometry** engages | sun rate of that stage |
| `DS<r>O*` | `carrier` keyed at its spline (top) end | carrier rate of that stage |
| everything else (covers, short pins…) | `static` | fixed |

**Shaft letter semantics (owner convention):** `I`/`O` are fixed to the gear
*member*, not the usage direction — `I` = the **fast** side (keys the sun),
`O` = the **strong** side (keys the carrier). Modules may crank either side
(the fan cranks the `O`/strong side; speed comes out the `I`/fast side).
Because a long shaft's *origin* can sit far from the stage it keys (the fan's
68 mm DS5I output shaft origins near stage 1 but keys stage 2's sun), the
generator assigns shaft stages from **world-space geometry extent**
(transform × GLB bbox): I-shafts → the stage band they overlap; O-shafts →
the stage nearest their top end.

Model the display assembly with the **ring at the assembly origin, identity
orientation** — the stage axis is Z through the origin, and the ring's
geometry mid-plane defines the gear mesh height.

## The three critical conventions (learned the hard way)

1. **SolidWorks rotations must be TRANSPOSED.** `MathTransform.ArrayData`
   stores the rotation for *row-vector* math (`p' = p·R + t`); three.js uses
   column vectors. Read `[r0..r8]` as **column-major**. Symptom of getting it
   wrong: parts with *symmetric* rotations look perfect while asymmetric ones
   are subtly tilted (our display pins leaned 9–16°; the crank shaft sat 45°
   off for weeks).
2. **The XR/GLB exporter works on the ACTIVE document.** `OpenDoc6` on a part
   already loaded by an open assembly does *not* activate it — without
   `ActivateDoc3` every "part" GLB silently contains the assembly (first run:
   10 byte-identical files). The macro handles this.
3. **Extracted display parts keep the parent's origin.** The planet display
   gear's body sits ~96 mm from its part origin (core-extraction artifact).
   The generator compensates using the **GLB geometry bbox centre** (parsed
   straight from the file) and writes `kin.center` so the spin axis passes
   through the *body*, not the part origin.

Also remember: **GLB = design frame + metres** (matches the bom.json);
**STL = print frame** (CS_PRINT). Never mix them (docs/WEB_VIEWER.md).

## How the animation works

`web/js/gear-train.js` — pure math, no three.js:

- Willis equation on **tooth counts**: ratio `R = 1 + Zr/Zs`,
  `ω_carrier = ω_sun/R`, `ω_planet = ω_carrier·(1 − Zr/Zp)`.
- Stages chain **carrier → next sun**; every rate is an exact rational
  multiple of the crank input.
- Per frame the app rotates each part about its stage axis by `rate × θ`
  (pre-multiplied onto its base pose). Planets get two rotations: **orbit**
  about the stage axis at carrier rate + **spin** about their own station
  (`kin.center`) at planet-minus-carrier rate.
- Because the base poses come from the real assembly (bom.json) and the rates
  are exact, gears that start meshed stay meshed. (Planet *initial phase* is
  approximated — re-stationed planets use identity rotation; acceptable per
  owner. Everything else is exact.)

### Tooth counts (ground truth)

Recovered from the original OpenSCAD source
(`planetary_gear_stage_no_bearings.scad`, Documents/thingiverse/Planetary_gear):
`np = 22` (parameter) → derivation gives `ns = 14`, `nr = 58`.

> **The true ratio is 36:7 ≈ 5.1429 per stage** ("5:1" is the nominal name).
> 2-stage ≈ 26.45:1 · 3-stage ≈ 136.02:1.

Independently verified: the scad's planet-orbit radius
(`pitchD/2·(ns+np)/nr` = 27.2 mm) matches the PGSB62 bearing stations in the
display assembly's bom.json exactly. Counts live in `gear-train.js`
(`NOMINAL_TEETH`) and `gen_kinematic_scene.py`, and flow into each scene's
`kinematics.stages[n].teeth`.

## Scene schema (`web/scenes/cfg_<module>_<variant>.json`)

```jsonc
{
  "name": "planetary_stage_single",
  "parts": [
    { "src": "…-sun.SLDPRT",
      "url": "parts/….glb",                      // relative to web/
      "transform": [r0…r8, x, y, z],             // metres; rotation row-vector convention (transpose to use)
      "kin": { "role": "sun", "stage": 0,
               "center": [x, y, z] } }           // optional spin centre (planets)
  ],
  "kinematics": {
    "stages": [
      { "teeth": { "sun": 14, "planet": 22, "ring": 58 },
        "axis": { "origin": [0, 0, 0], "dir": [0, 0, 1] } }
    ]
  }
}
```

`web/scenes/` is generated (gitignored) — rerun the generator after any
re-export. GLB lookup prefers `web/parts/` (per-part exports) over
`web/models/` (whole-assembly mocks), which also avoids the name collision
when a part and its assembly share a stem.

## Configuration conventions (agreed 2026-07)

**Variation lives at the level where it varies:**

- **Intrinsic** variation (part of the sub-assembly's identity) → a
  **sub-assembly configuration**. The planetary stage's ring **slot styles**
  are the canonical case: configs named for the catalog style codes —
  `middle` / `outer` / `closed` (`PGC5M`/`PGC5O`/`PGC5C`).
- **Contextual** variation (decided by whichever module uses the
  sub-assembly) → a **parent-level component**, suppressed/swapped by the
  parent's configurations. **Drive shafts are contextual**: the stage
  sub-assembly carries NO shaft; the inter-stage coupler lives in the
  2-stage wrapper, and terminal shafts (DS5OL, DS5I, …) live in the module
  assembly — exactly mirroring `modules.config.json`, where shafts are
  module-level `shared_slots`, not stage slots.
- SolidWorks cannot swap/suppress a *nested* part per top-level config —
  suppressing a grandchild from the top writes into the child document's
  active config, silently changing every other usage. Derived
  configurations exist (parent→child config inheritance) but keep
  contextual variation out of shared documents instead.
- Variant masters (one `fan_module.SLDASM` with `1-stage`/`2-stage`/
  `3-stage` configs) are supported end-to-end: per-config suppression +
  referenced child configs + config-specific mates, dumped once per active
  configuration (per-config bom.json filenames).

The pipeline needs no special handling: `DumpAssemblyBOM` records the fully
resolved state (`IsSuppressed` per instance-in-context), and the scene
generator, ingestion, and BOM counting all skip suppressed components.

## Extending to a new module (crank, fan, multi-stage)

1. Build its display assembly (reuse the planetary display parts for stages —
   sub-assemblies are fine, the pipeline flattens them with root-space poses).
2. Run the two macros + the generator with `--out cfg_<module>_<variant>`.
3. **Multi-stage works automatically**: the generator detects one stage per
   ring (ordered along +Z, stage 0 = crank end), assigns every part to its
   nearest ring mesh-plane, and stations each stage's planets on its own
   bearings. Proven on `fan_module_2_stage` (68 parts, 2 stages).
4. **Drive direction** — pass `--drive`:
   - `--drive sun` (default): sun driven, carrier out — *reduction* (crank module)
   - `--drive carrier`: carrier driven, sun out — *speed-up* (fan: prop turns
     at 36²/7² ≈ 26.45× the crank)
   The generator writes exact per-stage `rates` into the scene; the app uses
   them directly (crank shaft/handle spin at input rate — the CP crank *plate*
   and CSS sleeve are static frame; `FP*` props turn at output rate).

## Debugging tools

- `scripts/inspect_glb.py web/parts/*.glb` — node transforms + geometry bbox
  per GLB (how the planet-origin offset and identical-file bugs were found).
- `web/assembly.html?scene=…&rot=row` — compare rotation conventions visually.
- Byte-identical GLBs (same size) ⇒ the ActivateDoc3 bug; re-check the macro.
