import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CheckItem } from "@/game/scenarios";
import type { FalloutStep, ShiftDef, WeekBeat, WeekChoice } from "@/content/week/types";
import { checkLearner, logDecision, logShiftComplete, newShiftRun } from "@/game/telemetry";
import { saveFinds, saveWeek } from "@/game/weekplay/progress";
import {
  COWORKER,
  CW_ALL_ID,
  FINDS,
  NUDGE_AFTER,
  PHONE_NUDGE,
  PLAY_VOICES,
  TOYS,
  cwLineId,
  findLineId,
  placeOf,
  toyLineId,
  toySfx,
  type Find,
} from "@/content/week/play";
import { Alarm, BeatProp, CastFigure, Decor, FindProp, Papers, Poke, Room, ToyDots, Walker, approach, player, type Nearby } from "@/game/weekplay/Scene";
import { HarborStage, MonitorArt, NightStage } from "@/game/weekplay/HarborStage";
import { BakedRoom, setRoomBounds } from "@/game/weekplay/BakedRoom";
import { SETS } from "@/game/weekplay/sets";
import { falloutLine, promptLine } from "@/content/week/voices";
import { blip, sayLine, sayLineNext, unlockAudio } from "@/game/audio";
import { isMusicOn, playSfx, setBed, setBedFor, toggleMusic, warmSounds } from "@/game/sound";

type Phase = "intro" | "play" | "panel" | "wrap" | "debrief" | "check" | "result";
type Tone = "good" | "bad" | "note";
type Fx = {
  key: number;
  kind: "alarm" | "papers";
  set: string;
  x: number;
  y: number;
  z: number;
  floor: number;
};
type Bark = { id: number; who: string; text: string; tone: Tone };

/** Fallout plays at 0.4x the scripted seconds so the player sees it while walking to the next beat. */
const PACE = 400;
const PASS = 0.8;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function propImage(beat: WeekBeat, flipped: boolean): string | null {
  const file = flipped ? (beat.prop?.b ?? beat.prop?.a) : beat.prop?.a;
  return file ? `/assets/textures/${file}` : null;
}

