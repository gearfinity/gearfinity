import Link from "next/link";
import { config } from "@/lib/config";

const MODULE_BLURBS: Record<string, string> = {
  planetary_stage:
    "The core building block — one 5:1 herringbone planetary stage, printed in place.",
  crank:
    "Crank-to-crank gearbox. Feel 26x torque multiplication between your hands.",
  fan: "Hand-cranked fan — the prop spins 26x faster than you crank.",
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
      <section className="mb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Print · Build · <span className="text-amber-400">Innovate</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          Gearfinity is a fully 3D-printed modular gear system — even the
          bearings — printable as-is with no supports and no calibration.
          Configure a module below, watch the <em>real assembly</em> run with
          exact gear kinematics, then print exactly the parts you need.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {Object.entries(config.modules).map(([id, mod]) => (
          <Link
            key={id}
            href={`/build/${id}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600"
          >
            <div className="text-lg font-semibold group-hover:text-amber-400">
              {mod.name}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {MODULE_BLURBS[id] ?? ""}
            </p>
            <div className="mt-4 text-sm text-zinc-500 group-hover:text-zinc-300">
              Configure →
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-14 text-center text-sm text-zinc-500">
        True ratio 36:7 per planetary stage — the animations run the exact
        tooth-count kinematics (14/22/58) of the printed gears.
      </section>
    </main>
  );
}
