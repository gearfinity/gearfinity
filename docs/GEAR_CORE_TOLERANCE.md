# Planetary Gear Core — Tolerance / Tight-Fit Method

The planetary gear cores print **in place** (sun + planets + ring as one print).
The fit between the meshing gears is the trickiest, most-varied thing in the whole
kit, so this documents how we handle it.

## Why two presets: Standard and Tight

- **Standard** (the original fit) runs with the least friction — most efficient,
  best for speed. But when a core is **not** held inside a full stage assembly,
  the planets can **slip/skip** under load (the stage normally keeps them seated).
  A user can't easily fix a core that skips — they may not even realize it's
  happening — so shipping a too-loose standalone core is a support risk.
- **Tight** meshes the gears more firmly → **much less skipping**, at the cost of
  slightly more friction (marginally less efficient / more input force). Good as a
  robust, ship-as-is standalone core.

We keep the user experience **print-as-is** — no slicer scaling or advanced steps
on the user's end. Both presets are real, embossed SolidWorks parts; the user just
picks the one that suits their printer. (A **Loose** preset may be added later if
printer feedback shows a need — deferred until there's real data.)

IDs: `PGC5M` (standard) / `PGC5MT` (tight); likewise `PGC5O`/`PGC5OT`,
`PGC5C`/`PGC5CT`. See [NAMING.md](../NAMING.md).

## The SolidWorks method — scale **before** the interface cuts

The key technique (keeps the gear mesh tight without loosening how other parts
fit into the core):

> Place the `Scale` features **above** the shaft/sleeve profile subtractions in
> the feature tree.

That way the scale enlarges the gear bodies (tightening the mesh), and the bores
— sun drive-shaft bore, planet/sleeve bores — are then cut at their **nominal**
sizes *into* the already-scaled gears. Tightening and interface fit are decoupled
automatically; no need to re-cut anything. (Scaling *after* the cuts would enlarge
the bores too — e.g. the drive shaft would fit loose in the sun.)

## Scaling factors — 5:1 ratio cores

| Gear | Scale factor |
|---|---|
| Planet gears | **1.0081** |
| Sun gear | **1.01** |

_Subject to change — update here if re-tuned. Different ratios will have their own
factors._

### How these were derived
Scale a gear up until **"merge" artifacts** appear in the sliced profile — where
the print traces fuse adjacent gears (planet↔ring, then sun↔planet) — then back
off slightly until the artifacts disappear. That finds the **tightest fit that
won't fuse during printing**. Done for the planets first (vs the ring), then the
sun (vs the planets).

## Applying it per geometry
The tight variant is built in each core's SolidWorks file (per slot style —
middle / outer / closed), using the same scale-before-subtractions approach and
the factors above, then re-embossed to the tight ID. Fundamental geometry changes
still go through the parametric OpenSCAD source; tolerance never does.