export function ShiftGame({ shift, onExit }: { shift: ShiftDef; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, WeekChoice>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [barks, setBarks] = useState<Bark[]>([]);
  const [near, setNear] = useState(false);
  const [fade, setFade] = useState(false);
  const [roomSet, setRoomSet] = useState(shift.beats[0].set);
  const [result, setResult] = useState<{ score: number; ratio: number; passed: boolean } | null>(null);
  const timers = useRef<number[]>([]);
  const barkId = useRef(0);
  const [nearItem, setNearItem] = useState<string | null>(null);
  const [found, setFound] = useState<Record<string, true>>({});
  const [poke, setPoke] = useState<{ key: number; x: number; y: number; z: number } | null>(null);
  const presses = useRef<Record<string, number>>({});
  const [fx, setFx] = useState<Fx[]>([]);
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const fxId = useRef(0);
  const addFx = useCallback((f: Omit<Fx, "key">) => {
    const key = (fxId.current += 1);
    setFx((list) => [...list.slice(-5), { ...f, key }]);
    // Papers stay on the floor for a while; the alarm is gone after its pulses.
    timers.current.push(window.setTimeout(() => setFx((list) => list.filter((x) => x.key !== key)), f.kind === "papers" ? 30000 : 4000));
  }, []);
  const lastProgress = useRef(Date.now());
  const greeted = useRef(false);
  const chatter = useRef(0);

  const beat = shift.beats[Math.min(index, shift.beats.length - 1)];
  const set = SETS[roomSet];
  const spot = phase === "play" && beat.set === roomSet ? set.spots[beat.spot] : null;
  const place = placeOf(roomSet);
  const toysHere = useMemo(() => TOYS.filter((t) => t.place === place), [place]);
  const findsHere = useMemo(() => FINDS.filter((f) => f.place === place), [place]);
  const shiftFinds = useMemo(() => {
    const places = new Set(shift.beats.map((b) => placeOf(b.set)));
    return FINDS.filter((f) => places.has(f.place));
  }, [shift]);
  const items = useMemo<Nearby[]>(
    () => [...toysHere.map((t) => ({ id: t.id, x: t.x, z: t.z, r: t.r ?? 1.3 })), ...findsHere.filter((f) => !found[f.id]).map((f) => ({ id: f.id, x: f.x, z: f.z, r: f.r ?? 1.3 }))],
    [toysHere, findsHere, found],
  );
  const itemToy = nearItem ? toysHere.find((t) => t.id === nearItem) : undefined;
  const itemFind = nearItem ? findsHere.find((f) => f.id === nearItem) : undefined;

  const placePlayer = useCallback((kind: typeof roomSet) => {
    const s = SETS[kind];
    setRoomBounds({ x0: -s.w / 2, x1: s.w / 2, z0: -s.d / 2, z1: s.d / 2 });
    player.x = s.spawn.x;
    player.z = s.spawn.z;
    player.yaw = s.spawn.yaw;
    player.pitch = -0.08;
  }, []);

  useEffect(() => {
    newShiftRun();
    void checkLearner();
    placePlayer(shift.beats[0].set);
    const down = (e: KeyboardEvent) => {
      player.keys.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => player.keys.delete(e.code);
    const blur = () => player.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      for (const t of timers.current) window.clearTimeout(t);
      player.keys.clear();
    };
  }, [placePlayer, shift]);

  const pushBark = useCallback((who: string, text: string, bad: boolean | Tone) => {
    const id = (barkId.current += 1);
    const tone: Tone = bad === true ? "bad" : bad === false ? "good" : bad;
    setBarks((list) => [...list.slice(-3), { id, who, text, tone }]);
    timers.current.push(window.setTimeout(() => setBarks((list) => list.filter((b) => b.id !== id)), 9000));
  }, []);

  const open = useCallback(() => {
    if (phase !== "play" || !near) return;
    if (beat.prop?.reveal) setFlipped((f) => ({ ...f, [beat.scenario.id]: true }));
    player.keys.clear();
    unlockAudio();
    const line = promptLine(beat);
    sayLine(line.id, line.text, line.kind, line.who);
    setPhase("panel");
  }, [beat, near, phase]);

  const pokeItem = useCallback(
    (id: string) => {
      unlockAudio();
      const toy = TOYS.find((t) => t.id === id);
      if (toy) {
        const n = presses.current[id] ?? 0;
        presses.current[id] = n + 1;
        const k = Math.min(n, toy.lines.length - 1);
        pushBark(toy.who ?? toy.label, toy.lines[k], "note");
        sayLine(toyLineId(toy, k), toy.lines[k], PLAY_VOICES[toy.who ?? ""] ?? "narrator", toy.who ?? toy.label);
        setPoke({ key: Date.now(), x: toy.x, y: toy.y, z: toy.z });
        if (toy.papers?.includes(n))
          addFx({
            kind: "papers",
            set: roomSet,
            x: toy.x,
            y: toy.y + 0.3,
            z: toy.z + 0.35,
            floor: SETS[roomSet].harbor?.y ?? 0,
          });
        playSfx(toySfx(toy, k), 0.7, () => blip(440 + (n % 3) * 90));
        return;
      }
      const find = FINDS.find((f) => f.id === id);
      if (!find || found[id]) {
        if (find) pushBark(find.label, find.line, "note");
        return;
      }
      const next = { ...found, [id]: true as const };
      setFound(next);
      playSfx("sfx-find", 0.6, () => blip(780));
      setPoke({ key: Date.now(), x: find.x, y: find.y + 0.1, z: find.z });
      pushBark(`Found · ${find.label}`, find.line, "good");
      sayLine(findLineId(find), find.line, "narrator", find.label);
      if (find.place === "f14") {
        const left = FINDS.filter((f) => f.place === "f14" && !next[f.id]).length;
        const k = chatter.current++ % COWORKER.onFind.length;
        const line = left === 0 ? COWORKER.allFound : COWORKER.onFind[k];
        const lid = left === 0 ? CW_ALL_ID : cwLineId("find", k);
        timers.current.push(
          window.setTimeout(() => {
            pushBark(COWORKER.who, line, "note");
            sayLineNext(lid, line, "man", COWORKER.who);
          }, 1400),
        );
      }
    },
    [found, pushBark, addFx, roomSet],
  );

  // Music and room tone follow the room. Quiet on the intro, the debrief and the check.
  const [musicOn, setMusicOn] = useState(true);
  useEffect(() => setMusicOn(isMusicOn()), []);
  useEffect(() => {
    if (phase === "play" || phase === "panel") setBedFor(roomSet === "server" ? "server" : place);
    else setBed(null, null);
  }, [phase, roomSet, place]);
  useEffect(() => () => setBed(null, null), []);

  // Test hook for automated checks: jump to another room of the tower.
  useEffect(() => {
    (window as unknown as { __drcRoom?: (k: typeof roomSet) => void }).__drcRoom = (k) => {
      setRoomSet(k);
      placePlayer(k);
    };
  }, [placePlayer]);

  // Back on the main path counts as progress. Wandering off for long gets one gentle nudge per 45 s.
  useEffect(() => {
    if (phase === "play") lastProgress.current = Date.now();
  }, [phase, index]);
  useEffect(() => {
    const t = window.setInterval(() => {
      if (phase !== "play" || near) return;
      if (Date.now() - lastProgress.current < NUDGE_AFTER) return;
      lastProgress.current = Date.now();
      const onFloor = place === "f14";
      const k = chatter.current++ % COWORKER.nudge.length;
      const line = onFloor ? COWORKER.nudge[k] : PHONE_NUDGE.text;
      pushBark(onFloor ? COWORKER.who : "Phone", line, "note");
      if (onFloor) sayLineNext(cwLineId("nudge", k), line, "man", COWORKER.who);
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, near, place, pushBark]);

  // The coworker says hello the first time a run reaches floor 14.
  useEffect(() => {
    if (phase !== "play" || place !== "f14" || greeted.current) return;
    greeted.current = true;
    let n = 0;
    try {
      n = Number(window.localStorage.getItem("drc-hello") ?? 0);
      window.localStorage.setItem("drc-hello", String(n + 1));
    } catch {
      /* no storage, no memory of the kayak */
    }
    const k = n % COWORKER.hello.length;
    timers.current.push(
      window.setTimeout(() => {
        pushBark(COWORKER.who, COWORKER.hello[k], "note");
        sayLineNext(cwLineId("hello", k), COWORKER.hello[k], "man", COWORKER.who);
      }, 2500),
    );
  }, [phase, place, pushBark]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && phase === "play") {
        if (near) open();
        else if (nearItem) pokeItem(nearItem);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, phase, near, nearItem, pokeItem]);

  const choose = (choice: WeekChoice) => {
    const id = beat.scenario.id;
    setPicked((p) => ({ ...p, [id]: choice }));
    logDecision(choice.id);
    const steps: FalloutStep[] = beat.timeline?.[choice.id] ?? [];
    if (choice.ok) pushBark(beat.scenario.prompt.who, choice.debrief, false);
    else if (!steps.length) pushBark(beat.scenario.prompt.who, choice.debrief, true);
    steps.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(() => {
          if (step.flip) setFlipped((f) => ({ ...f, [id]: true }));
          pushBark(step.who, step.text, true);
          // The room shows it too: the prop jolts, and a flip sets off a red pulse where it happened.
          const kind = step.fx ?? (step.flip ? "alarm" : "buzz");
          const sp = SETS[beat.set].spots[beat.spot];
          if (kind !== "none" && sp) {
            setShakes((m) => ({ ...m, [id]: performance.now() }));
            const floorY = SETS[beat.set].harbor?.y ?? 0;
            if (kind === "alarm") {
              addFx({ kind: "alarm", set: beat.set, x: sp.x, y: sp.py + 0.25, z: sp.z, floor: floorY });
              playSfx("sfx-alarm", 0.45, () => {
                blip(220);
                timers.current.push(window.setTimeout(() => blip(180), 220));
              });
            } else playSfx("sfx-buzz", 0.5);
            if (kind === "papers")
              addFx({
                kind: "papers",
                set: beat.set,
                x: sp.x,
                y: sp.py + 0.1,
                z: sp.z,
                floor: floorY,
              });
          }
          const line = falloutLine(choice.id, i, step.who, step.text, beat);
          if (line) sayLineNext(line.id, line.text, line.kind, line.who);
        }, step.at * PACE),
      );
    });
    const nextIndex = index + 1;
    if (nextIndex >= shift.beats.length) {
      setIndex(nextIndex);
      setPhase("wrap");
      return;
    }
    const next = shift.beats[nextIndex];
    setIndex(nextIndex);
    if (next.set !== roomSet) {
      setFade(true);
      timers.current.push(
        window.setTimeout(() => {
          setRoomSet(next.set);
          placePlayer(next.set);
          setPhase("play");
          timers.current.push(window.setTimeout(() => setFade(false), 120));
        }, 650),
      );
    } else setPhase("play");
  };

  // Beats can share a spot (the same desk all night). Show the live or latest one there, never two at once.
  const shownProps = useMemo(() => {
    const bySpot = new Map<string, { b: WeekBeat; i: number }>();
    shift.beats.forEach((b, i) => {
      if (b.set !== roomSet) return;
      const cur = bySpot.get(b.spot);
      const live = Math.min(index, shift.beats.length - 1);
      if (!cur || (i <= live && i > cur.i) || (cur.i > live && i < cur.i)) bySpot.set(b.spot, { b, i });
    });
    return [...bySpot.values()];
  }, [index, roomSet, shift]);

  const castBeat = phase === "play" || phase === "panel" ? beat : null;
  const castSpot = castBeat && castBeat.cast && !castBeat.voiceOnly && castBeat.set === roomSet ? set.spots[castBeat.spot] : null;

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden bg-[#07090e] text-[#f4f0e6]" style={{ touchAction: "none" }}>
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.75]}
        shadows
        camera={{ fov: 62, near: 0.05, far: 500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearColor("#07090e");
        }}
      >
        {set.harbor ? (
          <HarborStage />
        ) : set.baked ? (
          <NightStage warm>
            <Suspense fallback={null}>
              <BakedRoom key={set.baked} file={set.baked} />
            </Suspense>
          </NightStage>
        ) : (
          <>
            <fog attach="fog" args={["#0c1016", 9, 26]} />
            <Room set={set} />
          </>
        )}
        <Decor set={set} />
        {Object.entries(set.spots)
          .filter(([, sp]) => sp.monitor)
          .map(([key, sp]) => {
            const shown = shownProps.find(({ b }) => b.spot === key);
            const prop = shown && shown.b.prop?.kind === "screen" ? shown.b.prop : null;
            return <MonitorArt key={key} name={sp.monitor!} prop={prop} idle={set.idle} flipped={!!(shown && flipped[shown.b.scenario.id])} />;
          })}
        {shownProps.map(({ b, i }) => (
          <BeatProp
            key={b.scenario.id}
            beat={b}
            set={set}
            flipped={!!flipped[b.scenario.id]}
            live={phase === "play" && i === index}
            shakeAt={shakes[b.scenario.id] ?? 0}
          />
        ))}
        {castBeat && castSpot && (
          <CastFigure
            slot={castBeat.cast!}
            x={castSpot.fx ?? castSpot.x + 0.9}
            z={castSpot.fz ?? castSpot.z + 1.1}
            y={set.harbor?.y ?? 0}
            talking={phase === "panel"}
          />
        )}
        {findsHere.map((f) => (
          <FindProp key={f.id} find={f} found={!!found[f.id]} />
        ))}
        {poke && <Poke key={poke.key} x={poke.x} y={poke.y} z={poke.z} />}
        {phase === "play" && <ToyDots toys={toysHere} poked={presses.current} player={() => player} />}
        {fx
          .filter((f) => f.set === roomSet)
          .map((f) => (f.kind === "alarm" ? <Alarm key={f.key} x={f.x} y={f.y} z={f.z} /> : <Papers key={f.key} x={f.x} y={f.y} z={f.z} floor={f.floor} />))}
        <Walker
          set={set}
          target={spot ? { ...approach(spot), lx: spot.x, ly: spot.py, lz: spot.z } : null}
          onNear={setNear}
          items={phase === "play" ? items : []}
          onItem={setNearItem}
        />
      </Canvas>

      <LookLayer active={phase === "play"} />
      <div className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`} />

      <header className="pointer-events-none absolute left-4 top-4 right-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">
            {shift.kind === "track" ? `${shift.day.toUpperCase()} TRACK` : shift.day.toUpperCase()} · {set.name.toUpperCase()}
          </p>
          <p className="mt-1 font-display text-xl">{shift.title}</p>
          {phase === "play" && <p className="mt-2 max-w-[22rem] text-sm text-[#d8d2c4]">{beat.objective}</p>}
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          {shiftFinds.length > 0 && (
            <span className="font-game text-xs tracking-[0.14em] text-[#8fe0b4]" title="Security slip-ups spotted. Optional.">
              FINDS {shiftFinds.filter((f) => found[f.id]).length}/{shiftFinds.length}
            </span>
          )}
          <span className="font-game text-sm tracking-[0.14em] text-[#a8a59c]">
            {Math.min(index + (phase === "panel" ? 1 : 0), shift.beats.length)}/{shift.beats.length}
          </span>
          <button
            type="button"
            onClick={() => setMusicOn(toggleMusic())}
            aria-pressed={musicOn}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#d8d2c4] hover:bg-white/10"
          >
            Music {musicOn ? "on" : "off"}
          </button>
          <button type="button" onClick={onExit} className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#d8d2c4] hover:bg-white/10">
            Leave
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-28 left-4 flex max-w-[24rem] flex-col gap-2 sm:bottom-6">
        {barks.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl border px-3 py-2 text-sm backdrop-blur ${
              b.tone === "bad"
                ? "border-[#ff7a66]/40 bg-[#2a0f0f]/80"
                : b.tone === "good"
                  ? "border-[#7fd6a8]/30 bg-[#0d1f18]/80"
                  : "border-[#c4a574]/30 bg-[#17140e]/85"
            }`}
          >
            <span
              className={`mr-2 font-game text-xs tracking-[0.14em] ${b.tone === "bad" ? "text-[#ff9c8a]" : b.tone === "good" ? "text-[#8fe0b4]" : "text-[#d9bf8f]"}`}
            >
              {b.who.toUpperCase()}
            </span>
            {b.text}
          </div>
        ))}
      </div>

      {phase === "play" && near && (
        <button
          type="button"
          onClick={open}
          className="absolute bottom-10 right-6 rounded-full bg-[#c4a574] sm:bottom-8 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 px-6 py-3 font-game text-base tracking-[0.12em] text-[#14110c] shadow-lg"
        >
          {beat.cast && !beat.voiceOnly ? "TALK" : "LOOK"} <span className="ml-2 hidden opacity-60 sm:inline">SPACE</span>
        </button>
      )}

      {phase === "play" && !near && nearItem && (itemToy || itemFind) && (
        <button
          type="button"
          onClick={() => pokeItem(nearItem)}
          className="absolute bottom-10 right-6 rounded-full border border-[#c4a574]/60 bg-[#14110c]/85 sm:bottom-8 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 px-5 py-2.5 font-game text-sm tracking-[0.12em] text-[#e7c48a] shadow-lg backdrop-blur"
        >
          {itemFind && !found[itemFind.id] ? "CHECK" : "POKE"} · {(itemToy?.label ?? itemFind?.label ?? "").toUpperCase()}{" "}
          <span className="ml-1 hidden opacity-60 sm:inline">SPACE</span>
        </button>
      )}

      {phase === "play" && <TouchStick />}

      {phase === "intro" && (
        <Overlay>
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">
            {shift.kind === "track" ? `${shift.day.toUpperCase()} TRACK` : shift.day.toUpperCase()}
          </p>
          <h1 className="mt-2 font-display text-4xl">{shift.title}</h1>
          <p className="mt-3 text-[#d8d2c4]">{shift.intro}</p>
          {shift.audience && <p className="mt-3 text-sm text-[#a8a59c]">For: {shift.audience}</p>}
          <p className="mt-5 text-sm text-[#a8a59c]">
            Walk with WASD or the arrow keys, drag to look. On a phone, use the left thumb pad. The gold light marks what needs you. Press Space to talk, look
            or poke. Poke around too: things react, and a few security slip-ups are hidden in every room.
          </p>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              warmSounds();
              setPhase("play");
            }}
            className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]"
          >
            START THE SHIFT
          </button>
        </Overlay>
      )}

      {phase === "panel" && <Panel beat={beat} flipped={!!flipped[beat.scenario.id]} onChoose={choose} />}

      {phase === "wrap" && (
        <Overlay>
          <h2 className="font-display text-3xl">That's {shift.kind === "track" ? "the track" : shift.kind === "ai" ? "the AI shift" : `${shift.day}`}.</h2>
          <p className="mt-3 text-[#d8d2c4]">Some of tonight is still playing out. Give it a few seconds, or see how it went.</p>
          <button
            type="button"
            onClick={() => setPhase("debrief")}
            className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]"
          >
            SEE HOW IT WENT
          </button>
        </Overlay>
      )}

      {phase === "debrief" && <Debrief shift={shift} picked={picked} finds={shiftFinds} found={found} onNext={() => setPhase("check")} />}
      {phase === "check" && (
        <Check
          items={shift.check}
          onDone={(ratio) => {
            const beatsScore = Math.round(shift.beats.reduce((sum, b) => sum + (picked[b.scenario.id]?.score ?? 0), 0) / shift.beats.length);
            const passed = ratio >= PASS;
            saveWeek(shift.id, beatsScore, passed);
            saveFinds(shift.id, Object.keys(found));
            if (passed) logShiftComplete(shift.id);
            setResult({ score: beatsScore, ratio, passed });
            setPhase("result");
          }}
        />
      )}
      {phase === "result" && result && (
        <Overlay>
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">{result.passed ? "SHIFT FILED" : "ALMOST"}</p>
          <h2 className="mt-2 font-display text-4xl">{result.score}%</h2>
          <p className="mt-2 text-[#d8d2c4]">
            Decisions on the floor. Knowledge check: {Math.round(result.ratio * 100)}% {result.passed ? "(passed)" : `(need ${PASS * 100}%)`}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!result.passed && (
              <button
                type="button"
                onClick={() => setPhase("check")}
                className="rounded-full bg-[#c4a574] px-5 py-2.5 font-game tracking-[0.12em] text-[#14110c]"
              >
                RETRY THE CHECK
              </button>
            )}
            <button type="button" onClick={onExit} className="rounded-full border border-white/20 px-5 py-2.5 font-game tracking-[0.12em]">
              BACK TO THE WEEK
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#07090e]/80 p-5 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#10141b] p-6 shadow-2xl">{children}</div>
    </div>
  );
}

