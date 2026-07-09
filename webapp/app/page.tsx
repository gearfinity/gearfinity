import Image from "next/image";
import Link from "next/link";

// Content ported from the original gearfinity.xyz landing page (Carrd),
// with the module CTAs now pointing INTO the configurator.

const THINGIVERSE = {
  designs: "https://www.thingiverse.com/gearfinity3d/designs",
  planetary: "https://www.thingiverse.com/thing:6648623",
  crank: "https://www.thingiverse.com/thing:6648659",
  fan: "https://www.thingiverse.com/thing:6651125",
};

const COMMUNITY_PERKS = [
  "The latest updates on Gearfinity projects",
  "Early access to new 3D models and modules",
  "Exclusive tutorials and tips for creating with Gearfinity",
  "Access to a private Discord channel for community discussions",
  "Monthly newsletters with featured builds and community highlights",
];

function Cta({
  href,
  children,
  primary = false,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  const cls = primary
    ? "inline-flex items-center gap-2 rounded-full bg-[#4659BD] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#5a6fd6]"
    : "inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/60";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

function Section({
  id,
  title,
  children,
  flip = false,
  media,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  flip?: boolean;
  media?: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-6 py-14">
      <div
        className={`flex flex-col items-center gap-10 ${
          media ? (flip ? "md:flex-row-reverse" : "md:flex-row") : ""
        }`}
      >
        <div className={media ? "md:w-1/2" : "mx-auto max-w-2xl text-center"}>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <div className="mt-4 space-y-4 text-white/70">{children}</div>
        </div>
        {media && <div className="w-full md:w-1/2">{media}</div>}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* hero */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-10 pt-16 text-center">
        <Image
          src="/landing/logo.png"
          alt="Gearfinity"
          width={420}
          height={118}
          priority
          className="mx-auto h-auto w-72 sm:w-96"
        />
        <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
          Print · Build · Innovate
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-white/70">
          Welcome to <b className="text-white">Gearfinity</b>, your playground
          for boundless mechanical creations! Gearfinity is a modular and
          extensible 3D printing project, functioning as a comprehensive{" "}
          <b className="text-white">engineering kit</b>. Assemble intricate,
          fully functional mechanical constructs entirely from 3D printed parts
          — bearings, fasteners, and all.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Cta href="/build/crank" primary>
            Get started →
          </Cta>
          <Cta href="#printed">Learn more ↓</Cta>
        </div>
        <video
          className="mx-auto mt-12 w-full max-w-3xl rounded-2xl border border-white/10"
          src="/landing/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

      {/* fully 3d printed */}
      <Section id="printed" title="Fully 3D Printed">
        <p>
          All parts are 3D printed (even bearings!) with{" "}
          <b className="text-white">NO</b> additional supports. Just keep
          printing and building!
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Cta href={THINGIVERSE.designs} external>
            Explore designs →
          </Cta>
        </div>
      </Section>

      {/* modular kit */}
      <Section
        title="Modular Engineering Kit"
        media={
          <video
            className="w-full rounded-2xl border border-white/10"
            src="/landing/conversion.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        }
      >
        <p>
          Gearfinity acts as a construction set — modules convert quickly from
          one to another. Watch the crank module become the fan module by
          swapping just a few parts.
        </p>
      </Section>

      {/* modules */}
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          The Modules
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
          Configure each one in 3D — the animations run the{" "}
          <em>real assemblies</em> with exact gear kinematics (36:7 per stage).
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              id: "planetary_stage",
              name: "Planetary Gears",
              blurb:
                "The herringbone planetary gear stage is the core Gearfinity building block.",
              print: THINGIVERSE.planetary,
            },
            {
              id: "crank",
              name: "Crank Module",
              blurb:
                "A beginner module and a great way to learn the Gearfinity basics — and directly experience the power of gear ratios.",
              print: THINGIVERSE.crank,
            },
            {
              id: "fan",
              name: "Fan Module",
              blurb:
                "A simple build that looks cool and keeps you cool! Build from scratch or convert from the crank module.",
              print: THINGIVERSE.fan,
            },
          ].map((m) => (
            <div
              key={m.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-lg font-semibold">{m.name}</div>
              <p className="mt-2 flex-1 text-sm text-white/60">{m.blurb}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Cta href={`/build/${m.id}`} primary>
                  Configure in 3D →
                </Cta>
                <Cta href={m.print} external>
                  Print it!
                </Cta>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-white/60">
          <b className="text-white">And more…</b> With Gearfinity, your
          imagination is the limit. Join the community for early access to new
          modules as they are released.
        </p>
      </section>

      {/* open source */}
      <Section title="Free and Open Source">
        <p>
          Gearfinity models will always be free and open source. Have an idea
          for a module? Check out our GitHub and submit a PR with your models —
          or just join the conversation.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Cta href="https://github.com/gearfinity/gearfinity" external>
            GitHub →
          </Cta>
        </div>
      </Section>

      {/* community */}
      <section
        id="community"
        className="mx-auto w-full max-w-3xl px-6 py-14 text-center"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Join the Gearfinity Community!
        </h2>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-white/70">
          {COMMUNITY_PERKS.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-[#00A3FF]">✦</span>
              {p}
            </li>
          ))}
        </ul>
        <form
          className="mx-auto mt-8 flex max-w-md gap-2"
          action="#"
          aria-label="Newsletter signup (coming soon)"
        >
          <input
            type="email"
            placeholder="you@example.com"
            disabled
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm placeholder:text-white/40"
          />
          <button
            disabled
            title="Newsletter signup is moving to the new site — follow us on socials meanwhile"
            className="rounded-full bg-[#4659BD]/50 px-5 py-2.5 text-sm font-medium text-white/60"
          >
            Subscribe
          </button>
        </form>
        <p className="mt-2 text-xs text-white/40">
          newsletter signup returning soon — follow along on socials below
        </p>
      </section>
    </main>
  );
}
