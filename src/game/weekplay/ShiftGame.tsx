import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CheckItem } from "@/game/scenarios";
import type { FalloutStep, ShiftDef, WeekBeat, WeekChoice } from "@/content/week/types";
import { checkLearner, logDecision, logShiftComplete, newShiftRun } from "@/game/telemetry";
import { saveWeek } from "@/game/weekplay/progress";
import { BeatProp, CastFigure, Room, Walker, player } from "@/game/weekplay/Scene";
import { SETS } from "@/game/weekplay/sets";

type Phase = "intro" | "play" | "panel" | "wrap" | "debrief" | "check" | "result";
type Bark = { id: number; who: string; text: string; bad: boolean };

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

  const beat = shift.beats[Math.min(index, shift.beats.length - 1)];
  const set = SETS[roomSet];
  const spot = phase === "play" && beat.set === roomSet ? set.spots[beat.spot] : null;

  const placePlayer = useCallback((kind: typeof roomSet) => {
    const s = SETS[kind];
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

  const pushBark = useCallback((who: string, text: string, bad: boolean) => {
    const id = (barkId.current += 1);
    setBarks((list) => [...list.slice(-3), { id, who, text, bad }]);
    timers.current.push(window.setTimeout(() => setBarks((list) => list.filter((b) => b.id !== id)), 9000));
  }, []);

  const open = useCallback(() => {
    if (phase !== "play" || !near) return;
    if (beat.prop?.reveal) setFlipped((f) => ({ ...f, [beat.scenario.id]: true }));
    player.keys.clear();
    setPhase("panel");
  }, [beat, near, phase]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && phase === "play") open();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, phase]);

  const choose = (choice: WeekChoice) => {
    const id = beat.scenario.id;
    setPicked((p) => ({ ...p, [id]: choice }));
    logDecision(choice.id);
    const steps: FalloutStep[] = beat.timeline?.[choice.id] ?? [];
    if (choice.ok) pushBark(beat.scenario.prompt.who, choice.debrief, false);
    else if (!steps.length) pushBark(beat.scenario.prompt.who, choice.debrief, true);
    for (const step of steps) {
      timers.current.push(
        window.setTimeout(() => {
          if (step.flip) setFlipped((f) => ({ ...f, [id]: true }));
          pushBark(step.who, step.text, true);
        }, step.at * PACE),
      );
    }
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
        camera={{ fov: 62, near: 0.05, far: 60 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearColor("#07090e");
        }}
      >
        <fog attach="fog" args={["#0c1016", 9, 26]} />
        <Room set={set} />
        {shownProps.map(({ b, i }) => (
          <BeatProp key={b.scenario.id} beat={b} set={set} flipped={!!flipped[b.scenario.id]} live={phase === "play" && i === index} />
        ))}
        {castBeat && castSpot && (
          <CastFigure slot={castBeat.cast!} x={castSpot.fx ?? castSpot.x + 0.9} z={castSpot.fz ?? castSpot.z + 1.1} />
        )}
        <Walker set={set} target={spot ? { x: spot.x, z: spot.z } : null} onNear={setNear} />
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
          <span className="font-game text-sm tracking-[0.14em] text-[#a8a59c]">
            {Math.min(index + (phase === "panel" ? 1 : 0), shift.beats.length)}/{shift.beats.length}
          </span>
          <button type="button" onClick={onExit} className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#d8d2c4] hover:bg-white/10">
            Leave
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-28 left-4 flex max-w-[24rem] flex-col gap-2 sm:bottom-6">
        {barks.map((b) => (
          <div key={b.id} className={`rounded-xl border px-3 py-2 text-sm backdrop-blur ${b.bad ? "border-[#ff7a66]/40 bg-[#2a0f0f]/80" : "border-[#7fd6a8]/30 bg-[#0d1f18]/80"}`}>
            <span className={`mr-2 font-game text-xs tracking-[0.14em] ${b.bad ? "text-[#ff9c8a]" : "text-[#8fe0b4]"}`}>{b.who.toUpperCase()}</span>
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
          {beat.cast && !beat.voiceOnly ? "TALK" : "LOOK"} <span className="ml-2 hidden opacity-60 sm:inline">E</span>
        </button>
      )}

      {phase === "play" && <TouchStick />}

      {phase === "intro" && (
        <Overlay>
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">{shift.kind === "track" ? `${shift.day.toUpperCase()} TRACK` : shift.day.toUpperCase()}</p>
          <h1 className="mt-2 font-display text-4xl">{shift.title}</h1>
          <p className="mt-3 text-[#d8d2c4]">{shift.intro}</p>
          {shift.audience && <p className="mt-3 text-sm text-[#a8a59c]">For: {shift.audience}</p>}
          <p className="mt-5 text-sm text-[#a8a59c]">
            Walk with WASD or the arrow keys, drag to look. On a phone, use the left thumb pad. Gold rings mark what needs you.
          </p>
          <button type="button" onClick={() => setPhase("play")} className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
            START THE SHIFT
          </button>
        </Overlay>
      )}

      {phase === "panel" && <Panel beat={beat} flipped={!!flipped[beat.scenario.id]} onChoose={choose} />}

      {phase === "wrap" && (
        <Overlay>
          <h2 className="font-display text-3xl">That's {shift.kind === "track" ? "the track" : `${shift.day}`}.</h2>
          <p className="mt-3 text-[#d8d2c4]">Some of tonight is still playing out. Give it a few seconds, or see how it went.</p>
          <button type="button" onClick={() => setPhase("debrief")} className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
            SEE HOW IT WENT
          </button>
        </Overlay>
      )}

      {phase === "debrief" && <Debrief shift={shift} picked={picked} onNext={() => setPhase("check")} />}
      {phase === "check" && (
        <Check
          items={shift.check}
          onDone={(ratio) => {
            const beatsScore = Math.round(
              shift.beats.reduce((sum, b) => sum + (picked[b.scenario.id]?.score ?? 0), 0) / shift.beats.length,
            );
            const passed = ratio >= PASS;
            saveWeek(shift.id, beatsScore, passed);
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
              <button type="button" onClick={() => setPhase("check")} className="rounded-full bg-[#c4a574] px-5 py-2.5 font-game tracking-[0.12em] text-[#14110c]">
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
      <div className={`grid w-full max-w-3xl gap-5 rounded-2xl border border-white/10 bg-[#10141b]/95 p-5 shadow-2xl ${img ? (tall ? "sm:grid-cols-[180px_1fr]" : "") : ""}`}>
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

function Debrief({ shift, picked, onNext }: { shift: ShiftDef; picked: Record<string, WeekChoice>; onNext: () => void }) {
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
      <button type="button" onClick={onNext} className="mt-6 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
        KNOWLEDGE CHECK
      </button>
    </Overlay>
  );
}

function Check({ items, onDone }: { items: CheckItem[]; onDone: (ratio: number) => void }) {
  const draw = useMemo(() => shuffle(items).slice(0, 5).map((q) => ({ ...q, choices: shuffle(q.choices) })), [items]);
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
                state === "right" ? "border-[#7fd6a8] bg-[#0d1f18]" : state === "wrong" ? "border-[#ff7a66] bg-[#2a0f0f]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
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
