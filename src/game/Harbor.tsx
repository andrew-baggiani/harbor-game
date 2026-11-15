import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping, SMAA, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Link } from "@tanstack/react-router";
import { Marker, People, Rain, Rig, Sky, Trail } from "@/game/draw";
import { HarborWorld } from "@/game/scenery";
import { blip, caption, say, unlockAudio } from "@/game/audio";
import { nightPath, reportLines, scoreOf } from "@/game/story";
import { drawKnowledgeCheck, type CheckItem } from "@/game/scenarios";
import { exportRecord, gradeKnowledge } from "@/game/records";
import { markerNow } from "@/game/sim";
import { keys, useHarbor, world, fleet } from "@/game/state";
import { ShareButton } from "@/components/share-button";

function LoadBar() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  const width = Math.max(6, Math.min(100, progress));
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 px-6 pb-8">
      <p className="mb-2 font-serif text-sm text-[#f4f0e6]">Loading the quay</p>
      <div className="h-1.5 w-full overflow-hidden bg-[#1a1c20]">
        <div className="h-full bg-[#c4a574]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function Harbor({
  callsign,
  onDone,
}: {
  callsign: string;
  onDone: (score: number, clean: boolean) => void;
}) {
  const lookDrag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    useHarbor.getState().reset();
    const down = (event: KeyboardEvent) => {
      if (event.repeat && (event.code.startsWith("Digit") || event.code.startsWith("Numpad"))) return;
      press(event.code, true);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD", "Enter"].includes(event.code)) event.preventDefault();
    };
    const up = (event: KeyboardEvent) => press(event.code, false);
    const blur = () => {
      heldKeys.clear();
      syncKeys();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return (
    <div
      className="relative h-dvh w-full select-none overflow-hidden bg-[#07090e] text-[#f4f0e6]"
      style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.focus();
      }}
    >
      <Canvas
        className="h-full w-full"
        dpr={[1, 2]}
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: 46, near: 0.12, far: 480, position: [0, 2.6, 10] }}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
          gl.shadowMap.enabled = true;
          gl.setClearColor("#07090e");
        }}
        onPointerDown={() => unlockAudio()}
      >
        <fog attach="fog" args={["#121820", 16, 92]} />
        <hemisphereLight args={["#8aa0b8", "#1a1814", 0.15]} />
        <directionalLight
          position={[40, 80, -30]}
          intensity={0.32}
          color="#d5e2f4"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.00025}
          shadow-camera-near={2}
          shadow-camera-far={180}
          shadow-camera-left={-60}
          shadow-camera-right={60}
          shadow-camera-top={60}
          shadow-camera-bottom={-60}
        />
        <directionalLight position={[-30, 18, -20]} intensity={0.08} color="#ffc49a" />
        <directionalLight position={[6, 10, 34]} intensity={0.42} color="#b7c9dc" />
        <Sky />
        <Suspense fallback={null}>
          <HarborWorld />
        </Suspense>
        <People />
        <Marker />
        <Trail />
        <Rain />
        <Rig />
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom intensity={0.22} luminanceThreshold={0.78} luminanceSmoothing={0.2} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <BrightnessContrast brightness={0.01} contrast={0.05} />
          <HueSaturation saturation={0} />
          <Vignette offset={0.28} darkness={0.28} />
          <SMAA />
        </EffectComposer>
      </Canvas>
      <LoadBar />
      <div
        className="absolute inset-0 z-10"
        onPointerDown={(event) => {
          unlockAudio();
          const target = event.target as HTMLElement;
          if (target.closest("button, a, input, textarea, [data-touch]")) return;
          const coarse = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
          if (coarse && event.clientX < window.innerWidth * 0.42) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          lookDrag.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          if (!lookDrag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          world.lookX += (event.clientX - lookDrag.current.x) * 0.0034;
          world.lookY += (event.clientY - lookDrag.current.y) * 0.0026;
          lookDrag.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={() => {
          lookDrag.current = null;
        }}
        onPointerCancel={() => {
          lookDrag.current = null;
        }}
      >
        <Hud callsign={callsign} onDone={onDone} />
      </div>
    </div>
  );
}

const heldKeys = new Set<string>();

function syncKeys() {
  const has = (...codes: string[]) => codes.some((code) => heldKeys.has(code));
  keys.w = has("KeyW", "ArrowUp", "Numpad8");
  keys.a = has("KeyA", "ArrowLeft", "Numpad4");
  keys.s = has("KeyS", "ArrowDown", "Numpad2");
  keys.d = has("KeyD", "ArrowRight", "Numpad6");
  keys.left = has("KeyJ", "KeyQ");
  keys.right = has("KeyL");
  keys.up = has("KeyI");
  keys.down = has("KeyK");
  keys.run = has("ShiftLeft", "ShiftRight");
}

function press(code: string, down: boolean) {
  if (down) heldKeys.add(code);
  else heldKeys.delete(code);
  syncKeys();
  if (!down) return;
  const store = useHarbor.getState();
  if (store.talk && !code.startsWith("Shift")) {
    const count = store.talk.choices.length;
    if (code === "ArrowDown" || code === "ArrowRight" || code === "KeyS" || code === "KeyD") {
      world.choice = (world.choice + 1) % count;
      return;
    }
    if (code === "ArrowUp" || code === "ArrowLeft" || code === "KeyW" || code === "KeyA") {
      world.choice = (world.choice + count - 1) % count;
      return;
    }
    if (code === "Enter" || code === "NumpadEnter" || code === "Space") {
      const choice = store.talk.choices[world.choice];
      if (choice) {
        blip(640);
        store.choose(choice.id);
      }
      return;
    }
  }
  if (code === "KeyE" || code === "Enter" || code === "NumpadEnter" || code === "Space") {
    unlockAudio();
    const live = useHarbor.getState();
    if (live.boot) {
      say("brief");
      live.setBoot(false);
      return;
    }
    if (live.talk) return;
    world.wantInteract = true;
  }
  if (code === "Escape") {
    const live = useHarbor.getState();
    if (live.talk) {
      useHarbor.setState({ talk: null });
      return;
    }
    if (!live.boot) live.setPaused(!live.paused);
  }
  if (storeTalk() && (code === "Digit1" || code === "Digit2" || code === "Digit3" || code === "Numpad1" || code === "Numpad2" || code === "Numpad3")) {
    const index = Number(code.slice(-1)) - 1;
    const talk = useHarbor.getState().talk;
    const choice = talk?.choices[index];
    if (choice) useHarbor.getState().choose(choice.id);
  }
}

function storeTalk() {
  return useHarbor.getState().talk != null;
}

function KnowledgeGate({ onPassed }: { onPassed: () => void }) {
  const [items, setItems] = useState<CheckItem[]>(() => drawKnowledgeCheck(8));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ id: string; choice: string }[]>([]);
  const [missed, setMissed] = useState<{ correct: number; asked: number } | null>(null);
  const item = items[index];
  const pick = (choice: string) => {
    if (!item) return;
    const next = [...answers, { id: item.id, choice }];
    if (index + 1 < items.length) {
      setAnswers(next);
      setIndex(index + 1);
      return;
    }
    const graded = gradeKnowledge(items, next);
    if (graded.passed) onPassed();
    else setMissed({ correct: graded.correct, asked: graded.asked });
  };
  const retry = () => {
    setItems(drawKnowledgeCheck(8));
    setIndex(0);
    setAnswers([]);
    setMissed(null);
  };
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-start bg-[#07090e]/70 p-4 md:items-center md:p-10">
      <div className="w-full max-w-lg select-none border border-white/10 bg-[#0c0d0f]/95 p-6 md:p-8">
        <p className="text-[10px] tracking-[0.24em] text-[#c4a574]">KNOWLEDGE CHECK · 7 OF 8 TO PASS</p>
        {missed ? (
          <>
            <h2 className="mt-2 font-display text-5xl text-[#f4f0e6]">{missed.correct}/{missed.asked}</h2>
            <p className="mt-3 text-sm text-[#a8a59c]">That is under 7 of 8. The questions change. Try again.</p>
            <button type="button" className="mt-6 min-h-11 border border-[#c4a574] px-4 text-sm" onClick={retry}>
              Try again
            </button>
          </>
        ) : item ? (
          <>
            <p className="mt-2 text-[10px] tracking-[0.16em] text-[#a8a59c]">{index + 1} / {items.length}</p>
            <h2 className="mt-2 font-display text-3xl text-balance text-[#f4f0e6]">{item.prompt}</h2>
            <div className="mt-5 flex flex-col border-t border-white/10">
              {item.choices.map((choice) => (
                <button key={choice.id} type="button" className="min-h-12 border-b border-white/10 text-left text-sm text-[#f4f0e6]" onClick={() => pick(choice.id)}>
                  {choice.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function pinName(beat: string) {
  if (beat === "tower" || beat === "door") return "Harbor Tower";
  if (beat === "lobby" || beat === "down") return "Elevator";
  if (beat === "desk") return "Your desk";
  if (beat === "phone") return "Phone";
  if (beat === "usb") return "USB stick";
  if (beat === "maya") return "Maya";
  if (beat === "leave") return "Front door";
  return "Next";
}

function RideFade() {
  const veil = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      if (veil.current) {
        veil.current.style.opacity = String(world.fade);
        veil.current.style.visibility = world.fade > 0.01 ? "visible" : "hidden";
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return <div ref={veil} className="pointer-events-none absolute inset-0 z-30 bg-black" style={{ opacity: 0 }} />;
}

function Waypoint({ beat }: { beat: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        if (!world.markerOn) {
          el.style.opacity = "0";
        } else {
          el.style.opacity = "1";
          let x = world.markerSx;
          let y = world.markerSy;
          if (world.markerBehind) {
            x = 1 - x;
            y = 0.86;
          }
          x = Math.min(0.9, Math.max(0.1, x));
          y = Math.min(0.82, Math.max(0.14, y));
          el.style.left = `${x * 100}%`;
          el.style.top = `${y * 100}%`;
          if (label.current) {
            const spot = markerNow();
            const dist = spot ? Math.hypot(world.px - spot.x, world.py - spot.y, world.pz - spot.z) : 0;
            label.current.textContent = `${Math.max(0, Math.round(dist))} m`;
          }
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full text-center">
      <div className="mx-auto h-7 w-px bg-[#c4a574]" />
      <div className="mx-auto -mt-px h-1.5 w-1.5 rounded-full bg-[#c4a574]" />
      <p className="mt-1.5 text-[10px] tracking-[0.2em] text-[#c4a574]">{pinName(beat).toUpperCase()}</p>
      <p ref={label} className="font-display text-sm tabular-nums text-[#f4f0e6]" />
    </div>
  );
}

function Hud({ callsign, onDone }: { callsign: string; onDone: (score: number, clean: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  const beat = useHarbor((s) => s.beat);
  const talk = useHarbor((s) => s.talk);
  const bark = useHarbor((s) => s.bark);
  const objective = useHarbor((s) => s.objective);
  const prompt = useHarbor((s) => s.prompt);
  const paused = useHarbor((s) => s.paused);
  const boot = useHarbor((s) => s.boot);
  const hint = useHarbor((s) => s.hint);
  const minute = useHarbor((s) => s.minute);
  const report = useHarbor((s) => s.report);
  const flags = useHarbor((s) => s.flags);
  const driving = useHarbor((s) => s.driving);
  const coarse = useCoarse();
  const [speed, setSpeed] = useState(0);
  const [spoken, setSpoken] = useState({ who: "", text: "" });
  const [pick, setPick] = useState(0);
  useEffect(() => {
    if (!report) setChecked(false);
  }, [report]);
  useEffect(() => {
    world.choice = 0;
    setPick(0);
  }, [talk]);
  useEffect(() => {
    const id = window.setInterval(() => {
      setPick(world.choice);
      if (caption.t > 0) setSpoken({ who: caption.who, text: caption.text });
      else setSpoken({ who: "", text: "" });
    }, 120);
    return () => window.clearInterval(id);
  }, []);
  const filed = useRef(false);
  const map = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setSpeed(Math.abs(world.carSpeed)), 160);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!report || filed.current) return;
    filed.current = true;
    const scored = scoreOf(flags);
    onDone(scored.score, scored.clean);
  }, [report, flags, onDone]);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const canvas = map.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(8,10,14,0.72)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      const scale = 1.7;
      const cx = w / 2 - world.px * scale;
      const cz = h / 2 - world.pz * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#0c2430";
      ctx.fillRect(cx - 110 * scale, cz + 16 * scale, 220 * scale, 30 * scale);
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(cx - 100 * scale, cz + 6.2 * scale, 200 * scale, 10 * scale);
      ctx.fillStyle = "#3a4450";
      ctx.fillRect(cx - 11 * scale, cz - 18 * scale, 22 * scale, 18 * scale);
      for (const car of fleet) {
        ctx.fillStyle = "rgba(216,212,200,0.7)";
        ctx.fillRect(cx + car.x * scale - 2, cz + car.z * scale - 1, 5, 3);
      }
      const spot = markerNow();
      if (spot) {
        let dx = (spot.x - world.px) * scale;
        let dy = (spot.z - world.pz) * scale;
        const mag = Math.hypot(dx, dy);
        const maxR = w / 2 - 12;
        if (mag > maxR) {
          dx = (dx / mag) * maxR;
          dy = (dy / mag) * maxR;
        }
        const pulse = 0.55 + Math.sin(performance.now() / 180) * 0.45;
        ctx.strokeStyle = `rgba(196,165,116,${0.35 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + dx, h / 2 + dy);
        ctx.stroke();
        ctx.fillStyle = "#f4f0e6";
        ctx.beginPath();
        ctx.arc(w / 2 + dx, h / 2 + dy, 3.2 + pulse * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#c4a574";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2 + dx, h / 2 + dy, 7 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-world.camYaw + Math.PI / 2);
      ctx.fillStyle = "#f4f0e6";
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.fill();
      ctx.restore();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  const scored = scoreOf(flags);
  const lines = reportLines(flags);
  const steps = [
    ["Door", flags.door],
    ["Mail", flags.mail],
    ["Phone", flags.phone],
    ["USB", flags.usb],
    ["Wire", flags.wire],
  ] as const;

  if (boot) return <Briefing />;

  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 w-[min(22rem,calc(100%-6.5rem))] md:left-6 md:top-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[10px] tracking-[0.24em] text-[#c4a574]">MONDAY · {callsign || "HARBOR"}</p>
          <p className="tabular-nums text-xs text-[#a8a59c]">{clock}</p>
        </div>
        <p className="mt-1 font-display text-2xl leading-tight text-balance text-[#f4f0e6] md:text-[1.7rem]">{objective}</p>
        {spoken.who ? (
          <div className="mt-3 max-w-md border border-[#c4a574]/40 bg-[#0c0d0f]/80 px-3 py-2">
            <p className="text-[10px] tracking-[0.18em] text-[#c4a574]">{spoken.who.toUpperCase()}</p>
            <p className="mt-1 text-sm leading-snug text-[#f4f0e6]">{spoken.text}</p>
          </div>
        ) : null}
        <ol className="mt-3 flex gap-3">
          {steps.map(([name, done]) => (
            <li key={name} className={done ? "text-[10px] tracking-[0.14em] text-[#c4a574]" : "text-[10px] tracking-[0.14em] text-[#6e6a62]"}>
              <span className={done ? "mb-1 block h-px w-full bg-[#c4a574]" : "mb-1 block h-px w-full bg-white/15"} />
              {name.toUpperCase()}
            </li>
          ))}
        </ol>
      </div>
      <Waypoint beat={beat} />
      <RideFade />
      <canvas ref={map} width={180} height={180} className={coarse ? "pointer-events-none absolute left-4 top-32 h-16 w-16 rounded-full" : "pointer-events-none absolute bottom-5 left-5 h-24 w-24 rounded-full md:h-28 md:w-28"} />
      {driving && !boot ? (
        <p className={coarse ? "pointer-events-none absolute right-4 top-16 font-display text-3xl tabular-nums text-[#f4f0e6]" : "pointer-events-none absolute bottom-6 right-6 font-display text-4xl tabular-nums text-[#f4f0e6]"}>
          {Math.round(speed * 3.6)}
          <span className="ml-1 text-sm tracking-normal text-[#a8a59c]">km/h</span>
        </p>
      ) : null}
      {prompt && !talk && !boot ? (
        <div className={coarse ? "absolute inset-x-0 bottom-48 z-30 flex justify-center px-16" : "absolute inset-x-0 bottom-24 z-30 flex justify-center md:bottom-16"}>
          <button
            type="button"
            className="border border-[#c4a574]/50 bg-[#0c0d0f]/85 px-5 py-2.5 font-display text-2xl text-[#f4f0e6]"
            onClick={() => {
              unlockAudio();
              world.wantInteract = true;
            }}
          >
            {prompt}
          </button>
        </div>
      ) : null}
      {hint && !boot && !talk && !report && !prompt ? <Keys /> : null}
      {talk ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent px-4 pb-5 pt-16">
          <div className="w-full max-w-xl border border-white/10 bg-[#0c0d0f]/92 p-5">
            <p className="text-[10px] tracking-[0.2em] text-[#c4a574]">{talk.who.toUpperCase()}</p>
            <p className="mt-1 text-xs text-[#a8a59c]">{talk.role}</p>
            <p className="mt-3 font-display text-2xl text-balance text-[#f4f0e6] md:text-[1.7rem]">{talk.text}</p>
            <div className="mt-4 flex flex-col">
              {talk.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  className={index === pick ? "flex min-h-12 items-center gap-3 border-t border-[#c4a574] bg-[#c4a574]/10 text-left text-[#f4f0e6]" : "flex min-h-12 items-center gap-3 border-t border-white/10 text-left text-[#f4f0e6] hover:bg-white/5"}
                  onClick={() => {
                    blip(640);
                    useHarbor.getState().choose(choice.id);
                  }}
                  onMouseEnter={() => {
                    world.choice = index;
                    setPick(index);
                  }}
                >
                  <span className="w-6 font-display text-[#c4a574]">{index + 1}</span>
                  <span>{choice.label}</span>
                </button>
              ))}
              <p className="mt-3 text-[10px] tracking-[0.16em] text-[#a8a59c]">TAP A LINE  ·  ARROWS AND ENTER ALSO WORK</p>
            </div>
          </div>
        </div>
      ) : null}
      {report && !checked ? <KnowledgeGate onPassed={() => setChecked(true)} /> : null}
      {report && checked ? (
        <div className="absolute inset-0 flex items-end justify-start bg-[#07090e]/55 p-4 md:items-center md:p-10">
          <div className="w-full max-w-lg border border-white/10 bg-[#0c0d0f]/95 p-6 md:p-8">
            <p className="text-[10px] tracking-[0.24em] text-[#c4a574]">MONDAY CLOSED</p>
            <h2 className="mt-2 font-display text-5xl text-[#f4f0e6]">{scored.title}</h2>
            <p className="mt-2 font-display text-4xl tabular-nums text-[#f4f0e6]">{scored.score}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] tracking-[0.08em] text-[#d9d4c8]">
              {Object.entries(scored.skills).map(([skill, value]) => (
                <li key={skill} className="flex justify-between gap-3 border-b border-white/10 py-1">
                  <span>{skill}</span>
                  <span className="tabular-nums text-[#c4a574]">{value}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-2 border-t border-white/10 pt-4">
              {lines.map((line) => (
                <li key={line.text} className={line.ok ? "text-sm text-[#f4f0e6]" : "text-sm text-[#e7b2a4]"}>
                  {line.text}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ShareButton
                label="Share the night"
                title={`${callsign} · Harbor`}
                text={`Harbor Monday — ${scored.title}. ${scored.score}.`}
                path={nightPath(flags)}
              />
              <button type="button" className="min-h-11 border border-white/20 px-4 text-sm" onClick={() => exportRecord(callsign, flags)}>
                Export record
              </button>
              <button
                type="button"
                className="min-h-11 border border-white/20 px-4 text-sm"
                onClick={() => {
                  filed.current = false;
                  useHarbor.getState().reset();
                  useHarbor.getState().setBoot(false);
                }}
              >
                Play Monday again
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {paused && !report ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07090e]/70 p-4">
          <div className="w-full max-w-xs border border-white/10 bg-[#0c0d0f] p-6">
            <p className="text-[10px] tracking-[0.24em] text-[#c4a574]">PAUSED</p>
            <p className="mt-2 font-display text-4xl">Harbor</p>
            <div className="mt-5 flex flex-col border-t border-white/10">
              <button type="button" className="min-h-12 border-b border-white/10 text-left" onClick={() => useHarbor.getState().setPaused(false)}>
                Resume
              </button>
              <Link to="/path" className="flex min-h-12 items-center border-b border-white/10">
                Field manual
              </Link>
              <Link to="/drills" className="flex min-h-12 items-center border-b border-white/10">
                Drills
              </Link>
              <Link to="/record" className="flex min-h-12 items-center">
                Record
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {!talk && !report ? <Touch driving={driving} /> : null}
      {!boot && !report ? (
        <button
          type="button"
          className="absolute right-4 top-4 min-h-11 border border-white/15 bg-[#0c0d0f]/70 px-3 text-[10px] tracking-[0.2em] text-[#d9d4c8] md:right-6"
          onClick={() => useHarbor.getState().setPaused(true)}
        >
          MENU
        </button>
      ) : null}
    </>
  );
}

function Briefing() {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-gradient-to-t from-[#07090e] via-[#07090e]/90 to-[#07090e]/20 p-5 md:items-center md:p-14">
      <div className="w-full max-w-xl">
        <p className="text-[10px] tracking-[0.28em] text-[#c4a574]">MERIDIAN · HARBOR & CO.</p>
        <h1 className="mt-2 font-display text-6xl text-[#f4f0e6] md:text-7xl">Monday night</h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[#d9d4c8]">
          You are the new hire at Harbor and Company, a shipping firm on the quay. A narrator starts the night. After that, the voice is whoever is in front of you: the courier, June at reception, the mail, the caller, Maya in finance.
        </p>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-[#d9d4c8]">
          Those asks are the mistakes companies actually make. The game is the training. You walk there, you decide, and the night files a report on what you did.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#a8a59c]">
          Arrow keys walk, drive, and steer. Shift runs. Drag looks any direction, or I J K L. E or Enter uses whatever is in front of you. On a phone, the left thumb walks and steers, drag the right side to look, and USE is the round button. The gold dashes are the next decision.
        </p>
        <button
          type="button"
          className="mt-6 min-h-12 border border-[#c4a574] px-5 text-sm tracking-[0.18em] text-[#f4f0e6]"
          onClick={() => {
            unlockAudio();
            blip(440);
            say("brief");
            useHarbor.getState().setBoot(false);
          }}
        >
          START THE SHIFT
        </button>
      </div>
    </div>
  );
}

function Keys() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center md:flex">
      <div className="flex items-center gap-4 border border-white/10 bg-[#0c0d0f]/75 px-4 py-2 text-xs text-[#d9d4c8]">
        <span><kbd className="mr-1.5 border border-white/20 px-1.5 py-0.5 font-display text-[#f4f0e6]">↑←↓→</kbd>move</span>
        <span><kbd className="mr-1.5 border border-white/20 px-1.5 py-0.5 font-display text-[#f4f0e6]">Shift</kbd>run</span>
        <span><kbd className="mr-1.5 border border-white/20 px-1.5 py-0.5 font-display text-[#f4f0e6]">drag</kbd>look</span>
        <span><kbd className="mr-1.5 border border-white/20 px-1.5 py-0.5 font-display text-[#f4f0e6]">IJKL</kbd>look</span>
        <span><kbd className="mr-1.5 border border-white/20 px-1.5 py-0.5 font-display text-[#f4f0e6]">Enter</kbd>use</span>
      </div>
    </div>
  );
}

function useCoarse() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const query = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
      setOn(coarse || window.innerWidth < 900);
    };
    query();
    window.addEventListener("resize", query);
    return () => window.removeEventListener("resize", query);
  }, []);
  return on;
}

function Touch({ driving }: { driving: boolean }) {
  const coarse = useCoarse();
  const [run, setRun] = useState(false);
  if (!coarse) return null;
  return (
    <>
      <MoveStick driving={driving} />
      <p className="pointer-events-none absolute bottom-36 right-24 text-[10px] tracking-[0.2em] text-[#a8a59c]">DRAG TO LOOK</p>
      <div data-touch className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-3">
        <button
          type="button"
          className={run ? "flex h-14 w-14 items-center justify-center rounded-full border border-[#c4a574] bg-[#c4a574]/25 text-[10px] tracking-[0.14em] text-[#f4f0e6]" : "flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-[#0c0d0f]/75 text-[10px] tracking-[0.14em] text-[#f4f0e6]"}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const next = !world.touchRun;
            world.touchRun = next;
            setRun(next);
          }}
        >
          RUN
        </button>
        <button
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c4a574] bg-[#0c0d0f]/85 text-xs tracking-[0.16em] text-[#f4f0e6]"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            unlockAudio();
            const live = useHarbor.getState();
            if (live.talk) return;
            world.wantInteract = true;
          }}
        >
          USE
        </button>
      </div>
    </>
  );
}

function MoveStick({ driving }: { driving: boolean }) {
  const zone = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState({ x: 78, y: 150, dx: 0, dy: 0, on: false });

  function release() {
    world.stickX = 0;
    world.stickY = 0;
    setKnob((prev) => ({ ...prev, dx: 0, dy: 0, on: false }));
  }

  function apply(clientX: number, clientY: number) {
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    const max = 56;
    const mag = Math.hypot(dx, dy) || 1;
    const clamp = Math.min(max, mag);
    const nx = (dx / mag) * clamp;
    const ny = (dy / mag) * clamp;
    const rx = nx / max;
    const ry = ny / max;
    const len = Math.hypot(rx, ry);
    const dead = 0.16;
    if (len < dead) {
      world.stickX = 0;
      world.stickY = 0;
    } else {
      const scale = (len - dead) / ((1 - dead) * len);
      world.stickX = Math.max(-1, Math.min(1, rx * scale));
      world.stickY = Math.max(-1, Math.min(1, -ry * scale));
    }
    setKnob((prev) => ({ ...prev, dx: nx, dy: ny, on: true }));
  }

  return (
    <div
      ref={zone}
      data-touch
      className="absolute bottom-0 left-0 z-20 h-56 w-[42vw] max-w-60"
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        unlockAudio();
        origin.current = { x: event.clientX, y: event.clientY };
        const rect = zone.current?.getBoundingClientRect();
        setKnob({
          x: event.clientX - (rect?.left ?? 0),
          y: event.clientY - (rect?.top ?? 0),
          dx: 0,
          dy: 0,
          on: true,
        });
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        apply(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {knob.on ? (
        <div className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-black/45" style={{ left: knob.x, top: knob.y }}>
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4f0e6]/80" style={{ marginLeft: knob.dx, marginTop: knob.dy }} />
        </div>
      ) : (
        <div className="absolute bottom-8 left-5 h-28 w-28 rounded-full border border-white/35 bg-black/40">
          <div className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
          <p className="absolute inset-x-0 bottom-2 text-center text-[10px] tracking-[0.18em] text-[#f4f0e6]">{driving ? "DRIVE" : "MOVE"}</p>
        </div>
      )}
    </div>
  );
}
