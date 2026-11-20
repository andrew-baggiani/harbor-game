import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { create } from "zustand";
import { walker } from "@/game/layout";

/**
 * Keeps the game light enough for an ordinary laptop:
 * - a frame cap (60 while playing, 30 while a panel or menu is up; browsers already pause hidden tabs),
 * - a light budget (only the nearest few lights on the floor you're standing on stay on),
 * - auto quality (if frames fall short, lower the resolution, then drop the post effects and shadows),
 * - shadow maps refreshed a few times a second instead of every frame,
 * - and a ?debug=1 overlay with the numbers.
 *
 * Use it with <Canvas frameloop="demand">: <PerfDriver /> decides when a frame is drawn.
 */

/** Quality levels: resolution cap, and whether post effects and shadows run. */
export const LEVELS = [
  { dpr: 1.5, effects: true, shadows: true },
  { dpr: 1.25, effects: true, shadows: true },
  { dpr: 1.0, effects: true, shadows: false },
  { dpr: 0.85, effects: false, shadows: false },
] as const;

const MAX_LIGHTS = 8;

type Stats = { fps: number; ms: number; calls: number; tris: number; lights: number; dpr: number; gpu: string; textures: number; geometries: number };

type PerfState = {
  level: number;
  idle: boolean;
  stats: Stats | null;
  setIdle: (idle: boolean) => void;
};

function startLevel(): number {
  if (typeof window === "undefined") return 0;
  try {
    const q = new URLSearchParams(window.location.search).get("quality");
    if (q === "low") return 3;
    if (q === "high") return 0;
    const saved = Number(window.sessionStorage.getItem("drc-quality"));
    if (saved >= 0 && saved < LEVELS.length) return saved;
  } catch {
    /* fine */
  }
  return 0;
}

export const usePerf = create<PerfState>((set) => ({
  level: startLevel(),
  idle: false,
  stats: null,
  setIdle: (idle) => set((s) => (s.idle === idle ? s : { idle })),
}));

function setLevel(level: number) {
  usePerf.setState({ level });
  try {
    window.sessionStorage.setItem("drc-quality", String(level));
  } catch {
    /* fine */
  }
}

export function useQuality() {
  const level = usePerf((s) => s.level);
  return LEVELS[level];
}

/** ?quality=high|low pins the level (no auto changes): for screenshots and side-by-side tests. */
const pinned = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("quality");

export const debugOn = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

