# Part-Renaming & Re-Embossing Migration Checklist

**Full migration** of the new ID scheme (see [NAMING.md](NAMING.md)) onto every
file and model — nothing left on the old scheme. Work it **slowly**; check a box
only once that task is truly done and committed on `feature/part-naming-scheme`.

## Ground rules that keep this safe

Every part's source (`.SLDPRT`) **and** exports (`.STL`/`.STEP`) are renamed to
`<ID>_<slug>` (e.g. `PGC5M05_planetary_gear_core`), and every embossed part is
re-embossed.

- **Rename — never Save-As-then-delete.** A real rename rewrites the references
  inside all 9 assemblies; Save As only redirects *open* assemblies and orphans
  the rest. Use **FeatureManager rename** (with `Tools ▸ Options ▸ System Options
  ▸ External References ▸ "Allow component files to be renamed from FeatureManager
  tree"` enabled) **with all 9 assemblies open** so every reference updates at
  once — or **Pack and Go**.
- **Re-emboss in the renamed `.SLDPRT`**, then re-export its `.STL`/`.STEP`.
- PR #4 / the `feature/part-naming-scheme` branch is the restore point if a
  rename goes sideways.

## Suggested order

1. **Rename pass** — one session, all assemblies open, rename all 47 sources; commit.
2. **Emboss + export pass** — then go part-by-part below.

## Legend & ownership

