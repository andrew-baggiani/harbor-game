import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState } from "react";
import * as THREE from "three";
import type { CastSlot } from "@/content/week/types";
import { CastActor } from "@/game/cast";
import { Figure } from "@/game/draw";
import { NightStage } from "@/game/weekplay/HarborStage";

export function CastLabView() {
  const slot = ((typeof window !== "undefined" && new URLSearchParams(window.location.search).get("slot")) || "night-desk") as CastSlot;
  const [talking, setTalking] = useState(false);
  return (
    <div className="relative h-dvh w-full bg-[#1a1d22]">
      <Canvas camera={{ fov: 30, position: [0.6, 1.55, 2.6] }} onCreated={({ gl }) => gl.setClearColor("#2a2e35")}>
        <NightStage warm>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 3]} intensity={1.6} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.5, 48]} />
            <meshStandardMaterial color="#3a3f47" side={THREE.DoubleSide} />
          </mesh>
          <CastActor slot={slot} talking={talking} fallback={<Figure />} />
        </NightStage>
        <OrbitControls target={[0, 1.2, 0]} />
      </Canvas>
      <button type="button" onClick={() => setTalking((v) => !v)} className="absolute bottom-6 left-6 rounded-full bg-[#c4a574] px-4 py-2 font-game text-sm text-[#14110c]">
        {talking ? "STOP TALKING" : "TALK"}
      </button>
    </div>
  );
}
