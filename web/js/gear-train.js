// gear-train.js — Gearfinity planetary kinematics (pure math, no three.js).
//
// EXACTNESS MODEL
//   Rates are exact rational functions of TOOTH COUNTS. With real counts,
//   gears that START perfectly meshed (poses from the SolidWorks .bom.json)
//   STAY meshed. NOMINAL_TEETH below are the REAL counts, recovered from the
//   original OpenSCAD source (planetary_gear_stage_no_bearings.scad):
//     np = 22 (given) -> ns = 14, nr = 58  =>  ratio = 72/14 = 36/7 ~ 5.1429
//   "5:1" is the marketing name; the true ratio is 36:7. Verified against the
//   display assembly: the scad's planet-orbit radius (27.2 mm) matches the
//   PGSB62 bearing stations in the .bom.json exactly.
//
// CONVENTION (ring fixed, sun driven, carrier output — the Gearfinity stack):
//   Willis: (ω_sun − ω_carrier) / (ω_ring − ω_carrier) = −Z_ring / Z_sun
//   ratio R        = 1 + Z_ring / Z_sun          (sun revs per carrier rev)
//   ω_carrier      = ω_sun / R
//   ω_planet(abs)  = ω_carrier · (1 − Z_ring / Z_planet)   (spin about own axis)
//   All rates below are multiples of the STAGE INPUT (its sun's) speed.
//   Sign convention: + = same direction as the stage input.

export const NOMINAL_TEETH = { sun: 14, planet: 22, ring: 58 }; // exact: 36/7 per stage

/** Rates for one stage, as multiples of that stage's sun speed. */
export function stageRates(teeth = NOMINAL_TEETH) {
  const { sun: Zs, planet: Zp, ring: Zr } = teeth;
  const R = 1 + Zr / Zs;
  const carrier = 1 / R;
  return {
    ratio: R,
    sun: 1,
    carrier,
    planet: carrier * (1 - Zr / Zp), // negative: planets counter-rotate
    ring: 0,
  };
}

/**
 * Chain stages the Gearfinity way: stage k's carrier drives stage k+1's sun.
 * `stages` = array of tooth-count objects (or null/undefined for nominal).
 * Returns { totalRatio, stages: [{ sun, carrier, planet, ring, ratio }] }
 * with every rate ABSOLUTE — a multiple of the train input (crank) speed.
 */
export function chainStages(stages) {
  let input = 1; // current stage's sun speed, in crank units
  const out = [];
  for (const teeth of stages) {
    const r = stageRates(teeth || NOMINAL_TEETH);
    out.push({
      ratio: r.ratio,
      sun: input * r.sun,
      carrier: input * r.carrier,
      planet: input * r.planet,
      ring: 0,
    });
    input *= r.carrier; // carrier couples into the next sun
  }
  return { totalRatio: out.length ? 1 / input : 1, stages: out };
}

/** Angle (rad) of each role at crank angle theta. Convenience for animators. */
export function anglesAt(chain, theta) {
  return chain.stages.map(s => ({
    sun: s.sun * theta,
    carrier: s.carrier * theta,
    planet: s.planet * theta,
    ring: 0,
  }));
}
