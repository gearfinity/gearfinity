# Part-Renaming & Re-Embossing Migration Checklist

Tracks every per-part task for rolling the new ID scheme (see
[NAMING.md](NAMING.md)) out to the physical models and files. Work this
**slowly** — check a box only once that task is truly done and committed on
`feature/part-naming-scheme`.

## Ground rules that keep this safe

- **Only exports get renamed.** `.STL`/`.STEP` are renamed to the new ID plus a
  readable slug (e.g. `PGC5M05_planetary_gear_core.STL`). Source
  `.SLDPRT`/`.SLDASM` keep their current filenames, so the **9 assemblies never
  break**.
- **Re-embossing edits the `.SLDPRT` in place** (same filename) — assemblies
  still resolve, they just show the updated part.
- Old physical prints stay valid: their old emboss maps to the new ID via the
  `alias` column in `parts.csv`.

## Legend & ownership

- ⬜ = to do · ✅ = done · — = not applicable
- ✋ = **you** (SolidWorks / CAD) · 🤖 = **me** (git rename + `parts.csv` link + validate)
- **Filename convention:** `<NewID>_<slug>.STL` / `.STEP` — new ID plus a
  readable slug from the part name, e.g. `PGC5M05_planetary_gear_core.STL`.

## Per-part workflow (Section A parts)

1. ✋ Re-emboss the `.SLDPRT` with the new ID, in place.
2. ✋ Re-export the `.STL` (and `.STEP` if present).
3. ✋ Commit the updated source + exports, or tell me they're ready.
4. 🤖 I `git mv` the exports to their new-ID names, update the `parts.csv`
   link, and run the validator.

---

## Section A — Re-emboss + re-export + rename  (23 parts)

| New ID | Current source name | Files | ✋ Re-emboss | ✋ Re-export | 🤖 Rename + catalog | Notes |
|---|---|---|---|---|---|---|
| **BG15D** | `bevel_gear_15_drive` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | new part -> confirm emboss `BG15D` |
| **CA2** | `crank_arm-1` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **CA1** | `crank_arm-2` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **CH2** | `crank_handle-1` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **CH1** | `crank_handle-2` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **CSP** | `crank_spindle-1` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **DS5O** | `drive_shaft_5-1` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **DS5OL** | `drive_shaft_5-2` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **DS5IL** | `drive_shaft_5-3` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **DS5ILT** | `drive_shaft_5-3-2` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **DS5I** | `drive_shaft_5-4` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **HP2** | `handle_plate-1` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **HP1** | `handle_plate-2` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **HP3** | `handle_plate-3` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **HPB2** | `handle_plate_bracket_half-1` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **HPB1** | `handle_plate_bracket_half-2` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **HPB3** | `handle_plate_bracket_3` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **PGC5C15** | _(no file yet)_ | — | ⬜ | ⬜ | — |  |
| **PGC5M05** | `planetary_gear_core_5-2S05` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **PGC5M10** | `planetary_gear_core_5-2S10` | STL | ⬜ | ⬜ | ⬜ |  |
| **PGC5M15** | `planetary_gear_core_5-2S15` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ |  |
| **PGC5O15** | `planetary_gear_core_5-3S15` | SLDPRT, STL | ⬜ | ⬜ | ⬜ |  |
| **RB-2** | `roller_bearing-1` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | revision bump -> emboss `RB-2` |

## Section B — Rename only (not embossed: pins, sleeve bearings, tool)  (10 parts)

These have no embossing, so they just need their export files renamed.

| New ID | Current source name | Files | 🤖 Rename + catalog | Notes |
|---|---|---|---|---|
| **PS54** | `pin-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PS56** | `pin-1-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PS58** | `pin-1-2` | SLDPRT, STEP, STL | ⬜ |  |
| **PL71** | `pin-2` | SLDPRT, STEP, STL | ⬜ |  |
| **PL69** | `pin-2-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PL67** | `pin-2-2` | SLDPRT, STEP, STL | ⬜ |  |
| **PGSB62** | `planet_gear_sleeve_bearing-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PGSB64** | `planet_gear_sleeve_bearing-2` | SLDPRT, STEP, STL | ⬜ |  |
| **PGSB66** | `planet_gear_sleeve_bearing-3` | SLDPRT, STEP, STL | ⬜ |  |
| **PT** | `pin_tool` | SLDPRT, STL | ⬜ |  |

## Section C — Rename only (ID unchanged; old emboss still valid)  (15 parts)

No re-embossing needed — the existing emboss is still correct via `alias`.
Renaming their export files to the ID is optional tidy-up; do it last.

| New ID | Current source name | Files | 🤖 Rename + catalog | Notes |
|---|---|---|---|---|
| **CHG** | `crank_handle-grip-1` | SLDPRT, STL | ⬜ |  |
| **CP** | `crank_plate-1` | SLDPRT, STEP, STL | ⬜ |  |
| **CS5** | `crank_shaft_5-1` | SLDPRT, STEP, STL | ⬜ |  |
| **CSS** | `crank_shaft_sleeve-1` | SLDPRT, STEP, STL | ⬜ |  |
| **FC** | `fan_cage-1` | SLDPRT, STEP, STL | ⬜ |  |
| **FF** | `fan_funnel-1` | SLDPRT, STEP, STL | ⬜ |  |
| **FP5CC** | `fan_prop_5CC-1` | SLDPRT, STEP, STL | ⬜ |  |
| **FP5C** | `fan_prop_5C-1` | SLDPRT, STL | ⬜ |  |
| **GC1** | `gearbox_cover_1_stage-1` | SLDPRT, STEP, STL | ⬜ |  |
| **GC2** | `gearbox_cover_2_stage-1` | SLDPRT, STEP, STL | ⬜ |  |
| **GC3** | `gearbox_cover_3_stage-1` | SLDPRT, STEP, STL | ⬜ |  |
| **H** | `handle-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PCB5** | `planet_carrier_bottom_5-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PCT5** | `planet_carrier_top_5-1` | SLDPRT, STEP, STL | ⬜ |  |
| **PSC** | `planetary_stage_cover-1` | SLDPRT, STEP, STL | ⬜ |  |

---

## Assemblies (reference only — nothing to do)

Because we never rename source `.SLDPRT`/`.SLDASM`, these stay intact:

- crank_assembly-1, crank_input, crank_module_2_stage, crank_module_output,
  fan_module_2_stage, handle_plate_bracket_3_assembly,
  handle_plate_bracket_assembly, planetary_stage_core_mock_display,
  planetary_stage_core_mock_display_stage2

_If you later decide to rename source files too, that becomes a separate phase
done **through SolidWorks** (Pack-and-Go / rename) so references update._
