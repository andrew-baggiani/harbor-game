import { useQuality } from "@/game/perf";
import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BrightnessContrast, Bloom, EffectComposer, HueSaturation, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import type { Prop } from "@/content/week/types";
import { Sky } from "@/game/draw";
import { applyScreenImage } from "@/game/focus";
import { HarborWorld } from "@/game/scenery";
import { propTexture } from "@/game/weekplay/Scene";

/**
 * Monday's Harbor Tower, exactly as Monday renders it: the modeled and baked lobby, floor 14 and
 * the harbor outside the glass, with Monday's lights and post stack. Tuesday onward reuse it.
 */
export function HarborStage() {
  return (
    <NightStage fog>
      <Suspense fallback={null}>
        <HarborWorld />
      </Suspense>
    </NightStage>
  );
}

/** Monday's look: night sky and env map, its light rig, bloom, ACES, vignette. Wraps any world. */
export function NightStage({ children, fog = false, warm = false }: { children: React.ReactNode; fog?: boolean; warm?: boolean }) {
  const gl = useThree((s) => s.gl);
  const q = useQuality();
  useEffect(() => {
    // The effect chain does the tone mapping; without it (low quality) the renderer does.
    const prev = gl.toneMapping;
    gl.toneMapping = q.effects ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    return () => {
      gl.toneMapping = prev;
    };
  }, [gl, q.effects]);
  return (
    <>
      {fog && <fog attach="fog" args={["#121820", 16, 92]} />}
      {warm && <pointLight position={[0, 2.4, 0]} intensity={6} distance={12} decay={1.6} color="#ffd6a8" />}
      <hemisphereLight args={["#8aa0b8", "#1a1814", 0.15]} />
      <directionalLight position={[40, 80, -30]} intensity={0.32} color="#d5e2f4" />
      <directionalLight position={[-30, 18, -20]} intensity={0.08} color="#ffc49a" />
      <directionalLight position={[6, 10, 34]} intensity={0.42} color="#b7c9dc" />
      <Sky />
      {children}
      {q.effects && (
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom intensity={0.22} luminanceThreshold={0.78} luminanceSmoothing={0.2} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <BrightnessContrast brightness={0.01} contrast={0.05} />
        <HueSaturation saturation={0} />
        <Vignette offset={0.28} darkness={0.28} />
        <SMAA />
      </EffectComposer>
      )}
    </>
  );
}

const IDLE: Prop = { kind: "screen", text: "Harbor & Co. · Floor 14 · Signed in · No new tasks" };

/** Puts a beat's screen art on a real monitor mesh in the tower, once the model has loaded. */
export function MonitorArt({ name, prop, flipped, idle, idleText }: { name: string; prop: Prop | null; flipped: boolean; idle?: string; idleText?: string }) {
  const scene = useThree((s) => s.scene);
  const applied = useRef("");
  useFrame(() => {
    const p = prop ?? (idleText ? { kind: "screen" as const, text: idleText } : idle ? { kind: "screen" as const, a: idle } : IDLE);
    const file = flipped ? (p.b ?? p.a) : p.a;
    const key = `${name}|${file ?? ""}|${flipped ? p.textB ?? p.text : p.text}`;
    if (applied.current === key) return;
    const mesh = scene.getObjectByName(name);
    if (!mesh) return;
    let url: string | null = file ? `/assets/textures/${file}` : null;
    if (!url) {
      const tex = propTexture(p, flipped);
      const canvas = tex?.image as HTMLCanvasElement | undefined;
      url = canvas?.toDataURL?.() ?? null;
    }
    if (!url) return;
    applyScreenImage(mesh, url);
    applied.current = key;
  });
  return null;
}
