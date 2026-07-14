// Typed access to the Gearfinity configuration model (modules.config.json,
// synced from the repo root by scripts/sync-data.mjs).
import rawConfig from "@/data/modules.config.json";

export interface Slot {
  recommended: string;
  qty?: number | string;
  alternatives?: string[];
  role?: string;
  note?: string;
  alt_note?: string;
  fits_available?: Record<string, string[]>;
}

export interface Variant {
  stages: string[];
  cover: string | null;
}

export interface ModuleDef {
  name: string;
  assembly_video?: string;
  uses_submodule?: string;
  shared_slots?: Record<string, Slot>;
  variants: Record<string, Variant>;
}

export interface GfConfig {
  defaults: { core_fit: string };
  core_style_codes: Record<string, string>;
  core_fit_codes: Record<string, string>;
  submodules: {
    planetary_stage: {
      name: string;
      description: string;
      assembly_video?: string;
      slots: Record<string, Slot>;
    };
  };
  modules: Record<string, ModuleDef>;
}

export const config = rawConfig as unknown as GfConfig;

export const MODULE_IDS = Object.keys(config.modules);

export function moduleDef(id: string): ModuleDef | undefined {
  return config.modules[id];
}

/** Core part ID for a stage style + fit (e.g. middle/tight -> PGC5MT). */
export function corePid(style: string, fit: string): string {
  return config.submodules.planetary_stage.slots.core.recommended
    .replace("{style}", config.core_style_codes[style] ?? "?")
    .replace("{fit}", config.core_fit_codes[fit] ?? "");
}

export function fitsFor(style: string): string[] {
  const fits =
    config.submodules.planetary_stage.slots.core.fits_available ?? {};
  return fits[style] ?? ["standard"];
}

/** Flattened parts rows for a module variant (stage slots + cover + shared). */
export function slotRows(moduleId: string, variantName: string) {
  const mod = moduleDef(moduleId);
  const v = mod?.variants[variantName];
  if (!mod || !v) return [];
  const rows: { name: string; slot: Slot; qty: number | string }[] = [];
  const stageSlots = config.submodules.planetary_stage.slots;
  for (const [name, slot] of Object.entries(stageSlots)) {
    if (name === "core") continue;
    const per = typeof slot.qty === "number" ? slot.qty : 1;
    rows.push({ name, slot, qty: v.stages.length * per });
  }
  if (v.cover) rows.push({ name: "gearbox cover", slot: { recommended: v.cover }, qty: 1 });
  for (const [name, slot] of Object.entries(mod.shared_slots ?? {})) {
    rows.push({ name, slot, qty: slot.qty ?? 1 });
  }
  return rows;
}
