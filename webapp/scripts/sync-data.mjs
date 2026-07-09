// Sync pipeline outputs into the webapp.
//
// The SolidWorks -> web pipeline (scripts/gen_kinematic_scene.py etc.) writes
// scenes + per-part GLBs under <repo>/web/. This script copies them into
// webapp/public so Next.js serves them, plus the config model + parts catalog
// into webapp/data for build-time imports. Wired into predev/prebuild.
import { mkdirSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const pub = join(here, "..", "public");
const data = join(here, "..", "data");

const jobs = [
  { from: join(repo, "web", "scenes"), to: join(pub, "scenes"), ext: ".json" },
  { from: join(repo, "web", "parts"), to: join(pub, "parts"), ext: ".glb" },
];

let copied = 0;
for (const { from, to, ext } of jobs) {
  if (!existsSync(from)) {
    console.warn(`sync-data: missing ${from} (run the pipeline first)`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    if (f.toLowerCase().endsWith(ext)) {
      copyFileSync(join(from, f), join(to, f));
      copied++;
    }
  }
}

mkdirSync(data, { recursive: true });
for (const f of ["modules.config.json", "parts.csv"]) {
  // On Vercel's remote builder only webapp/ is uploaded - the repo root is
  // absent, but the synced files travel with the upload. Skip, don't fail.
  if (existsSync(join(repo, f))) {
    copyFileSync(join(repo, f), join(data, f));
    copied++;
  } else if (!existsSync(join(data, f))) {
    console.warn(`sync-data: ${f} missing and not previously synced`);
  }
}

console.log(`sync-data: ${copied} files -> public/{scenes,parts} + data/`);
