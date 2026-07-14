# Mock display models (GLB)

Drop exported **`.glb`** files here (SolidWorks: *Save As → Extended Reality
Binary (\*.glb)*), exported from the `*_mock_display` assemblies.

- These are **display proxies** for the web viewer — lightweight, with
  appearances/colors. They are **not** the printable files (those stay in
  `_all_parts/`, indexed by `parts.csv`).
- Name each file after the mock assembly, e.g. `planetary_stage_core_mock_display.glb`.
- After adding one, register it in the `MODELS` list in `../index.html` so it
  shows up in the picker.

Local preview: from the repo root run `python -m http.server` and open
`http://localhost:8000/web/` (model-viewer needs http, not a `file://` path).
