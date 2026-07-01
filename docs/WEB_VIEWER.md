# Gearfinity Web Viewer & Configurator — Learnings + Plan

The long-term goal is a **browser-based module configurator** with
SolidWorks-quality visuals: pick a module and variant, see it assembled in 3D,
watch the gears turn, and download exactly the parts you need. This doc records
what we proved in the exploratory POC and the plan to get from there to the full
app.

## Status

- ✅ **Static POC works.** `web/index.html` renders a SolidWorks-exported `.glb`
  of the `planetary_stage_core_mock_display` assembly in-browser with orbit /
  zoom / lighting / AR, via `<model-viewer>`.
- ✅ GitHub Pages enabled (Actions source) → publishes `web/` to
  **https://gearfinity.github.io/gearfinity/** once `web/` reaches `main`.

## What we learned (the exploration)

1. **Export format: GLB.** SolidWorks files glTF/GLB under **"Extended Reality"
   (`.gltf`) / "Extended Reality Binary" (`.glb`)**. Use **`.glb`** — one
   self-contained file with geometry + PBR materials (SolidWorks appearances),
   web-native, loads directly in `<model-viewer>` and three.js.
2. **Draco compression is fine.** `<model-viewer>` decodes
   `KHR_draco_mesh_compression` automatically. It is *not* what broke our first
   export.
3. **Motion-study export is what broke it.** Exporting a `.glb` *with a motion
   study* produced a file the viewer rejected. Root cause: continuous gear
   rotation baked into glTF animation is the format's worst case — glTF
   rotations are **quaternions** (orientations, shortest-path interpolated), so
   a spinning gear can't be represented cleanly as keyframes. **Export mocks
   without the motion study.**
4. **Mocks are tiny.** The planetary-stage mock was ~419 KB — mocks are
   simplified display proxies, so the web stays fast.
5. **Hosting is free + in-repo.** GitHub Pages serves `web/` directly; the app
   lives next to its data.

## Animation strategy (decided)

Two lanes, used for different things:

| Lane | Use for | Why |
|---|---|---|
| **Procedural kinematics** (compute in three.js) | continuous gear motion | Planetary motion is deterministic from the ratios; advancing each part's angle per frame is smooth, tiny, **interactive**, and reacts to config changes |
| **Baked glTF clips** (export from SolidWorks) | discrete motions: exploded views, snap-together/assembly demos | Keyframes shine for short, non-cyclic motion |

**Do not bake continuous spin.** The SolidWorks motion studies stay valuable as:
(a) ground-truth for the relative rates we feed the procedural animation,
(b) the source for discrete baked clips, and (c) a real simulation sandbox the
lightweight web twin approximates.

## Architecture & data the full app needs

```
modules.config.json   (which parts/variant)        ── what to show
mock registry         (part/submodule ↔ mock .glb) ── what to load (light proxies)
named-node GLBs       (components separate+named)   ── what to move/swap
assembly transforms   (positions/axes, via macro)   ── where each part sits
kinematics config     (axis + relative rate/node)   ── how it spins
        ↓
three.js configurator  → assemble, swap on config change, animate
        ↓
"Download these parts" → links to the per-variant bundles (build_bundles.py)
```

- **Renderer:** `<model-viewer>` for the static viewer; **three.js** for the
  interactive/animated configurator (needs node-level control + custom motion).
- **Named nodes:** export mocks *without merging* so components keep their
  assembly names — the app targets `carrier`, `planets`, `sun`, etc.
- **Transforms + structure:** come from a SolidWorks traversal macro (see
  ROADMAP "SolidWorks assembly leverage").

## Phased plan

- **Phase 0 — Static POC** ✅ : one mock `.glb` in `<model-viewer>`.
- **Phase 1 — Gallery:** commit working GLBs; live on Pages; **mock registry**;
  picker shows each module's mock.
- **Phase 2 — Assembled from parts:** named-node GLBs + transforms → three.js
  places each proxy; switch variant/options (swap proxies).
- **Phase 3 — Motion:** procedural gear animation; interactive crank; speed/play
  controls.
- **Phase 4 — Configurator:** full option picking driven by `modules.config.json`,
  live build list, "download these parts" → bundles; baked discrete clips
  (exploded views).

## Open decisions

- Where mock `.glb`s live (regular git vs LFS vs Pages-only assets) — they're
  small, so regular git is fine to start.
- `<model-viewer>` vs three.js threshold — stay on model-viewer through Phase 1;
  move to three.js at Phase 2 when we need per-node control.
- Whether to vendor the viewer library locally (offline / no-CDN) vs CDN.

## Export coordinate systems: print frame vs design frame (critical)

A part has **two** meaningful orientations, and they can differ:

| Export | Frame | Why |
|---|---|---|
| **STL** | **print frame** (sometimes a custom coordinate system) | so it drops into the slicer already oriented to print correctly — critical for 3D printing |
| **GLB** | **design / assembly frame** (default part origin) | so the assembly viewer reconstructs the model from the extracted transforms |

**Rule for the sync-export macro:** STL uses the print coordinate system — a CS
named **`CS_PRINT`** if the part defines one, else the default; **GLB always uses
the default (design) frame.** Mixing them misplaces parts — this is what clocked
the crank shaft 45° off in the first assembly test. The macro should also
**report which parts define a `CS_PRINT`**, surfaced in `parts.csv`, so print
orientations are tracked as source-of-truth data.

## Print-preview mode (planned app feature)

A per-part view showing the **STL sitting on a virtual print bed** (grid at Z=0)
in its print orientation — a fast QA check that each STL will import into the
slicer arranged correctly. A second mode alongside the assembly/configurator
view; both read from the same `_all_parts` library.
