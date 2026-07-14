// Gearfinity planetary kinematics — TypeScript port of web/js/gear-train.js.
//
// EXACTNESS: rates are exact rational functions of tooth counts. The REAL
// counts (recovered from the original OpenSCAD source) are 14/22/58 —
// the true ratio is 36:7 ≈ 5.1429 per stage ("5:1" is the nominal name).
// Gears that start perfectly meshed (poses from the SolidWorks .bom.json)
// stay meshed because the rates are exact.
//
// Convention (ring fixed): Willis equation
//   ratio R       = 1 + Zr/Zs            (sun revs per carrier rev)
//   ω_carrier     = ω_sun / R
//   ω_planet(abs) = ω_carrier · (1 − Zr/Zp)
// All rates are multiples of the stage input (its sun's) speed.

export interface Teeth {
  sun: number;
  planet: number;
  ring: number;
}

export interface StageRates {
  ratio: number;
  sun: number;
  carrier: number;
  planet: number;
  ring: number;
}

export const NOMINAL_TEETH: Teeth = { sun: 14, planet: 22, ring: 58 };

export function stageRates(teeth: Teeth = NOMINAL_TEETH): StageRates {
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

/** Chain stages carrier -> next sun. Rates come out ABSOLUTE (x input). */
export function chainStages(stages: (Teeth | null | undefined)[]): {
  totalRatio: number;
  stages: StageRates[];
} {
  let input = 1;
  const out: StageRates[] = [];
  for (const teeth of stages) {
    const r = stageRates(teeth ?? NOMINAL_TEETH);
    out.push({
      ratio: r.ratio,
      sun: input * r.sun,
      carrier: input * r.carrier,
      planet: input * r.planet,
      ring: 0,
    });
    input *= r.carrier;
  }
  return { totalRatio: out.length ? 1 / input : 1, stages: out };
}