function Panel({ beat, flipped, onChoose }: { beat: WeekBeat; flipped: boolean; onChoose: (c: WeekChoice) => void }) {
  const img = propImage(beat, flipped);
  const tall = beat.prop?.kind === "phone";
  const { prompt, choices } = beat.scenario;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) onChoose(choices[n - 1]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [choices, onChoose]);
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent p-4 sm:items-center">
      <div
        className={`grid w-full max-w-3xl gap-5 rounded-2xl border border-white/10 bg-[#10141b]/95 p-5 shadow-2xl ${img ? (tall ? "sm:grid-cols-[180px_1fr]" : "") : ""}`}
      >
        {img && (
          <img
            src={img}
            alt=""
            className={`rounded-lg border border-white/10 ${tall ? "mx-auto max-h-[32dvh] sm:max-h-[50dvh]" : "max-h-[28dvh] w-full object-contain sm:max-h-[40dvh]"}`}
          />
        )}
        <div>
          <p className="font-game text-xs tracking-[0.2em] text-[#c4a574]">
            {prompt.who.toUpperCase()} · {prompt.role}
          </p>
          <p className="mt-2 text-lg leading-snug">{prompt.text}</p>
          <div className="mt-4 grid gap-2">
            {choices.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onChoose(c)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-[#c4a574]/60 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c4a574]"
              >
                <span className="font-game text-sm text-[#c4a574]">{i + 1}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Debrief({
  shift,
  picked,
  finds,
  found,
  onNext,
}: {
  shift: ShiftDef;
  picked: Record<string, WeekChoice>;
  finds: Find[];
  found: Record<string, true>;
  onNext: () => void;
}) {
  const got = finds.filter((f) => found[f.id]);
  return (
    <Overlay>
      <h2 className="font-display text-3xl">How it went</h2>
      <ul className="mt-4 space-y-4">
        {shift.beats.map((b) => {
          const c = picked[b.scenario.id];
          const right = b.scenario.choices.find((x) => x.ok);
          return (
            <li key={b.scenario.id} className="border-l-2 pl-3" style={{ borderColor: c?.ok ? "#7fd6a8" : "#ff7a66" }}>
              <p className="font-game text-xs tracking-[0.16em] text-[#a8a59c]">{b.scenario.prompt.who.toUpperCase()}</p>
              <p className="mt-1">{c ? c.debrief : "Skipped."}</p>
              {!c?.ok && right && <p className="mt-1 text-sm text-[#8fe0b4]">Next time: {right.label.toLowerCase()}.</p>}
            </li>
          );
        })}
      </ul>
      {finds.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#7fd6a8]/25 bg-[#0d1f18]/60 p-4">
          <p className="font-game text-xs tracking-[0.18em] text-[#8fe0b4]">
            SHARP EYE · {got.length} OF {finds.length}
          </p>
          {got.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {got.map((f) => (
                <li key={f.id}>
                  <span className="font-semibold">{f.label}.</span> {f.why}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#d8d2c4]">
              None spotted this time. There are {finds.length} security slip-ups hidden in tonight's rooms. Optional, and they don't count against you.
            </p>
          )}
          {got.length > 0 && got.length < finds.length && (
            <p className="mt-2 text-sm text-[#a8a59c]">{finds.length - got.length} still hiding. Play again to find them.</p>
          )}
        </div>
      )}
      <button type="button" onClick={onNext} className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
        KNOWLEDGE CHECK
      </button>
    </Overlay>
  );
}

function Check({ items, onDone }: { items: CheckItem[]; onDone: (ratio: number) => void }) {
  const draw = useMemo(
    () =>
      shuffle(items)
        .slice(0, 5)
        .map((q) => ({ ...q, choices: shuffle(q.choices) })),
    [items],
  );
  const [at, setAt] = useState(0);
  const [right, setRight] = useState(0);
  const [shown, setShown] = useState<string | null>(null);
  const q = draw[at];
  const pick = (id: string) => {
    if (shown) return;
    setShown(id);
    const ok = q.choices.find((c) => c.id === id)?.correct;
    if (ok) setRight((r) => r + 1);
  };
  const next = () => {
    if (at + 1 >= draw.length) onDone(right / draw.length);
    else {
      setAt(at + 1);
      setShown(null);
    }
  };
  return (
    <Overlay>
      <p className="font-game text-xs tracking-[0.2em] text-[#c4a574]">
        QUESTION {at + 1} OF {draw.length}
      </p>
      <p className="mt-2 text-lg">{q.prompt}</p>
      <div className="mt-4 grid gap-2">
        {q.choices.map((c) => {
          const state = shown ? (c.correct ? "right" : c.id === shown ? "wrong" : "") : "";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c.id)}
              className={`rounded-xl border px-4 py-3 text-left ${
                state === "right"
                  ? "border-[#7fd6a8] bg-[#0d1f18]"
                  : state === "wrong"
                    ? "border-[#ff7a66] bg-[#2a0f0f]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {shown && (
        <button type="button" onClick={next} className="mt-5 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
          {at + 1 >= draw.length ? "FINISH" : "NEXT"}
        </button>
      )}
    </Overlay>
  );
}

/** Drag anywhere to look. On touch, the left 40% belongs to the thumb pad. */
function LookLayer({ active }: { active: boolean }) {
  const last = useRef<{ x: number; y: number } | null>(null);
  if (!active) return null;
  return (
    <div
      className="absolute inset-0"
      onPointerDown={(e) => {
        const coarse = window.matchMedia("(pointer: coarse)").matches;
        if (coarse && e.clientX < window.innerWidth * 0.4) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        player.yaw -= (e.clientX - last.current.x) * 0.004;
        player.pitch = Math.max(-0.9, Math.min(0.6, player.pitch - (e.clientY - last.current.y) * 0.003));
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    />
  );
}

function TouchStick() {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const R = 48;
  const end = () => {
    origin.current = null;
    setKnob(null);
    player.moveX = 0;
    player.moveZ = 0;
  };
  return (
    <div
      className="absolute bottom-6 left-6 h-32 w-32 rounded-full border border-white/15 bg-white/5 [@media(pointer:fine)]:hidden"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        let x = e.clientX - origin.current.x;
        let y = e.clientY - origin.current.y;
        const len = Math.hypot(x, y);
        if (len > R) {
          x = (x / len) * R;
          y = (y / len) * R;
        }
        setKnob({ x, y });
        player.moveX = x / R;
        player.moveZ = y / R;
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
        style={knob ? { transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` } : undefined}
      />
    </div>
  );
}
