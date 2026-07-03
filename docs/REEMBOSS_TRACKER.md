# Re-embossing Tracker

The file renames are done ([MIGRATION_CHECKLIST.md](../MIGRATION_CHECKLIST.md));
this tracks bringing the **embossed geometry** onto the new IDs. Pins, sleeve
bearings, and the pin tool aren't embossed, so they're not listed. **37 parts to go.**

## How to check a box
- **In VS Code:** open this file, open the **Markdown Preview** (`Ctrl+Shift+V`),
  and **click a checkbox** — VS Code toggles it in the file. Save, and it's tracked.
- **Editing source:** change `- [ ]` to `- [x]`.
- *(On github.com the boxes render but aren't clickable in the file view — they
  are clickable if we mirror this list into an Issue/PR. Ask if you'd like that.)*

## Per-part workflow
1. Open the part's `.SLDPRT`, update the embossed text to the **new ID**.
2. Re-export its **STL** (print frame / `CS_PRINT`) and **STEP** — overwriting
   the already-renamed files (same names, new geometry).
3. Check the box here.
4. Tell me (batches are fine) and I'll commit the updated files.

## Parts

- [ ] **BG15D** — emboss `BG15D` (was `(new)`) · `BG15D_bevel_gear`
- [ ] **CA2** — emboss `CA2` (was `CA-1`) · `CA2_crank_arm`
- [ ] **CA1** — emboss `CA1` (was `CA-2`) · `CA1_crank_arm`
- [ ] **CH2** — emboss `CH2` (was `CH-1`) · `CH2_crank_handle`
- [ ] **CH1** — emboss `CH1` (was `CH-2`) · `CH1_crank_handle`
- [ ] **CHG** — emboss `CHG` (was `CHG-1`) · `CHG_crank_handle_grip`
- [ ] **CP** — emboss `CP` (was `CP-1`) · `CP_crank_plate`
- [ ] **CSP** — emboss `CSP` (was `CS-1`) · `CSP_crank_spindle`
- [x] **CS5** — emboss `CS5` (was `CS5-1`) · `CS5_crank_shaft`  ✅ done
- [ ] **CSS** — emboss `CSS` (was `CSS-1`) · `CSS_crank_shaft_sleeve`
- [ ] **DS5O** — emboss `DS5O` (was `DS5-1`) · `DS5O_drive_shaft`
- [ ] **DS5OL** — emboss `DS5OL` (was `DS5-2`) · `DS5OL_drive_shaft`
- [ ] **DS5IL** — emboss `DS5IL` (was `DS5-3`) · `DS5IL_drive_shaft`
- [ ] **DS5ILT** — emboss `DS5ILT` (was `DS5-3-2`) · `DS5ILT_drive_shaft`
- [ ] **DS5I** — emboss `DS5I` (was `DS5-4`) · `DS5I_drive_shaft`
- [ ] **FC** — emboss `FC` (was `FC-1`) · `FC_fan_cage`
- [ ] **FF** — emboss `FF` (was `FF-1`) · `FF_fan_funnel`
- [ ] **FP5CC** — emboss `FP5CC` (was `FP5CC-1`) · `FP5CC_fan_prop`
- [ ] **FP5C** — emboss `FP5C` (was `FP5C-1`) · `FP5C_fan_prop`
- [ ] **GC1** — emboss `GC1` (was `GC1-1`) · `GC1_gearbox_cover`
- [ ] **GC2** — emboss `GC2` (was `GC2-1`) · `GC2_gearbox_cover`
- [ ] **GC3** — emboss `GC3` (was `GC3-1`) · `GC3_gearbox_cover_half`
- [ ] **H** — emboss `H` (was `H-1`) · `H_handle_half`
- [ ] **HP2** — emboss `HP2` (was `HP-1`) · `HP2_handle_plate`
- [ ] **HP1** — emboss `HP1` (was `HP-2`) · `HP1_handle_plate`
- [ ] **HP3** — emboss `HP3` (was `HP-3`) · `HP3_handle_plate`
- [ ] **HPB2** — emboss `HPB2` (was `HPB-1`) · `HPB2_handle_plate_bracket_half`
- [ ] **HPB1** — emboss `HPB1` (was `HBP-2`) · `HPB1_handle_plate_bracket_half`
- [ ] **HPB3** — emboss `HPB3` (was `HBP-3`) · `HPB3_handle_plate_bracket`
- [ ] **PCB5** — emboss `PCB5` (was `PCB5-1`) · `PCB5_planet_carrier_bottom`
- [ ] **PCT5** — emboss `PCT5` (was `PCT5-1`) · `PCT5_planet_carrier_top`
- [ ] **PGC5C15** — _blocked: no file yet_ (was PGC5-1S15)
- [ ] **PGC5M05** — emboss `PGC5M05` (was `PGC5-2S05`) · `PGC5M05_planetary_gear_core`
- [ ] **PGC5M10** — emboss `PGC5M10` (was `PGC5-2S10`) · `PGC5M10_planetary_gear_core`
- [ ] **PGC5M15** — emboss `PGC5M15` (was `PGC5-2S15`) · `PGC5M15_planetary_gear_core`
- [ ] **PGC5O15** — emboss `PGC5O15` (was `PGC5-3S15`) · `PGC5O15_planetary_gear_core`
- [ ] **PSC** — emboss `PSC` (was `PSC-1`) · `PSC_planetary_stage_cover`
- [ ] **RB-2** — emboss `RB-2` (was `RB-1`) · `RB-2_roller_bearing`