/** Drives rendering for a frameloop="demand" canvas, and adapts quality to what the machine can do. */
export function PerfDriver({ maxDpr = 1.5 }: { maxDpr?: number }) {
  const { invalidate, setDpr, gl, scene } = useThree();
  const level = usePerf((s) => s.level);
  const frames = useRef(0);
  const debug = useRef(debugOn());

  // Resolution follows the quality level (never above the screen's own density).
  useEffect(() => {
    const cap = Math.min(LEVELS[level].dpr, maxDpr, window.devicePixelRatio || 1);
    setDpr(Math.max(0.75, cap));
  }, [level, maxDpr, setDpr]);

  // Shadows: off on the lower levels, and refreshed at ~15 Hz instead of every frame.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    scene.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (l.isDirectionalLight && l.userData.castsShadow === undefined) l.userData.castsShadow = l.castShadow;
      if (l.isDirectionalLight && l.userData.castsShadow) l.castShadow = LEVELS[level].shadows;
    });
  }, [gl, scene, level]);

  // The clock: ask for a frame when one is due.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let shadowTick = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const fps = usePerf.getState().idle ? 30 : 60;
      // A little slack so a 60 Hz screen still gets every frame.
      if (now - last < 1000 / fps - 2) return;
      last = now;
      if (++shadowTick % 4 === 0) gl.shadowMap.needsUpdate = true;
      invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gl, invalidate]);

  // Count frames; the window below turns them into fps.
  useFrame(() => {
    frames.current += 1;
    if (debug.current) {
      const i = gl.info;
      i.autoReset = false;
      lastFrame.calls = i.render.calls;
      lastFrame.tris = i.render.triangles;
      i.reset();
    }
  });

  // Every 2 s: are we keeping up? Step down fast, step back up slowly, and only once.
  useEffect(() => {
    let started = performance.now();
    let lastTime = performance.now();
    let good = 0;
    let steppedUp = false;
    let lastChange = 0;
    const gpu = gpuName(gl);
    const id = window.setInterval(() => {
      const now = performance.now();
      const span = (now - lastTime) / 1000;
      lastTime = now;
      const n = frames.current;
      frames.current = 0;
      if (document.hidden || span <= 0) return;
      const fps = n / span;
      const { idle, level: lv } = usePerf.getState();
      const target = idle ? 30 : 60;
      if (debug.current) {
        usePerf.setState({
          stats: {
            fps: Math.round(fps),
            ms: Math.round((span * 1000) / Math.max(1, n)),
            calls: lastFrame.calls,
            tris: lastFrame.tris,
            lights: countLights(scene),
            dpr: +gl.getPixelRatio().toFixed(2),
            gpu,
            textures: gl.info.memory.textures,
            geometries: gl.info.memory.geometries,
          },
        });
      }
      // Give loading and shader compiles time to settle before judging.
      if (pinned()) return;
      if (now - started < 6000 || now - lastChange < 4000) return;
      if (fps < target * 0.8 && lv < LEVELS.length - 1) {
        setLevel(lv + 1);
        lastChange = now;
        good = 0;
      } else if (fps >= target * 0.97 && lv > 0 && !steppedUp) {
        good += 1;
        if (good >= 8) {
          setLevel(lv - 1);
          steppedUp = true;
          lastChange = now;
          good = 0;
        }
      } else good = 0;
    }, 2000);
    const onVisible = () => {
      if (!document.hidden) {
        started = performance.now();
        lastTime = started;
        frames.current = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [gl, scene]);

  return <LightBudget />;
}

const lastFrame = { calls: 0, tris: 0 };

function gpuName(gl: THREE.WebGLRenderer): string {
  try {
    const ctx = gl.getContext();
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    return ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "unknown";
  } catch {
    return "unknown";
  }
}

function countLights(scene: THREE.Scene) {
  let n = 0;
  scene.traverseVisible((o) => {
    if ((o as THREE.Light).isLight && !(o as THREE.AmbientLight).isAmbientLight) n++;
  });
  return n;
}

/**
 * Every lit pixel pays for every visible light, so keep only the nearest few point and spot lights on the
 * floor you're standing on. Changing the set recompiles shaders, so it only happens once you've been
 * standing on a floor for a moment (not during the elevator ride), or when new lights load in.
 */
function LightBudget() {
  const { scene } = useThree();
  useEffect(() => {
    const key = { floor: NaN, count: -1 };
    let steadyY = walker.y;
    let steadyFor = 0;
    const tmp = new THREE.Vector3();
    const id = window.setInterval(() => {
      if (walker.y < -50) return;
      if (Math.abs(walker.y - steadyY) > 0.05) {
        steadyY = walker.y;
        steadyFor = 0;
        return;
      }
      steadyFor += 0.5;
      const lights: THREE.Light[] = [];
      scene.traverse((o) => {
        const l = o as THREE.PointLight | THREE.SpotLight;
        if ((l as THREE.PointLight).isPointLight || (l as THREE.SpotLight).isSpotLight) lights.push(l);
      });
      const floor = Math.round(walker.y * 2) / 2;
      if (steadyFor < 1 && lights.length === key.count) return;
      if (floor === key.floor && lights.length === key.count) return;
      key.floor = floor;
      key.count = lights.length;
      const ranked = lights
        .map((l) => {
          l.getWorldPosition(tmp);
          const dy = tmp.y - walker.y;
          const sameFloor = dy > -1.5 && dy < 5;
          return { l, sameFloor, d: Math.hypot(tmp.x - walker.x, tmp.z - walker.z) };
        })
        .sort((a, b) => Number(b.sameFloor) - Number(a.sameFloor) || a.d - b.d);
      ranked.forEach((r, i) => {
        r.l.visible = r.sameFloor && i < MAX_LIGHTS;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [scene]);
  return null;
}

/** The ?debug=1 readout. Lives outside the canvas. */
export function PerfOverlay() {
  const [on] = useState(debugOn);
  const stats = usePerf((s) => s.stats);
  const level = usePerf((s) => s.level);
  const idle = usePerf((s) => s.idle);
  if (!on) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-50 rounded-lg bg-black/75 px-3 py-2 font-mono text-[11px] leading-[1.5] text-[#9fe3c0]">
      {stats ? (
        <>
          <div>
            {stats.fps} fps · {stats.ms} ms {idle ? "(reading: capped 30)" : "(capped 60)"}
          </div>
          <div>
            {stats.calls} draw calls · {Math.round(stats.tris / 1000)}k tris
          </div>
          <div>
            {stats.lights} lights · res ×{stats.dpr} · quality {LEVELS.length - level}/{LEVELS.length}
          </div>
          <div>
            {stats.textures} textures · {stats.geometries} meshes
          </div>
          <div className="max-w-[260px] truncate opacity-70">{stats.gpu}</div>
        </>
      ) : (
        "measuring…"
      )}
    </div>
  );
}
