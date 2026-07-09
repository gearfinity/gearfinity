"use client";
// The module configurator: config-driven sidebar (variant, core fits, swaps,
// parts) + kinematic 3D scene with per-instance select / ghost / hide.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  config,
  corePid,
  fitsFor,
  moduleDef,
  slotRows,
} from "@/lib/config";
import { chainStages, NOMINAL_TEETH } from "@/lib/gear-train";
import { fetchScene, sceneUrl, type SceneData } from "@/lib/scene";
import type { SceneEngine, Inst } from "@/components/viewer/engine";

const SceneViewer = dynamic(() => import("@/components/viewer/SceneViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      loading 3D…
    </div>
  ),
});

interface Selection {
  kind: "inst" | "group";
  stem: string;
  instId?: number;
}

export default function ConfiguratorShell({ moduleId }: { moduleId: string }) {
  const mod = moduleDef(moduleId)!;
  const variantNames = Object.keys(mod.variants);
  const [variant, setVariant] = useState(variantNames[0]);
  const v = mod.variants[variant];

  const [fits, setFits] = useState<string[]>(() => v.stages.map(() => "standard"));
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [live3d, setLive3d] = useState<Record<string, boolean>>({});
  const [scene, setScene] = useState<SceneData | null>(null);
  const [sceneChecked, setSceneChecked] = useState(false);

  const [playing, setPlaying] = useState(true);
  const [rpm, setRpm] = useState(12);
  const [reversed, setReversed] = useState(false);

  const engineRef = useRef<SceneEngine | null>(null);
  const [groups, setGroups] = useState<Map<string, Inst[]>>(new Map());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [details, setDetails] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [, bump] = useState(0); // re-render after imperative vis changes
  const userPicked = useRef(false);
  const rowRefs = useRef(new Map<string, HTMLElement | null>());

  // which variants have a real scene (for the "3D" tag) — and unless the
  // user already chose, default to the first variant that HAS a 3D scene
  useEffect(() => {
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        variantNames.map(async (name) => {
          try {
            const r = await fetch(sceneUrl(moduleId, name), { method: "HEAD" });
            return [name, r.ok] as const;
          } catch {
            return [name, false] as const;
          }
        }),
      );
      if (!alive) return;
      const liveMap = Object.fromEntries(entries);
      setLive3d(liveMap);
      setVariant((cur) => {
        if (userPicked.current || liveMap[cur]) return cur;
        return variantNames.find((n) => liveMap[n]) ?? cur;
      });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  // keep per-stage fits + swaps in sync with whichever variant is active
  useEffect(() => {
    setFits(mod.variants[variant].stages.map(() => "standard"));
    setSwaps({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, moduleId]);

  // load the scene for the current variant
  useEffect(() => {
    let alive = true;
    setScene(null);
    setSceneChecked(false);
    setSelection(null);
    setDetails("");
    setGroups(new Map());
    fetchScene(moduleId, variant).then((s) => {
      if (!alive) return;
      setScene(s);
      setSceneChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [moduleId, variant]);

  const onReady = useCallback((engine: SceneEngine, insts: Inst[]) => {
    engineRef.current = engine;
    const g = new Map<string, Inst[]>();
    for (const inst of insts) {
      const arr = g.get(inst.stem) ?? [];
      arr.push(inst);
      g.set(inst.stem, arr);
    }
    setGroups(g);
  }, []);

  const clearHighlight = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    e.setHighlight(e.insts, false);
  }, []);

  const select = useCallback(
    (sel: Selection | null) => {
      const e = engineRef.current;
      clearHighlight();
      setSelection(sel);
      if (!sel || !e) {
        setDetails("");
        return;
      }
      const insts = groups.get(sel.stem) ?? [];
      if (sel.kind === "inst") {
        const inst = insts.find((i) => i.id === sel.instId);
        if (inst) {
          e.setHighlight([inst], true);
          const rate = e.rateOf(inst);
          setDetails(
            `${inst.src} — ${inst.kin.role}, stage ${inst.kin.stage + 1} — ${rate.toFixed(3)}× input`,
          );
          if (insts.length > 1)
            setExpanded((x) => new Set(x).add(sel.stem));
        }
      } else {
        e.setHighlight(insts, true);
        setDetails(`${sel.stem} — ${insts.length} instances`);
      }
    },
    [groups, clearHighlight],
  );

  const onPick = useCallback(
    (inst: Inst | null) => {
      if (!inst) return select(null);
      if (selection?.kind === "inst" && selection.instId === inst.id)
        return select(null);
      select({ kind: "inst", stem: inst.stem, instId: inst.id });
    },
    [select, selection],
  );

  const toggleVis = useCallback(
    (insts: Inst[], key: "ghost" | "hidden") => {
      const e = engineRef.current;
      if (!e) return;
      const on = !insts.every((i) => i[key]);
      for (const i of insts) {
        i[key] = on;
        e.applyVis(i);
      }
      bump((n) => n + 1);
    },
    [],
  );

  const changeVariant = (name: string) => {
    userPicked.current = true;
    setVariant(name);
  };

  // centre the selected part's sidebar row (3D clicks land mid-list)
  useEffect(() => {
    if (!selection) return;
    const single = (groups.get(selection.stem)?.length ?? 0) === 1;
    const key =
      selection.kind === "inst" && !single
        ? `i:${selection.instId}`
        : `g:${selection.stem}`;
    requestAnimationFrame(() => {
      rowRefs.current
        .get(key)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [selection, groups]);

  const ratio = useMemo(
    () => chainStages(v.stages.map(() => NOMINAL_TEETH)).totalRatio,
    [v],
  );
  const rows = useMemo(() => slotRows(moduleId, variant), [moduleId, variant]);

  const isSel = (sel: Selection) =>
    selection &&
    selection.kind === sel.kind &&
    selection.stem === sel.stem &&
    selection.instId === sel.instId;

  return (
    <div className="flex h-[calc(100vh-3.25rem)]">
      {/* sidebar */}
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 text-sm">
        <h2 className="section-h">Variant</h2>
        <select
          className="input w-full"
          value={variant}
          onChange={(e) => changeVariant(e.target.value)}
        >
          {variantNames.map((name) => (
            <option key={name} value={name}>
              {name}
              {live3d[name] ? " ● 3D" : ""}
            </option>
          ))}
        </select>

        <h2 className="section-h">Stages</h2>
        {v.stages.map((style, i) => (
          <div key={i} className="row">
            <span className="flex-1 text-zinc-400">
              stage {i + 1} · {style}
            </span>
            <select
              className="input"
              value={fits[i]}
              onChange={(e) =>
                setFits((f) => f.map((x, j) => (j === i ? e.target.value : x)))
              }
            >
              {fitsFor(style).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <span className="w-20 text-right font-mono text-xs">
              {corePid(style, fits[i])}
            </span>
          </div>
        ))}

        <h2 className="section-h">Parts</h2>
        {rows.map(({ name, slot, qty }) => (
          <div key={name} className="row">
            <span className="flex-1 text-xs text-zinc-400">
              {name.replace(/_/g, " ")}
            </span>
            {slot.alternatives?.length ? (
              <select
                className="input"
                value={swaps[name] ?? slot.recommended}
                onChange={(e) =>
                  setSwaps((s) => ({ ...s, [name]: e.target.value }))
                }
              >
                {[slot.recommended, ...slot.alternatives].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-xs">{slot.recommended}</span>
            )}
            <span className="w-8 text-right text-xs text-zinc-500">×{qty}</span>
          </div>
        ))}

        {groups.size > 0 && (
          <>
            <h2 className="section-h">Scene parts</h2>
            {[...groups.entries()].map(([stem, insts]) => {
              const id = stem.split("_")[0];
              const label =
                /^[A-Z]/.test(id) && id.length <= 8 ? id : stem.slice(0, 22);
              const open = expanded.has(stem);
              return (
                <div key={stem}>
                  <div
                    ref={(el) => {
                      rowRefs.current.set(`g:${stem}`, el);
                    }}
                    className={`row cursor-pointer rounded px-1 hover:bg-zinc-900 ${
                      isSel({ kind: insts.length === 1 ? "inst" : "group", stem, instId: insts.length === 1 ? insts[0].id : undefined })
                        ? "bg-blue-950 outline outline-1 outline-blue-700"
                        : ""
                    }`}
                    onClick={() =>
                      insts.length === 1
                        ? onPick(insts[0])
                        : isSel({ kind: "group", stem })
                          ? select(null)
                          : select({ kind: "group", stem })
                    }
                  >
                    <span
                      className="w-4 select-none text-zinc-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (insts.length > 1)
                          setExpanded((x) => {
                            const n = new Set(x);
                            if (n.has(stem)) n.delete(stem);
                            else n.add(stem);
                            return n;
                          });
                      }}
                    >
                      {insts.length > 1 ? (open ? "▾" : "▸") : ""}
                    </span>
                    <span className="flex-1">
                      <b>{label}</b>{" "}
                      <span className="text-xs text-zinc-500">
                        ×{insts.length}
                      </span>
                    </span>
                    <VisButtons
                      ghost={insts.every((i) => i.ghost)}
                      hidden={insts.every((i) => i.hidden)}
                      onGhost={() => toggleVis(insts, "ghost")}
                      onHide={() => toggleVis(insts, "hidden")}
                    />
                  </div>
                  {open &&
                    insts.map((inst, i) => (
                      <div
                        key={inst.id}
                        ref={(el) => {
                          rowRefs.current.set(`i:${inst.id}`, el);
                        }}
                        className={`row cursor-pointer rounded py-0.5 pl-6 pr-1 text-xs hover:bg-zinc-900 ${
                          isSel({ kind: "inst", stem, instId: inst.id })
                            ? "bg-blue-950 outline outline-1 outline-blue-700"
                            : ""
                        }`}
                        onClick={() => onPick(inst)}
                      >
                        <span className="flex-1">
                          #{i + 1}{" "}
                          <span className="text-zinc-500">
                            {inst.kin.role === "static"
                              ? "static"
                              : `${inst.kin.role} · s${inst.kin.stage + 1}`}
                          </span>
                        </span>
                        <VisButtons
                          ghost={inst.ghost}
                          hidden={inst.hidden}
                          onGhost={() => toggleVis([inst], "ghost")}
                          onHide={() => toggleVis([inst], "hidden")}
                        />
                      </div>
                    ))}
                </div>
              );
            })}
          </>
        )}

        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <div className="text-xl font-bold">{ratio.toFixed(2)} : 1</div>
          <div className="mt-0.5 text-xs text-zinc-500">
            {v.stages.length} stage{v.stages.length > 1 ? "s" : ""} · exact
            (36:7 per stage, teeth 14/22/58)
          </div>
        </div>
      </aside>

      {/* viewport */}
      <div className="relative min-w-0 flex-1">
        {scene ? (
          <SceneViewer
            scene={scene}
            playing={playing}
            rpm={rpm}
            reversed={reversed}
            onReady={onReady}
            onPick={onPick}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-zinc-500">
            {sceneChecked
              ? "3D scene for this variant hasn't been generated yet — its display assembly is still to be exported from SolidWorks."
              : "loading scene…"}
          </div>
        )}

        {details && (
          <div className="absolute left-3 top-3 rounded bg-zinc-950/80 px-2 py-1 text-xs text-zinc-400">
            {details}
          </div>
        )}

        {scene && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950/90 px-4 py-2 text-xs backdrop-blur">
            <button className="btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? "⏸ pause" : "▶ play"}
            </button>
            <button className="btn" onClick={() => setReversed((r) => !r)}>
              ⇄ reverse
            </button>
            <label className="flex items-center gap-2">
              speed
              <input
                type="range"
                min={2}
                max={60}
                value={rpm}
                onChange={(e) => setRpm(+e.target.value)}
                className="accent-[#00A3FF]"
              />
            </label>
            <span className="text-zinc-500">{rpm} rpm in</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VisButtons({
  ghost,
  hidden,
  onGhost,
  onHide,
}: {
  ghost: boolean;
  hidden: boolean;
  onGhost: () => void;
  onHide: () => void;
}) {
  return (
    <span className="flex gap-1">
      <button
        title="transparent"
        className={`vbtn ${ghost ? "vbtn-on" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onGhost();
        }}
      >
        ◐
      </button>
      <button
        title="hide / show"
        className={`vbtn ${hidden ? "vbtn-on" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onHide();
        }}
      >
        👁
      </button>
    </span>
  );
}

// re-export config for convenience in pages
export { config };
