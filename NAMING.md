# Gearfinity Part Naming Strategy

> **Status: v0.1 — proposed, pending sign-off.** The *philosophy* (Part 1) is
> settled. The *grammar and per-family formats* (Parts 2–4) are a concrete
> proposal applying that philosophy; specific codes may still change.

This document defines how Gearfinity parts are identified. It exists because
identity is the one thing we can't cleanly change later: IDs get embossed into
physical prints, cited in build videos, and referenced in remixes. Getting the
*rules* right once means we never have to restructure the catalog again.

---

## Part 1 — Philosophy

These principles are the "why." Every rule in Parts 2–4 follows from them.

### 1. The ID is meaningful — every character earns its place

Gearfinity is a bench-assembled maker kit. A builder reading `FP5C` and knowing
instantly "5-blade clockwise fan prop" is real value. So we use **significant**
(meaningful) IDs, not opaque serial numbers. There are **no bare, meaningless
index numbers anywhere** — the one place a number trails the ID, it means
something specific (the revision; see §6).

### 2. Each field's meaning is fixed and documented — per family

The catalog's original confusion came from one field carrying two meanings over
time: a dash-number that *started* as "the order I made this part in" was later
re-read as "the part's size/width." `HP-1` ended up being the **2-stage** plate.
Two meanings, one field, no written rule — so it drifted.

The cure is not a meaningless number; it's the opposite: **every field has a
single, fixed, written-down meaning.** A number that means "width in stages" can
never be mistaken for "creation order," because creation order isn't encoded at
all. Where a family's format is ambiguous, this document is the source of truth.

### 3. Only *stable design parameters* go in the ID; everything else is a column

An attribute belongs in the embossed ID only if it is (a) stable — it won't be
"corrected" later — and (b) genuinely useful at a glance. Gear ratio, stage
count, tooth count, blade count, slot geometry, design tolerance: stable, encode
them. Measured ODs, exact lengths, "prints a little loose on my printer,"
material notes: volatile or empirical, they live in **`parts.csv` columns**,
never in the ID.

### 4. Identity is 1:1:1 — design parameters ↔ file ↔ ID

Because these parts are *defined by their files*, not measured from them, a value
like the `0.05` in a tolerance code is a **design input that generated the
geometry**, not an observation that could later be found wrong. So:

> one set of design parameters → one deterministic file → one ID.

This is why a meaningful ID can be embossed safely: the code is permanently true
of that file. It also gives us a crisp rule for change (§6).

### 5. Uniqueness comes from real attributes, not counters

If two parts would share an ID, the fix is to encode the attribute that actually
distinguishes them — not to append a tie-breaker. Two parts with identical design
parameters *are the same part*. A complete attribute set makes counters
unnecessary.

### 6. Variation vs. revision — the only two kinds of change

| | What changed | ID | File |
|---|---|---|---|
| **Variation** | any design parameter (tolerance, ratio, length, teeth…) | **new ID** | new file |
| **Revision** | nothing about the design — the model itself was fixed/improved (cleaner mesh, fixed defect, better printability) | **same ID, bump revision** | same logical part, updated file |

The **revision** is an *optional* trailing `-N`, shown only when it reaches 2 or
more. Revision 1 is the default and is **omitted** (see §7), so a Crank Plate is
just `CP`; improve that model and the next iteration becomes `CP-2`. A *new
tolerance* is never a revision — it's a variation with its own ID. A part already
embossed `CP-1` stays valid: "revision 1" is simply written out, not wrong.

### 7. Defaults are omitted; only exceptions are marked

To keep IDs short, each family declares default attribute values that are left
*out* of the ID. Only non-default values appear. (E.g. gear cores default to a
sleeve bearing, so sleeve is unmarked; a future roller-bearing core would carry
an explicit marker.) This keeps the common case compact and the rare case
unambiguous.

### 8. IDs are immutable; renames go through aliases, never in place

Once an ID is published it is never silently changed. Superseded IDs are
preserved forever in the `alias` column and in the migration log (Part 5), so
anything that cites an old code can still resolve it.

### 9. Future-proofing = columns, not re-keying

A new *dimension* of variation (a new material axis, handedness, a new module)
becomes a **new column** in `parts.csv`. It never forces a redesign of existing
IDs. This is what makes the scheme final.

---

## Part 2 — The identity layers

Each part carries several identifiers, each with one job:

