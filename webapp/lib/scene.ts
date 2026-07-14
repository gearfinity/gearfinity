// Kinematic scene types — the JSON emitted by scripts/gen_kinematic_scene.py
// (see docs/ASSEMBLY_TO_WEB.md for the schema and conventions).

import type { StageRates, Teeth } from "./gear-train";

export type Role = "sun" | "planet" | "ring" | "carrier" | "static";

export interface Kin {
  role: Role;
  stage: number;
  /** spin centre (metres, assembly frame) for parts whose geometry is offset
   *  from their origin — e.g. the display planets */
  center?: [number, number, number];
}

export interface ScenePart {
  src: string;
  url: string;
  /** [r0..r8, x, y, z] — metres; rotation stored in SolidWorks ROW-VECTOR
   *  convention, so consumers must TRANSPOSE for column-vector math */
  transform: number[];
  kin: Kin;
}

export interface StageKin {
  teeth?: Teeth;
  axis?: { origin: [number, number, number]; dir: [number, number, number] };
  rates?: StageRates | Omit<StageRates, "ratio">;
}

export interface SceneData {
  name: string;
  drive?: "sun" | "carrier";
  direction?: 1 | -1;
  parts: ScenePart[];
  kinematics: { stages: StageKin[] };
}

export function sceneUrl(moduleId: string, variant: string): string {
  return `/scenes/cfg_${moduleId}_${variant}.json`;
}

export async function fetchScene(
  moduleId: string,
  variant: string,
): Promise<SceneData | null> {
  try {
    const r = await fetch(sceneUrl(moduleId, variant), { cache: "no-store" });
    return r.ok ? ((await r.json()) as SceneData) : null;
  } catch {
    return null;
  }
}
