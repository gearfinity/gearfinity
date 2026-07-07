# SolidWorks macros

## DumpAssemblyBOM

Extracts the engineering truth from an assembly so we can derive accurate
bills of materials (including pin counts) and component placements.

### Run it
1. Open an assembly in SolidWorks (e.g. `fan_module_2_stage.SLDASM`).
2. **Tools ▸ Macro ▸ New…**, save as `DumpAssemblyBOM.swp`.
3. Paste the contents of [`DumpAssemblyBOM.vba`](DumpAssemblyBOM.vba) over the
   template, then **Run** (F5).
4. It writes **`<assembly>.bom.json`** next to the assembly and confirms.

> Late binding — no reference setup needed. Should work across SolidWorks
> versions. (Not yet tested live — if it errors, note the line and we'll adjust.)

### Output schema (`*.bom.json`)
```json
{
  "assembly": "fan_module_2_stage.SLDASM",
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
- **Print orientation:** STL uses a coordinate system named **`CS_PRINT`** if the
  part has one, else the default origin. Give a part a `CS_PRINT` CS when it needs
  a specific slicer orientation.
- Untested live — report any "constant not defined" / error line and I'll fix it.
- Next: a GLB export pass (design frame) can be added for the viewer.