- ⬜ = to do · ✅ = done · — = not applicable
- ✋ = **you** (SolidWorks) · 🤖 = **me** (git reconcile + `parts.csv` link + validate)
- Filename columns show the shared base name (same for the part's `.SLDPRT`/`.STL`/`.STEP`).

---

## Embossed parts — rename + re-emboss + re-export  (38 parts)

| Old ID | New ID | Old filename | New filename | Files | ✋ Rename + assemblies | ✋ Re-emboss | ✋ Re-export | 🤖 Catalog | Notes |
|---|---|---|---|---|---|---|---|---|---|
| _(new)_ | **`BG15D`** | `bevel_gear_15_drive` | `BG15D_bevel_gear` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ | new part -> confirm emboss `BG15D` |
| `CA-1` | **`CA2`** | `crank_arm-1` | `CA2_crank_arm` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CA-2` | **`CA1`** | `crank_arm-2` | `CA1_crank_arm` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CH-1` | **`CH2`** | `crank_handle-1` | `CH2_crank_handle` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CH-2` | **`CH1`** | `crank_handle-2` | `CH1_crank_handle` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CHG-1` | **`CHG`** | `crank_handle-grip-1` | `CHG_crank_handle_grip` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CP-1` | **`CP`** | `crank_plate-1` | `CP_crank_plate` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CS-1` | **`CSP`** | `crank_spindle-1` | `CSP_crank_spindle` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `CS5-1` | **`CS5`** | `crank_shaft_5-1` | `CS5_crank_shaft` | SLDPRT, STEP, STL | ✅ | ✅ | ✅ | ✅ | done |
| `CSS-1` | **`CSS`** | `crank_shaft_sleeve-1` | `CSS_crank_shaft_sleeve` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `DS5-1` | **`DS5O`** | `drive_shaft_5-1` | `DS5O_drive_shaft` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `DS5-2` | **`DS5OL`** | `drive_shaft_5-2` | `DS5OL_drive_shaft` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `DS5-3` | **`DS5IL`** | `drive_shaft_5-3` | `DS5IL_drive_shaft` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `DS5-3-2` | **`DS5ILT`** | `drive_shaft_5-3-2` | `DS5ILT_drive_shaft` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `DS5-4` | **`DS5I`** | `drive_shaft_5-4` | `DS5I_drive_shaft` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `FC-1` | **`FC`** | `fan_cage-1` | `FC_fan_cage` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `FF-1` | **`FF`** | `fan_funnel-1` | `FF_fan_funnel` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `FP5CC-1` | **`FP5CC`** | `fan_prop_5CC-1` | `FP5CC_fan_prop` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `FP5C-1` | **`FP5C`** | `fan_prop_5C-1` | `FP5C_fan_prop` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `GC1-1` | **`GC1`** | `gearbox_cover_1_stage-1` | `GC1_gearbox_cover` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `GC2-1` | **`GC2`** | `gearbox_cover_2_stage-1` | `GC2_gearbox_cover` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `GC3-1` | **`GC3`** | `gearbox_cover_3_stage-1` | `GC3_gearbox_cover_half` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `H-1` | **`H`** | `handle-1` | `H_handle_half` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HP-1` | **`HP2`** | `handle_plate-1` | `HP2_handle_plate` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HP-2` | **`HP1`** | `handle_plate-2` | `HP1_handle_plate` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HP-3` | **`HP3`** | `handle_plate-3` | `HP3_handle_plate` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HPB-1` | **`HPB2`** | `handle_plate_bracket_half-1` | `HPB2_handle_plate_bracket_half` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HBP-2` | **`HPB1`** | `handle_plate_bracket_half-2` | `HPB1_handle_plate_bracket_half` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `HBP-3` | **`HPB3`** | `handle_plate_bracket_3` | `HPB3_handle_plate_bracket` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PCB5-1` | **`PCB5`** | `planet_carrier_bottom_5-1` | `PCB5_planet_carrier_bottom` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PCT5-1` | **`PCT5`** | `planet_carrier_top_5-1` | `PCT5_planet_carrier_top` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PGC5-1S15` | **`PGC5C15`** | _(no file yet)_ | _(pending)_ `PGC5C15_planetary_gear_core` | — | — | ⬜ | ⬜ | — |  |
| `PGC5-2S05` | **`PGC5M05`** | `planetary_gear_core_5-2S05` | `PGC5M05_planetary_gear_core` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PGC5-2S10` | **`PGC5M10`** | `planetary_gear_core_5-2S10` | `PGC5M10_planetary_gear_core` | STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PGC5-2S15` | **`PGC5M15`** | `planetary_gear_core_5-2S15` | `PGC5M15_planetary_gear_core` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PGC5-3S15` | **`PGC5O15`** | `planetary_gear_core_5-3S15` | `PGC5O15_planetary_gear_core` | SLDPRT, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `PSC-1` | **`PSC`** | `planetary_stage_cover-1` | `PSC_planetary_stage_cover` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ |  |
| `RB-1` | **`RB-2`** | `roller_bearing-1` | `RB-2_roller_bearing` | SLDPRT, STEP, STL | ⬜ | ⬜ | ⬜ | ⬜ | revision bump -> emboss `RB-2` |

## Not embossed (pins, sleeve bearings, tool) — rename + export rename  (10 parts)

Geometry doesn't change, so no re-emboss/re-export — just the file renames.

| Old ID | New ID | Old filename | New filename | Files | ✋ Rename + assemblies | 🤖 Rename exports + catalog | Notes |
|---|---|---|---|---|---|---|---|
| `P-1` | **`PS54`** | `pin-1` | `PS54_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `P-1-1` | **`PS56`** | `pin-1-1` | `PS56_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `P-1-2` | **`PS58`** | `pin-1-2` | `PS58_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `P-2` | **`PL71`** | `pin-2` | `PL71_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `P-2-1` | **`PL69`** | `pin-2-1` | `PL69_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `P-2-2` | **`PL67`** | `pin-2-2` | `PL67_pin` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `PGSB-1` | **`PGSB62`** | `planet_gear_sleeve_bearing-1` | `PGSB62_planet_gear_sleeve_bearing` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `PGSB-2` | **`PGSB64`** | `planet_gear_sleeve_bearing-2` | `PGSB64_planet_gear_sleeve_bearing` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `PGSB-3` | **`PGSB66`** | `planet_gear_sleeve_bearing-3` | `PGSB66_planet_gear_sleeve_bearing` | SLDPRT, STEP, STL | ⬜ | ⬜ |  |
| `Pin Tool` | **`PT`** | `pin_tool` | `PT_pin_tool` | SLDPRT, STL | ⬜ | ⬜ |  |

---

## Assemblies — update during the rename pass

These must be **open during renaming** so their references update, then saved:

- crank_assembly-1 · crank_input · crank_module_2_stage · crank_module_output
- fan_module_2_stage · handle_plate_bracket_3_assembly · handle_plate_bracket_assembly
- planetary_stage_core_mock_display · planetary_stage_core_mock_display_stage2

- [ ] All 9 assemblies re-saved with updated references, no missing-reference warnings
