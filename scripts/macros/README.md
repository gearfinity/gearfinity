# SolidWorks macros

## DumpAssemblyBOM

Extracts the engineering truth from an assembly so we can derive accurate
bills of materials (including pin counts) and component placements.

### Run it
1. Open an assembly in SolidWorks (e.g. `fan_module_2_stage.SLDASM`).
2. **Activate the configuration** you want to capture — variant masters
   (e.g. a `fan_module` with 1/2/3-stage configs) are dumped once per config.
3. **Tools ▸ Macro ▸ New…**, save as `DumpAssemblyBOM.swp`.
4. Paste the contents of [`DumpAssemblyBOM.vba`](DumpAssemblyBOM.vba) over the
   template, then **Run** (F5).
5. It writes **`<assembly>.<config>.bom.json`** next to the assembly and
   confirms — per-config filenames, so variant dumps never overwrite each other.

> Late binding — no reference setup needed. Should work across SolidWorks
> versions. (Not yet tested live — if it errors, note the line and we'll adjust.)

### Output schema (`*.bom.json`)
```json
{
  "assembly": "fan_module_2_stage.SLDASM",
  "configuration": "Default",
  "components": [
    {
      "name": "crank_shaft_5-1-1",        // instance name
      "file": "CS5_crank_shaft.SLDPRT",   // referenced file (leaf)
      "suppressed": false,
      "transform": [r11,r12,r13, r21,r22,r23, r31,r32,r33, x,y,z]
      // 3x3 row-major rotation + translation in METRES
    }
  ]
}
```

### Ingest it
```
python ../ingest_assembly.py <assembly>.bom.json     # one file
python ../ingest_assembly.py --all                   # every *.bom.json in _all_parts/
```
This maps each component's file → a part ID (via `parts.csv` links), counts
instances, and prints the BOM with real quantities. Sub-assemblies are skipped
because `GetComponents(False)` already returns their child parts (so leaf parts
are counted once, at full quantity).

### What it unlocks
- **Real quantities** for `modules.config.json` — replaces the guessed
  sleeve-bearing count and the `TBD` pin counts with ground truth.
- **Component transforms** for the web viewer (Path 3) — where each part sits,
  so the configurator can assemble proxies and animate them.

---

## BatchExportParts

Re-exports **STL (+ STEP)** for every part in `_all_parts/` whose `.SLDPRT` is
**newer than its `.STL`** (so it only re-exports what you changed). This is the
first piece of the **sync-export automation** — no more hand-exporting each part.

- Run: Tools ▸ Macro ▸ New… → paste [`BatchExportParts.vba`](BatchExportParts.vba)
  → save as `.swp` → F5.
- `FORCE_ALL = True` exports everything regardless of dates.
- **Print orientation (STL):** the export uses `ModelDoc2.SaveAs3`, which honors the
  persistent STL "Output coordinate system" setting. Set that to **`CS_PRINT`** once
  in the STL export dialog, then give any part a `CS_PRINT` coordinate system when it
  needs a specific slicer orientation (else it exports from the default origin).
  `ModelDocExtension.SaveAs` does **not** honor this — that's why we use `SaveAs3`.
- **STEP is local-only:** STEP files are **not** committed to git (they're huge — see
  `.gitignore`). The macro still exports them so you can build `source.zip` bundles
  and publish CAD via **GitHub Releases**. STEP ignores `CS_PRINT` (always design
  frame) — that's fine, STEP is for CAD, not slicing. Set `EXPORT_STEP = False` for
  faster STL-only runs.

---

## ExportAssemblyGLBs

Exports every **unique component part** of the **active assembly** to
**GLB** (Extended Reality Binary) in `web/parts/` — the per-part display
assets the web configurator loads. Instances share one file (3 planets → 1
GLB), so one run covers the whole assembly. Date-checked like
BatchExportParts (`FORCE_ALL = True` to re-export everything).

- Run: open the display assembly → Tools ▸ Macro ▸ New… → paste
  [`ExportAssemblyGLBs.vba`](ExportAssemblyGLBs.vba) → save as `.swp` → F5.
- GLB exports in the part's **design frame + metres** — exactly what the
  `.bom.json` transforms expect. (STL = print frame; GLB = design frame.)
- Output goes to `web/parts/` (takes precedence over `web/models/`, where
  whole-assembly mocks live — avoids the ring-part/assembly name collision).

### Display-assembly workflow (one assembly → web scene)
1. Open the display assembly (e.g. `planetary_stage_core_mock_display.SLDASM`).
2. Run **DumpAssemblyBOM** → `<assembly>.bom.json` (poses).
3. Run **ExportAssemblyGLBs** → `web/parts/*.glb` (geometry).
4. `python scripts/gen_kinematic_scene.py <bom> --out cfg_<module>_<variant>`
   → the configurator renders + animates the real assembly.

Full pipeline doc (modeling conventions, kinematics, gotchas):
[docs/ASSEMBLY_TO_WEB.md](../../docs/ASSEMBLY_TO_WEB.md)