| Layer | Example | Job |
|---|---|---|
| **Part ID** | `PGC5M05` | Canonical key; embossed onto the model where surface allows |
| **Revision** | optional trailing `-N` (omitted for rev 1) | Which iteration of that exact part (§6) |
| **Attribute columns** | ratio=5, slot=middle, tolerance=0.05 | The full, queryable truth; extensible |
| **Descriptive label** | "Planetary Gear Core — 5:1, middle-slot, sleeve, 0.05 mm" | Human-readable; **auto-generated from columns** (never hand-typed, so never typo'd) |
| **Alias(es)** | `PGC5-2S05` | Legacy IDs people already cite |
| **Filename** | `<ID>_<slug>` (e.g. `PGC5M05_planetary_gear_core`) | Folder ↔ emboss ↔ catalog all agree |

Parts too small to emboss (pins, small bearings) still have a Part ID — it just
isn't physically on the part. They're identified by context (packaging, slicer
plate, catalog).

---

## Part 3 — Grammar

```
ID  =  FAMILY [PRIMARY] [SEGMENT...] [ "-" REV ]
```

- **FAMILY** — a registered acronym (Part 4). No two families share one.
- **PRIMARY** — the family's single defining number, glued to the family code.
  Its meaning is fixed *per family* (ratio for drivetrain, blades for props,
  stages for covers, width for handle plates, etc.) and documented in Part 4.
- **SEGMENT** — additional fixed-meaning codes for multi-attribute parts;
  letters for categories, digits for quantities. Default values are omitted (§7).
- **REV** — *optional* trailing `-N`, the revision (§6). Omitted for revision 1
  (the default); appears only once a part reaches revision 2 or more.

> **Hyphen invariant:** in the new scheme a hyphen appears **only** before the
> revision number. Everything else is glued (`DS5OL`, `PGC5M05`). So a part ID
> with no `-` is revision 1; a `-N` always means "revision N." This makes IDs
> trivial to parse and impossible to confuse with the old multi-dash forms.

### Numeric encoding conventions

| Quantity | Encoding | Example |
|---|---|---|
| Ratio, counts (stages, blades, teeth, arms, handles, width) | integer | `5`, `2` |
| Sub-millimeter design tolerance | hundredths, 2 digits | `05` = 0.05 mm |
| Diameters / bores (catalog-only parts) | tenths | `54` = 5.4 mm |

### Category-letter legend

| Letters | Meaning |
|---|---|
| `C` / `CC` | rotation: clockwise / counter-clockwise (fan props) |
| `I` / `O` | drive direction: input / output (drive shafts) |
| `L` | lockable (drive shafts) |
| `T` | tight-fit variant (drive shafts) |
| `C` / `M` / `O` | ring slot style: closed / middle / outer (gear cores) |
| `S` / `L` | pin size: short / long |
| `D` / `N` | gear role: drive / driven |

---

## Part 4 — Family registry & formats

> ⚠️ **Collision fix:** *Crank Spindle* and *Crank Shaft* both reduce to `CS`.
> Crank Shaft keeps `CS`; Crank **Sp**indle becomes **`CSP`**.

| Family | Code | Format | Reads as |
|---|---|---|---|
| Crank Arm | `CA` | `CA<arms>` | `CA2` = 2-arm |
| Crank Handle | `CH` | `CH<handles>` | `CH1` = 1-handle |
| Crank Handle Grip | `CHG` | `CHG` | (single) |
| Crank Plate | `CP` | `CP` | (single) |
| Crank Spindle | `CSP` | `CSP` | (single) |
| Crank Shaft | `CS` | `CS<ratio>` | `CS5` = 5:1 |
| Crank Shaft Sleeve | `CSS` | `CSS` | (single) |
| Drive Shaft | `DS` | `DS<ratio><I/O>[L][T]` | `DS5OL` = 5:1 output, lockable |
| Fan Cage | `FC` | `FC` | (single) |
| Fan Funnel | `FF` | `FF` | (single) |
| Fan Prop | `FP` | `FP<blades><C/CC>` | `FP5C` = 5-blade clockwise |
| Gearbox Cover | `GC` | `GC<stages>` | `GC2` = 2-stage |
| Handle (Half) | `H` | `H` | (single) |
| Handle Plate | `HP` | `HP<width>` | `HP3` = 3-stage width |
| Handle Plate Bracket | `HPB` | `HPB<width>` | `HPB2` = 2-stage |
| Pin | `P` | `P<S/L><dia×10>` | `PS54` = short, 5.4 mm |
| Pin Tool | `PT` | `PT` | (single) |
| Planet Carrier Bottom | `PCB` | `PCB<ratio>` | `PCB5` |
| Planet Carrier Top | `PCT` | `PCT<ratio>` | `PCT5` |
| Planetary Gear Core | `PGC` | `PGC<ratio><slot><tol>` | `PGC5M05` = 5:1, middle slot, 0.05 mm (sleeve default) |
| Planet Gear Sleeve Bearing | `PGSB` | `PGSB<bore×10>` | `PGSB62` = 6.2 mm bore |
| Planetary Stage Cover | `PSC` | `PSC` | (single) |
| Roller Bearing | `RB` | `RB` (bore added only if >1) | (single today) |
| Bevel Gear | `BG` | `BG<teeth><D/N>` | `BG15D` = 15-tooth drive |

### Per-family defaults (omitted from the ID)

- **Planetary Gear Core:** bearing = sleeve. A non-sleeve core marks its type.
- **Pins:** fit = standard. (Tight/loose pins are distinguished by their diameter,
  which is the real differentiator; the named fit lives in a column.)
- **Drive Shaft:** non-lockable, standard fit. `L`/`T` appear only when true.

---

## Part 5 — Change management & the migration log

When existing IDs change, three things keep it graceful:

1. **`alias` column** in `parts.csv` holds every prior ID for that part
   (semicolon-separated), forever.
2. **Migration log** — a public old → new table (kept in `parts.csv` via `alias`,
   and summarized here) so anyone with an old code can find the current part.
3. **Embossing & file renames** — when a part adopts a new ID, its model is
   re-embossed and **all** of its files (`.SLDPRT`/`.STL`/`.STEP`) are renamed to
   `<ID>_<slug>`. Source-file renames are always done with a reference-preserving
   SolidWorks rename — **Pack and Go**, or FeatureManager rename with every
   assembly open — **never Save-As-then-delete**, so assemblies never lose their
   components. Until a physical part is re-embossed, its old emboss still resolves
   via the `alias`.

Revisions never invalidate old physical parts: a part with no suffix (or an
explicit `-1`) is revision 1, and a later `-2` is visibly the newer iteration.

### Old → new migration table

Complete one-time mapping from the previously published IDs to the new scheme.
Every old ID is also preserved in the `alias` column of `parts.csv`.

| Old ID | New ID |
|---|---|
| CA-1 | `CA2` |
| CA-2 | `CA1` |
| CH-1 | `CH2` |
| CH-2 | `CH1` |
| CHG-1 | `CHG` |
| CP-1 | `CP` |
| CS-1 | `CSP` |
| CS5-1 | `CS5` |
| CSS-1 | `CSS` |
| DS5-1 | `DS5O` |
| DS5-2 | `DS5OL` |
| DS5-3 | `DS5IL` |
| DS5-3-2 | `DS5ILT` |
| DS5-4 | `DS5I` |
| FC-1 | `FC` |
| FF-1 | `FF` |
| FP5CC-1 | `FP5CC` |
| FP5C-1 | `FP5C` |
| GC1-1 | `GC1` |
| GC2-1 | `GC2` |
| GC3-1 | `GC3` |
| H-1 | `H` |
| HP-1 | `HP2` |
| HP-2 | `HP1` |
| HP-3 | `HP3` |
| HPB-1 | `HPB2` |
| HBP-2 | `HPB1` |
| HBP-3 | `HPB3` |
| P-1 | `PS54` |
| P-1-1 | `PS56` |
| P-1-2 | `PS58` |
| P-2 | `PL71` |
| P-2-1 | `PL69` |
| P-2-2 | `PL67` |
| PCB5-1 | `PCB5` |
| PCT5-1 | `PCT5` |
| PGC5-1S15 | `PGC5C15` |
| PGC5-2S05 | `PGC5M05` |
| PGC5-2S10 | `PGC5M10` |
| PGC5-2S15 | `PGC5M15` |
| PGC5-3S15 | `PGC5O15` |
| PGSB-1 | `PGSB62` |
| PGSB-2 | `PGSB64` |
| PGSB-3 | `PGSB66` |
| Pin Tool | `PT` |
| PSC-1 | `PSC` |
| RB-1 | `RB-2` *(revision bump — model was improved)* |
| *(new part)* | `BG15D` |
