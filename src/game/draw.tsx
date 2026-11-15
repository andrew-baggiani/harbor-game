import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import * as THREE from "three";
import { BLOCKS, DOOR, OFFICE_Y, SKYLINE, TOWER, type Block } from "@/game/layout";
import { markerNow, step, trafficCars } from "@/game/sim";
import { facadeMaterial, sidewalkMaterial } from "@/game/shade";
import { useHarbor, world, fleet } from "@/game/state";
import { HarborDetail } from "@/game/detail";
import { Human } from "@/game/human";

function BlockMesh({ x, z, w, d, h, seed }: Block) {
  const street = z > 0 && z < 22;
  const n = Math.abs(seed);
  const podium = 2.4 + (n % 4) * 0.38;
  const shaft = Math.max(2, h - podium);
  const setback = h > 38;
  const skew = ((n % 5) - 2) * 0.55;
  const mats = facadeMaterial();
  return (
    <group position={[x + w / 2, 0, z + d / 2]}>
      {street ? (
        <>
          <mesh position={[skew, podium + shaft / 2, ((n % 3) - 1) * 0.35]} receiveShadow material={mats}>
            <boxGeometry args={[w * (setback ? 0.74 : 0.9), shaft, d * (setback ? 0.76 : 0.9)]} />
          </mesh>
          {n % 4 === 1 ? (
            <mesh position={[w * 0.28, h * 0.34, d * 0.22]} material={mats}>
              <cylinderGeometry args={[1.05, 1.25, h * 0.68, 8]} />
            </mesh>
          ) : null}
          <mesh position={[skew * 0.3, podium, 0]}>
            <boxGeometry args={[w + 0.18, 0.22, d + 0.18]} />
            <meshStandardMaterial color="#1c2128" metalness={0.55} roughness={0.32} />
          </mesh>
          <mesh position={[-w / 2 + 0.22, podium / 2, 0.05]}>
            <boxGeometry args={[0.42, podium, d - 0.15]} />
            <meshStandardMaterial color="#161a20" metalness={0.35} roughness={0.55} />
          </mesh>
          <mesh position={[w / 2 - 0.22, podium / 2, 0.05]}>
            <boxGeometry args={[0.42, podium, d - 0.15]} />
            <meshStandardMaterial color="#161a20" metalness={0.35} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[w + 0.08, 0.44, d + 0.08]} />
            <meshStandardMaterial color="#2a2724" roughness={0.78} metalness={0.08} />
          </mesh>
          {Array.from({ length: 5 }, (_, index) => {
            const t = (index - 2) / 2;
            return (
              <mesh key={index} position={[t * (w * 0.36), podium + shaft / 2, -d / 2 - 0.04]}>
                <boxGeometry args={[0.08, shaft * 0.96, 0.12]} />
                <meshStandardMaterial color="#0e1218" metalness={0.7} roughness={0.25} />
              </mesh>
            );
          })}
        </>
      ) : setback ? (
        <>
          <mesh position={[0, 8, 0]} receiveShadow material={mats}>
            <boxGeometry args={[w, 16, d]} />
          </mesh>
          <mesh position={[0, 16 + (h - 16) / 2, 0]} receiveShadow material={mats}>
            <boxGeometry args={[w * 0.7, h - 16, d * 0.7]} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, h / 2, 0]} receiveShadow material={mats}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      )}
      <mesh position={[0, h + 0.2, 0]}>
        <boxGeometry args={[w * (setback ? 0.86 : 1) + 0.35, 0.34, d * (setback ? 0.86 : 1) + 0.35]} />
        <meshStandardMaterial color="#12161c" metalness={0.62} roughness={0.28} />
      </mesh>
      {h > 36 ? (
        <group position={[w * 0.22, h + 2.6, d * 0.1]}>
          <mesh>
            <cylinderGeometry args={[0.035, 0.05, 5.2, 6]} />
            <meshStandardMaterial color="#c5ced8" metalness={0.85} roughness={0.22} />
          </mesh>
          <mesh position={[0, 2.7, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#ff3a2a" toneMapped={false} />
          </mesh>
        </group>
      ) : null}
      {street && seed % 3 === 0 ? <FireEscape w={w} h={Math.min(h, 22)} /> : null}
      {street ? <ShopFront w={w} d={d} seed={seed} /> : null}
      <Belts w={w} d={d} h={h} />
      <RoofKit w={w} d={d} h={h} seed={n} />
    </group>
  );
}

function Belts({ w, d, h }: { w: number; d: number; h: number }) {
  const count = Math.max(2, Math.min(8, Math.floor(h / 9)));
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, 3.2 + ((i + 1) * h) / (count + 1), 0]}>
          <boxGeometry args={[w + 0.28, 0.16, d + 0.28]} />
          <meshStandardMaterial color="#14181e" metalness={0.62} roughness={0.32} />
        </mesh>
      ))}
      {[-w / 2, w / 2].map((x) => (
        <mesh key={x} position={[x, h * 0.45, d / 2 + 0.08]}>
          <boxGeometry args={[0.08, h * 0.82, 0.08]} />
          <meshStandardMaterial color="#2a3138" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function WindowRow({ w, d, h, seed }: { w: number; d: number; h: number; seed: number }) {
  const cols = Math.max(2, Math.min(7, Math.floor(w / 2.1)));
  const rows = Math.max(2, Math.min(10, Math.floor((h - 5) / 3.1)));
  return (
    <group>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const lit = (row * 5 + col * 3 + seed) % 4 !== 0;
          return (
            <mesh key={`${row}-${col}`} position={[(col - (cols - 1) / 2) * (w / (cols + 0.15)), 4.4 + row * ((h - 6) / rows), -d / 2 - 0.08]}>
              <planeGeometry args={[0.62, 0.92]} />
              <meshStandardMaterial
                color={lit ? "#ffe0bf" : "#070b10"}
                emissive={lit ? "#ffb36a" : "#000"}
                emissiveIntensity={lit ? 1.7 : 0}
                toneMapped={false}
              />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

function RoofKit({ w, d, h, seed }: { w: number; d: number; h: number; seed: number }) {
  return (
    <group position={[((seed % 3) - 1) * w * 0.18, h + 0.5, ((seed % 2) - 0.5) * d * 0.2]}>
      <mesh>
        <boxGeometry args={[1.1, 0.55, 0.8]} />
        <meshStandardMaterial color="#8a9098" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 0.15, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.12, 12]} />
        <meshStandardMaterial color="#6a7078" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

function FireEscape({ w, h }: { w: number; h: number }) {
  const floors = Math.max(2, Math.floor((h - 4) / 3.2));
  return (
    <group position={[w / 2 + 0.05, 0, 0]}>
      {Array.from({ length: floors }, (_, i) => (
        <mesh key={i} position={[0.42, 4.2 + i * 3.15, i % 2 === 0 ? 0.7 : -0.7]}>
          <boxGeometry args={[0.85, 0.07, 2.1]} />
          <meshStandardMaterial color="#4a4038" metalness={0.62} roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[0.2, h * 0.55, 0.7]}>
        <boxGeometry args={[0.05, h - 3, 0.05]} />
        <meshStandardMaterial color="#3a342e" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

function ShopFront({ w, d, seed }: { w: number; d: number; seed: number }) {
  const sign = useMemo(() => {
    const names = ["HARBOR COFFEE", "NIGHT BERTH", "GATE HOUSE", "PIER SUPPLY", "NORTH PIER", "BERTH 4"];
    const label = names[Math.abs(seed) % names.length] ?? "HARBOR";
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 180;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.clearRect(0, 0, 1024, 180);
    g.fillStyle = "#f4efe6";
    g.font = "600 92px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 512, 96);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [seed]);
  const front = -d / 2;
  return (
    <group>
      <mesh position={[0, 0.02, front + 1.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.4, 3.2]} />
        <meshStandardMaterial color="#1a1612" roughness={0.55} metalness={0.12} />
      </mesh>
      <mesh position={[0, 1.55, front + 3.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w - 0.5, 2.7]} />
        <meshStandardMaterial color="#2a211c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.05, front + 1.35]}>
        <boxGeometry args={[Math.min(w * 0.46, 3.2), 0.12, 0.7]} />
        <meshStandardMaterial color="#4a3428" roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.5, front + 1.15]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#fff1d2" emissive="#ffc98a" emissiveIntensity={6} toneMapped={false} />
      </mesh>
      {seed % 4 === 1 ? <pointLight position={[0, 2.3, front + 1.2]} color="#ffb27a" intensity={10} distance={8} decay={2} /> : null}
      <mesh position={[0, 1.65, front + 0.05]}>
        <planeGeometry args={[Math.max(2.4, w - 1.2), 2.9]} />
        <meshPhysicalMaterial color="#d5e2f0" transparent opacity={0.12} roughness={0.03} metalness={0.05} envMapIntensity={2.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.12, front - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[Math.min(w - 1.2, 8.2), 0.7]} />
        <meshStandardMaterial map={sign} emissive="#ffe6c4" emissiveMap={sign} emissiveIntensity={3} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Slab({ x, y, z, w, h, d }: { x: number; y: number; z: number; w: number; h: number; d: number; seed: number; face: "x" | "z" }) {
  return (
    <mesh position={[x, y, z]} receiveShadow material={facadeMaterial()}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

function DeskMail() {
  const beat = useHarbor((s) => s.beat);
  const phone = beat === "phone";
  return (
    <group>
      {beat === "desk" ? (
        <mesh position={[-0.28, 0.82, 0.12]} rotation={[-Math.PI / 2, 0, 0.2]} castShadow>
          <boxGeometry args={[0.28, 0.18, 0.012]} />
          <meshStandardMaterial color="#f4efe6" roughness={0.7} />
        </mesh>
      ) : null}
      <mesh position={[0.42, 0.84, 0.16]}>
        <boxGeometry args={[0.16, 0.035, 0.07]} />
        <meshStandardMaterial color={phone ? "#ffb15a" : "#1c2128"} emissive={phone ? "#ff9a3a" : "#000"} emissiveIntensity={phone ? 2.4 : 0} />
      </mesh>
    </group>
  );
}

function TowerDoors() {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const reader = useRef<THREE.MeshStandardMaterial>(null);
  const open = useRef(0);
  useFrame((_, dt) => {
    open.current += (world.doorOpen - open.current) * Math.min(1, dt * 2.6);
    if (left.current) left.current.rotation.y = -open.current * 1.2;
    if (right.current) right.current.rotation.y = open.current * 1.2;
    if (reader.current) {
      const green = world.reader === "green";
      const red = world.reader === "red";
      reader.current.color.set(green ? "#14301c" : "#1a1214");
      reader.current.emissive.set(green ? "#3dff8a" : red ? "#ff2a2a" : "#2a1010");
      reader.current.emissiveIntensity = green || red ? 3.5 : 0.35;
    }
  });
  return (
    <group>
      <group ref={left} position={[24.58, 0, 2.12]}>
        <mesh position={[1.22, 1.45, 0]} castShadow>
          <boxGeometry args={[2.5, 2.75, 0.05]} />
          <meshPhysicalMaterial color="#c5d4de" transparent opacity={0.34} roughness={0.04} metalness={0.08} />
        </mesh>
        <mesh position={[1.15, 2.78, 0]}>
          <boxGeometry args={[2.36, 0.08, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[1.15, 0.12, 0]}>
          <boxGeometry args={[2.36, 0.08, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0.04, 1.45, 0]}>
          <boxGeometry args={[0.08, 2.75, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[2.15, 1.2, 0.05]}>
          <boxGeometry args={[0.04, 0.28, 0.04]} />
          <meshStandardMaterial color="#c5ccd4" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      <group ref={right} position={[29.42, 0, 2.12]}>
        <mesh position={[-1.22, 1.45, 0]} castShadow>
          <boxGeometry args={[2.5, 2.75, 0.05]} />
          <meshPhysicalMaterial color="#c5d4de" transparent opacity={0.34} roughness={0.04} metalness={0.08} />
        </mesh>
        <mesh position={[-1.15, 2.78, 0]}>
          <boxGeometry args={[2.36, 0.08, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[-1.15, 0.12, 0]}>
          <boxGeometry args={[2.36, 0.08, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[-0.04, 1.45, 0]}>
          <boxGeometry args={[0.08, 2.75, 0.08]} />
          <meshStandardMaterial color="#14181e" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[-2.15, 1.2, 0.05]}>
          <boxGeometry args={[0.04, 0.28, 0.04]} />
          <meshStandardMaterial color="#c5ccd4" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      <mesh position={[29.72, 1.25, 1.78]}>
        <boxGeometry args={[0.16, 0.32, 0.08]} />
        <meshStandardMaterial ref={reader} color="#1a1214" emissive="#2a1010" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[29.72, 1.55, 1.76]}>
        <boxGeometry args={[0.2, 0.05, 0.04]} />
        <meshStandardMaterial color="#0e1014" />
      </mesh>
    </group>
  );
}

function HarborTower() {
  const T = TOWER;
  const midX = T.x + T.w / 2;
  const sign = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 220;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.clearRect(0, 0, 1024, 220);
    g.fillStyle = "#f4f0e6";
    g.font = "600 132px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("HARBOR", 512, 116);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const deskSign = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.fillStyle = "#1a120e";
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#f4efe6";
    g.font = "600 64px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("RECEPTION", 256, 68);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  return (
    <group>
      <Slab x={20.2} y={10} z={2.35} w={8.4} h={20} d={0.7} seed={1} face="z" />
      <Slab x={33.8} y={10} z={2.35} w={8.4} h={20} d={0.7} seed={2} face="z" />
      <Slab x={27} y={11.6} z={2.35} w={5.2} h={16.8} d={0.7} seed={3} face="z" />
      <Slab x={midX} y={12.5} z={19.65} w={T.w} h={25} d={0.7} seed={4} face="z" />
      <Slab x={16.35} y={12.5} z={T.z + T.d / 2} w={0.7} h={25} d={T.d} seed={5} face="x" />
      <Slab x={37.65} y={12.5} z={T.z + T.d / 2} w={0.7} h={25} d={T.d} seed={6} face="x" />
      <mesh position={[midX, 55.5, T.z + T.d / 2]} material={facadeMaterial()}>
        <boxGeometry args={[T.w, 61, T.d]} />
      </mesh>
      <mesh position={[midX, 32.2, 1.55]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 2.3]} />
        <meshStandardMaterial map={sign} emissive="#fff6ea" emissiveMap={sign} emissiveIntensity={4.2} transparent toneMapped={false} />
      </mesh>
      <mesh position={[DOOR.x, 5.6, 1.42]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[8.2, 1.15]} />
        <meshBasicMaterial color="#ffe7c2" toneMapped={false} />
      </mesh>
      <mesh position={[DOOR.x, 5.6, 1.48]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[7.6, 0.72]} />
        <meshBasicMaterial map={sign} transparent toneMapped={false} />
      </mesh>
      <mesh position={[DOOR.x, 2.1, 1.7]}>
        <planeGeometry args={[3.4, 3.2]} />
        <meshBasicMaterial color="#ffc48a" transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight position={[DOOR.x, 4.2, 0.2]} color="#ffc48a" intensity={18} distance={16} decay={2} />
      <TowerDoors />
      <mesh position={[midX, 87.2, T.z + T.d / 2]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial color="#ffb15a" toneMapped={false} />
      </mesh>
      <pointLight position={[midX, 88, T.z + 4]} color="#ffb15a" intensity={8} distance={40} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.02, 11]} receiveShadow>
        <planeGeometry args={[T.w - 1.5, T.d - 1.6]} />
        <meshStandardMaterial color="#3a342c" roughness={0.35} metalness={0.32} envMapIntensity={1.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, OFFICE_Y, 11]} receiveShadow>
        <planeGeometry args={[T.w - 1.6, T.d - 1.8]} />
        <meshStandardMaterial color="#24302c" roughness={0.86} />
      </mesh>
      <Desk x={22.6} y={OFFICE_Y} z={7.8} hot />
      <Desk x={22.6} y={OFFICE_Y} z={12.4} />
      <Desk x={28.2} y={OFFICE_Y} z={7.8} />
      <BreakCounter />
      <mesh position={[22.4, 0.62, 9.4]}>
        <boxGeometry args={[3.4, 1.15, 1.15]} />
        <meshStandardMaterial color="#4a3428" roughness={0.5} />
      </mesh>
      <mesh position={[22.4, 1.28, 8.8]}>
        <boxGeometry args={[2.2, 0.08, 0.5]} />
        <meshStandardMaterial color="#1a120e" roughness={0.4} />
      </mesh>
      <mesh position={[22.4, 1.48, 8.78]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.7, 0.42]} />
        <meshBasicMaterial map={deskSign} toneMapped={false} />
      </mesh>
      <Elevator y={0} />
      <Elevator y={OFFICE_Y} />
      <pointLight position={[27, 2.6, 8]} color="#ffc49a" intensity={6} distance={10} decay={2} />
      <pointLight position={[22, 2.4, 12]} color="#d5e4ff" intensity={4} distance={8} decay={2} />
      {[18.5, 23.5, 28.5, 33.5].map((x) => (
        <mesh key={`ceil${x}`} position={[x, 3.55, 10]}>
          <boxGeometry args={[0.7, 0.06, 0.18]} />
          <meshStandardMaterial color="#fff1d4" emissive="#ffd7a4" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[24, OFFICE_Y + 3.1, 8]} color="#d5e4ff" intensity={12} distance={12} decay={2} />
    </group>
  );
}

function Elevator({ y }: { y: number }) {
  return (
    <group position={[27, y, 17.2]}>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[1.8, 2.8, 0.12]} />
        <meshStandardMaterial color="#14181e" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.55, 1.15, 0.08]}>
        <boxGeometry args={[0.08, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffb15a" emissive="#ffb15a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Desk({ x, y, z, hot = false }: { x: number; y: number; z: number; hot?: boolean }) {
  const legs: [number, number][] = [
    [-0.68, -0.32],
    [0.68, -0.32],
    [-0.68, 0.32],
    [0.68, 0.32],
  ];
  return (
    <group position={[x, y, z]}>
      {legs.map(([lx, lz]) => (
        <mesh key={`${lx}-${lz}`} position={[lx, 0.37, lz]}>
          <boxGeometry args={[0.06, 0.74, 0.06]} />
          <meshStandardMaterial color="#2a241e" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.76, 0]} castShadow>
        <boxGeometry args={[1.55, 0.06, 0.8]} />
        <meshStandardMaterial color="#5a4332" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.88, -0.22]}>
        <boxGeometry args={[0.12, 0.18, 0.1]} />
        <meshStandardMaterial color="#1a1e24" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.12, -0.22]}>
        <boxGeometry args={[0.62, 0.36, 0.04]} />
        <meshStandardMaterial color={hot ? "#d5e6ff" : "#121820"} emissive={hot ? "#9ec4ff" : "#132033"} emissiveIntensity={hot ? 1.6 : 0.25} toneMapped={false} />
      </mesh>
      {hot ? <DeskMail /> : null}
      <mesh position={[0.62, 0.46, 0.42]}>
        <cylinderGeometry args={[0.04, 0.05, 0.46, 8]} />
        <meshStandardMaterial color="#2c3036" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.62, 0.7, 0.42]}>
        <boxGeometry args={[0.42, 0.06, 0.42]} />
        <meshStandardMaterial color="#243028" roughness={0.7} />
      </mesh>
      <mesh position={[0.62, 0.98, 0.22]}>
        <boxGeometry args={[0.42, 0.5, 0.06]} />
        <meshStandardMaterial color="#243028" roughness={0.7} />
      </mesh>
    </group>
  );
}

function BreakCounter() {
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const bad = useHarbor.getState().laptopBad;
    if (!screen.current) return;
    screen.current.emissive.set(bad ? "#ff3818" : "#8eb6e8");
    screen.current.emissiveIntensity = bad ? 5 : 1.3;
  });
  return (
    <group position={[32.5, OFFICE_Y, 10.2]}>
      {[-0.95, 0.95].map((lx) =>
        [-0.32, 0.32].map((lz) => (
          <mesh key={`${lx}-${lz}`} position={[lx, 0.45, lz]}>
            <boxGeometry args={[0.07, 0.9, 0.07]} />
            <meshStandardMaterial color="#2a3038" metalness={0.45} roughness={0.4} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[2.2, 0.08, 0.8]} />
        <meshStandardMaterial color="#3a4048" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[-0.35, 0.98, 0.05]}>
        <boxGeometry args={[0.42, 0.02, 0.28]} />
        <meshStandardMaterial color="#1c2128" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[-0.35, 1.08, -0.08]} rotation={[-0.55, 0, 0]}>
        <boxGeometry args={[0.4, 0.24, 0.02]} />
        <meshStandardMaterial ref={screen} color="#0c1016" emissive="#8eb6e8" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      <mesh position={[0.55, 0.99, 0.08]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.035, 0.08]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0.66, 0.99, 0.08]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.05, 0.02, 0.07]} />
        <meshStandardMaterial color="#c5ccd4" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Lamp({ x, z, live }: { x: number; z: number; live?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 6.8, 8]} />
        <meshStandardMaterial color="#2a3038" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0.7, 6.7, 0]}>
        <boxGeometry args={[1.5, 0.07, 0.22]} />
        <meshStandardMaterial color="#1a1e26" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.15, 6.58, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.2]} />
        <meshStandardMaterial color="#ffe1c2" emissive="#ffb36b" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      {live ? <pointLight position={[1.1, 6.1, 0]} color="#ffb56a" intensity={8} distance={14} decay={2} /> : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.3, 0.045, 0]}>
        <circleGeometry args={[3.4, 24]} />
        <meshBasicMaterial color="#ffb36a" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function Figure({
  color = "#2c3544",
  accent = "#c4a574",
  hero = false,
  walk = false,
}: {
  color?: string;
  accent?: string;
  hero?: boolean;
  walk?: boolean;
}) {
  const hips = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * 6);
  useFrame((_, dt) => {
    let s = 0;
    if (hero) s = world.moving && !world.driving ? Math.sin(world.walk) * 0.55 : 0;
    else if (walk) {
      phase.current += dt * 2.6;
      s = Math.sin(phase.current) * 0.45;
    }
    if (left.current) left.current.rotation.x = s;
    if (right.current) right.current.rotation.x = -s;
    if (armL.current) armL.current.rotation.x = -s * 0.65;
    if (armR.current) armR.current.rotation.x = s * 0.65;
    if (hips.current) hips.current.position.y = Math.abs(s) * 0.04;
  });
  return (
    <group ref={hips}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} />
      </mesh>
      <group ref={left} position={[-0.09, 0.86, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.5, 0.01]} castShadow>
          <capsuleGeometry args={[0.048, 0.26, 4, 8]} />
          <meshStandardMaterial color="#12141a" roughness={0.7} />
        </mesh>
      </group>
      <group ref={right} position={[0.09, 0.86, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.5, 0.01]} castShadow>
          <capsuleGeometry args={[0.048, 0.26, 4, 8]} />
          <meshStandardMaterial color="#12141a" roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[-0.09, 0.045, 0.04]} castShadow>
        <boxGeometry args={[0.09, 0.06, 0.2]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.28} metalness={0.55} />
      </mesh>
      <mesh position={[0.09, 0.045, 0.04]} castShadow>
        <boxGeometry args={[0.09, 0.06, 0.2]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.28} metalness={0.55} />
      </mesh>
      <RoundedBox args={[0.46, 0.36, 0.22]} radius={0.04} position={[0, 0.96, 0]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.62} metalness={0.04} sheen={0.45} sheenColor="#9aa4b4" sheenRoughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.4, 0.2]} radius={0.06} position={[0, 1.28, 0]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.55} metalness={0.06} sheen={0.5} sheenColor="#c5ceda" sheenRoughness={0.4} />
      </RoundedBox>
      <mesh position={[-0.07, 1.34, 0.1]} rotation={[0.15, 0.4, 0.2]}>
        <boxGeometry args={[0.07, 0.16, 0.02]} />
        <meshStandardMaterial color="#e7e1d6" roughness={0.55} />
      </mesh>
      <mesh position={[0.07, 1.34, 0.1]} rotation={[0.15, -0.4, -0.2]}>
        <boxGeometry args={[0.07, 0.16, 0.02]} />
        <meshStandardMaterial color="#e7e1d6" roughness={0.55} />
      </mesh>
      <mesh position={[0.1, 1.22, 0.1]}>
        <boxGeometry args={[0.045, 0.045, 0.012]} />
        <meshStandardMaterial color={accent} roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.08, 10]} />
        <meshStandardMaterial color="#d2aa90" roughness={0.5} />
      </mesh>
      <group ref={armL} position={[-0.24, 1.42, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.042, 0.18, 3, 6]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.18, 3, 6]} />
          <meshStandardMaterial color={color} roughness={0.58} />
        </mesh>
        <mesh position={[0, -0.5, 0.02]}>
          <sphereGeometry args={[0.038, 10, 8]} />
          <meshStandardMaterial color="#d2aa90" roughness={0.5} />
        </mesh>
      </group>
      <group ref={armR} position={[0.24, 1.42, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.042, 0.18, 3, 6]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <capsuleGeometry args={[0.036, 0.18, 3, 6]} />
          <meshStandardMaterial color={color} roughness={0.58} />
        </mesh>
        <mesh position={[0, -0.5, 0.02]}>
          <sphereGeometry args={[0.038, 10, 8]} />
          <meshStandardMaterial color="#d2aa90" roughness={0.5} />
        </mesh>
      </group>
      <mesh position={[0, 1.64, 0.01]} scale={[0.92, 1.08, 0.9]} castShadow>
        <sphereGeometry args={[0.105, 20, 16]} />
        <meshStandardMaterial color="#e0b394" roughness={0.48} />
      </mesh>
      <mesh position={[0, 1.73, -0.012]} scale={[1.05, 0.55, 1.02]}>
        <sphereGeometry args={[0.112, 16, 12]} />
        <meshStandardMaterial color="#16110e" roughness={0.62} />
      </mesh>
      <mesh position={[-0.1, 1.64, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#e0b394" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.64, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#e0b394" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Wheel({ spinRef }: { spinRef?: Ref<THREE.Group> }) {
  return (
    <group ref={spinRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.16, 16]} />
        <meshStandardMaterial color="#141414" roughness={0.95} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.3, 0.055, 8, 18]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.92} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.18, 12]} />
        <meshStandardMaterial color="#2c333c" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.07, 10]} />
        <meshStandardMaterial color="#c5ccd4" metalness={0.85} roughness={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.07, 10]} />
        <meshStandardMaterial color="#c5ccd4" metalness={0.85} roughness={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AutoPaint({ color }: { color: string }) {
  return (
    <meshPhysicalMaterial color={color} metalness={0.78} roughness={0.24} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.5} />
  );
}

function Glass() {
  return <meshPhysicalMaterial color="#14202a" roughness={0.12} metalness={0.2} transparent opacity={0.72} envMapIntensity={0.8} />;
}

function profileGeo(van: boolean) {
  const shape = new THREE.Shape();
  if (van) {
    shape.moveTo(-2.15, 0.32);
    shape.lineTo(2.15, 0.32);
    shape.lineTo(2.2, 0.7);
    shape.lineTo(1.55, 0.92);
    shape.lineTo(1.35, 1.7);
    shape.lineTo(0.55, 1.78);
    shape.lineTo(0.35, 1.72);
    shape.lineTo(-2.05, 1.72);
    shape.lineTo(-2.15, 0.7);
  } else {
    shape.moveTo(-2.05, 0.3);
    shape.lineTo(2.1, 0.3);
    shape.lineTo(2.14, 0.52);
    shape.lineTo(1.72, 0.8);
    shape.lineTo(0.95, 0.88);
    shape.lineTo(0.58, 1.22);
    shape.lineTo(0.05, 1.4);
    shape.lineTo(-0.95, 1.38);
    shape.lineTo(-1.32, 1.02);
    shape.lineTo(-1.72, 0.84);
    shape.lineTo(-2.08, 0.55);
  }
  shape.closePath();
  const cut = (x: number) => {
    const hole = new THREE.Path();
    hole.absarc(x, 0.64, 0.26, 0, Math.PI * 2, true);
    return hole;
  };
  shape.holes.push(cut(van ? 1.35 : 1.28), cut(van ? -1.25 : -1.3));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: van ? 1.78 : 1.66,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geo.translate(0, 0, van ? -0.89 : -0.83);
  geo.computeVertexNormals();
  return geo;
}

function glassGeo(van: boolean) {
  const shape = new THREE.Shape();
  if (van) {
    shape.moveTo(1.42, 1.05);
    shape.lineTo(1.22, 1.58);
    shape.lineTo(0.55, 1.62);
    shape.lineTo(0.48, 1.05);
  } else {
    shape.moveTo(0.5, 0.96);
    shape.lineTo(0.12, 1.3);
    shape.lineTo(-0.95, 1.28);
    shape.lineTo(-1.2, 0.98);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: van ? 1.62 : 1.48, bevelEnabled: false, curveSegments: 6 });
  geo.translate(0, 0, van ? -0.81 : -0.74);
  return geo;
}

function CarBody({ color, live, kind = "sedan" }: { color: string; live?: boolean; kind?: "sedan" | "van" }) {
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const fronts = useRef<(THREE.Group | null)[]>([]);
  const brake = useRef<THREE.MeshStandardMaterial>(null);
  const van = kind === "van";
  const body = useMemo(() => profileGeo(van), [van]);
  const glass = useMemo(() => glassGeo(van), [van]);
  useFrame((_, dt) => {
    const spin = world.driving && live ? world.carSpeed * dt * 2.2 : 0;
    for (const wheel of wheels.current) if (wheel) wheel.rotation.z -= spin;
    fronts.current.forEach((pivot) => {
      if (pivot && live) pivot.rotation.y = world.wheelSteer;
    });
    if (brake.current && live) brake.current.emissiveIntensity = world.brake ? 3.2 : 0.7;
  });
  const frontX = van ? 1.35 : 1.28;
  const rearX = van ? -1.25 : -1.3;
  const wz = van ? 0.92 : 0.86;
  const nose = van ? 2.16 : 2.1;
  const tail = van ? -2.16 : -2.06;
  const lamp = live ? 2.4 : 0.45;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[van ? 1.55 : 1.25, 18]} />
        <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh geometry={body} castShadow>
        <AutoPaint color={color} />
      </mesh>
      <mesh geometry={glass}>
        <Glass />
      </mesh>
      <mesh position={[nose, van ? 0.58 : 0.55, 0]}>
        <boxGeometry args={[0.06, 0.16, van ? 1.15 : 0.95]} />
        <meshStandardMaterial color="#0c0e12" metalness={0.7} roughness={0.3} />
      </mesh>
      {[0.42, -0.42].map((z) => (
        <mesh key={`h${z}`} position={[nose + 0.02, van ? 0.62 : 0.58, z]}>
          <boxGeometry args={[0.04, 0.1, 0.28]} />
          <meshStandardMaterial color="#fff4dc" emissive="#fff1d0" emissiveIntensity={lamp} toneMapped={false} />
        </mesh>
      ))}
      {[0.48, -0.48].map((z) => (
        <mesh key={`t${z}`} position={[tail, van ? 0.85 : 0.62, z]}>
          <boxGeometry args={[0.04, van ? 0.18 : 0.09, 0.32]} />
          <meshStandardMaterial ref={z > 0 ? brake : undefined} color="#ff2a1c" emissive="#ff1a10" emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[tail - 0.02, 0.42, 0]}>
        <boxGeometry args={[0.02, 0.1, 0.26]} />
        <meshStandardMaterial color="#efe6d4" />
      </mesh>
      <group ref={(node) => { fronts.current[0] = node; }} position={[frontX, 0.4, wz]}>
        <Wheel spinRef={(node) => { wheels.current[0] = node; }} />
      </group>
      <group ref={(node) => { fronts.current[1] = node; }} position={[frontX, 0.4, -wz]}>
        <Wheel spinRef={(node) => { wheels.current[1] = node; }} />
      </group>
      <group position={[rearX, 0.4, wz]}><Wheel spinRef={(node) => { wheels.current[2] = node; }} /></group>
      <group position={[rearX, 0.4, -wz]}><Wheel spinRef={(node) => { wheels.current[3] = node; }} /></group>
    </group>
  );
}

export function Vehicles() {
  const parked = useRef<(THREE.Group | null)[]>([]);
  const traffic = useRef<(THREE.Group | null)[]>([]);
  const beacon = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    fleet.forEach((car, index) => {
      const mesh = parked.current[index];
      if (!mesh) return;
      const live = index === 0 && world.driving;
      mesh.rotation.order = "YXZ";
      mesh.position.set(live ? world.carX : car.x, 0, live ? world.carZ : car.z);
      mesh.rotation.y = -(live ? world.carYaw : car.yaw);
      mesh.rotation.z = live ? world.carRoll : 0;
    });
    trafficCars().forEach((car, index) => {
      const mesh = traffic.current[index];
      if (!mesh) return;
      mesh.position.set(car.x, 0, car.z);
      mesh.rotation.y = car.dir > 0 ? 0 : Math.PI;
    });
    if (beacon.current) {
      beacon.current.visible = !world.driving;
      beacon.current.position.set(fleet[0].x, 0.07, fleet[0].z);
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.06;
      beacon.current.scale.set(s, s, 1);
    }
  });
  return (
    <group>
      <mesh ref={beacon} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 2.28, 40]} />
        <meshBasicMaterial color="#e7c48a" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {fleet.map((car, index) => (
        <group key={`p${index}`} ref={(node) => { parked.current[index] = node; }}>
          <CarBody color={car.color} kind={car.kind} live={index === 0} />
        </group>
      ))}
      {trafficCars().map((car, index) => (
        <group key={`t${index}`} ref={(node) => { traffic.current[index] = node; }}>
          <CarBody color={index % 2 === 0 ? "#2a3038" : "#3a241c"} kind={car.dir > 0 ? "sedan" : "van"} />
        </group>
      ))}
    </group>
  );
}

function CourierBadge() {
  const card = useRef<THREE.Group>(null);
  const shown = useRef(0);
  useFrame((_, dt) => {
    const target = world.badgeOut > 0 && world.guyVisible ? 1 : 0;
    shown.current += (target - shown.current) * Math.min(1, dt * 4);
    if (!card.current) return;
    card.current.visible = shown.current > 0.04;
    card.current.position.set(0.16, 1.15, 0.22 + shown.current * 0.38);
    card.current.rotation.x = -0.4 * shown.current;
  });
  return (
    <group ref={card} visible={false}>
      <mesh>
        <boxGeometry args={[0.11, 0.16, 0.012]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.07, 0.09, 0.004]} />
        <meshStandardMaterial color="#c4a574" emissive="#c4a574" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

export function People() {
  const player = useRef<THREE.Group>(null);
  const guy = useRef<THREE.Group>(null);
  const bodyYaw = useRef(Math.PI / 2);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    if (player.current) {
      player.current.visible = !world.driving;
      player.current.position.set(world.px, world.py, world.pz);
      const target = Math.PI / 2 - world.face;
      let delta = target - bodyYaw.current;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      bodyYaw.current += delta * (1 - Math.exp(-5.2 * dt));
      player.current.rotation.y = bodyYaw.current;
    }
    if (guy.current) {
      guy.current.visible = world.guyVisible;
      guy.current.position.set(world.guyX, 0, world.guyZ);
      guy.current.rotation.y = 0;
    }
  });
  return (
    <group>
      <group ref={player}>
        <Human gait="hero" tint="#1e3a6e" hair="#8a5a32" scale={1} phase={0.2} />
        <pointLight position={[0, 1.55, 0.48]} color="#ffd2b0" intensity={2.2} distance={2.2} decay={2} />
      </group>
      <group ref={guy}>
        <Human gait="idle" tint="#8d3d28" hair="#1a120e" scale={1.12} phase={1.4} />
        <CourierBadge />
      </group>
      <group position={[-4.4, 0, -6.35]}><Human gait="idle" tint="#2f6a4a" hair="#e0c07a" scale={0.92} phase={0.8} /></group>
      <group position={[3.35, OFFICE_Y, -14.55]} rotation={[0, Math.PI, 0]}><Human gait="idle" tint="#6e2438" hair="#2a160e" scale={0.86} phase={2.2} /></group>
      <Walker origin={-40} span={16} z={2.6} speed={1.05} tint="#4e6a38" hair="#14110e" phase={0.3} scale={1.08} />
      <Walker origin={-6} span={8} z={3.1} speed={0.7} tint="#8a6230" hair="#d9d4cc" phase={1.7} scale={0.9} />
      <Walker origin={28} span={14} z={2.4} speed={0.9} tint="#2a4a55" hair="#6a3a22" phase={2.6} scale={1.05} />
    </group>
  );
}

function Walker({ origin, span, z, speed, tint, hair, phase, scale }: { origin: number; span: number; z: number; speed: number; tint: string; hair: string; phase: number; scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * speed) % (span * 2);
    const along = t < span ? t : span * 2 - t;
    ref.current.position.set(origin + along, 0, z);
    ref.current.rotation.y = t < span ? Math.PI / 2 : -Math.PI / 2;
  });
  return <group ref={ref}><Human gait="walk" speed={speed} tint={tint} hair={hair} phase={phase} scale={scale} /></group>;
}

export function Marker() {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const spot = markerNow();
    const g = group.current;
    if (!g) return;
    if (!spot) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(spot.x, spot.y, spot.z);
    if (glow.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
      glow.current.scale.set(s, 1, s);
    }
  });
  return (
    <group ref={group}>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.08, 0.015, 12, 8, 1, true]} />
        <meshBasicMaterial color="#e7c48a" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.55, 0.72, 40]} />
        <meshBasicMaterial color="#e7c48a" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const trailDummy = new THREE.Object3D();

export function Trail() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 22;
  useFrame(() => {
    const mark = mesh.current;
    const spot = markerNow();
    if (!mark) return;
    if (!spot || world.driving) {
      mark.visible = false;
      return;
    }
    mark.visible = true;
    const dx = spot.x - world.px;
    const dz = spot.z - world.pz;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.6) / count;
      const along = t * len;
      if (along < 1.6 || along > len - 1.2) {
        trailDummy.position.set(0, -20, 0);
        trailDummy.scale.set(0.001, 0.001, 0.001);
      } else {
        trailDummy.position.set(world.px + dx * t, (world.py > 2 ? world.py : 0) + 0.05, world.pz + dz * t);
        trailDummy.rotation.set(-Math.PI / 2, 0, -yaw);
        trailDummy.scale.set(1, 1, 1);
      }
      trailDummy.updateMatrix();
      mark.setMatrixAt(i, trailDummy.matrix);
    }
    mark.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.22, 0.7]} />
      <meshBasicMaterial color="#e7c48a" transparent opacity={0.8} depthWrite={false} />
    </instancedMesh>
  );
}

export function Sky() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const baked = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    const sky = g.createLinearGradient(0, 0, 0, 1024);
    sky.addColorStop(0, "#04060e");
    sky.addColorStop(0.28, "#0c1833");
    sky.addColorStop(0.58, "#1a2a4a");
    sky.addColorStop(0.78, "#3a2a22");
    sky.addColorStop(0.9, "#140e0c");
    sky.addColorStop(1, "#07080c");
    g.fillStyle = sky;
    g.fillRect(0, 0, 2048, 1024);
    const halo = g.createRadialGradient(1480, 150, 8, 1480, 150, 220);
    halo.addColorStop(0, "rgba(255,244,220,0.95)");
    halo.addColorStop(0.08, "rgba(255,236,200,0.35)");
    halo.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = halo;
    g.beginPath();
    g.arc(1480, 150, 220, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff8ea";
    g.beginPath();
    g.arc(1480, 150, 16, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 520; i += 1) {
      const y = Math.random() * 620;
      const a = y > 480 ? 0.15 : 0.35 + Math.random() * 0.65;
      g.fillStyle = `rgba(255,255,255,${a})`;
      const s = Math.random() > 0.97 ? 2.2 : 1.2;
      g.fillRect(Math.random() * 2048, y, s, s);
    }
    const haze = g.createLinearGradient(0, 640, 0, 900);
    haze.addColorStop(0, "rgba(0,0,0,0)");
    haze.addColorStop(0.45, "rgba(196, 92, 42, 0.28)");
    haze.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = haze;
    g.fillRect(0, 640, 2048, 260);
    g.fillStyle = "rgba(255, 186, 110, 0.7)";
    for (let i = 0; i < 140; i += 1) {
      g.fillRect(Math.random() * 2048, 690 + Math.random() * 90, 2 + Math.random() * 10, 2 + Math.random() * 5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }, []);
  useEffect(() => {
    const previous = scene.background;
    scene.background = baked;
    let alive = true;
    const loader = new HDRLoader();
    loader.load("/env.hdr", (hdr) => {
      if (!alive) return;
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(gl);
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 0.42;
      pmrem.dispose();
      hdr.dispose();
    });
    return () => {
      alive = false;
      scene.background = previous;
      scene.environment = null;
    };
  }, [scene, baked, gl]);
  return null;
}

function WetRoad() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec3 vW; uniform float uTime;
      float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float rip = sin(vW.x * 1.6 + uTime) * sin(vW.z * 2.1 - uTime * 0.6);
        vec3 n = normalize(vec3(rip * 0.04, 1.0, rip * 0.03));
        vec3 viewDir = normalize(cameraPosition - vW);
        vec3 col = vec3(0.028, 0.029, 0.032);
        float grit = hash21(vW.xz * 22.0);
        float grit2 = hash21(floor(vW.xz * 1.7));
        col += (grit - 0.5) * 0.02;
        col += (grit2 - 0.5) * 0.012;
        float wet = smoothstep(0.35, 0.82, hash21(floor(vW.xz * 0.42)));
        col *= mix(1.0, 0.62, wet);
        float edge = smoothstep(0.07, 0.0, abs(abs(vW.z + 11.0) - 5.15));
        col = mix(col, vec3(0.72, 0.7, 0.64), edge);
        float gutter = smoothstep(0.42, 0.0, abs(abs(vW.z + 11.0) - 4.85));
        col *= mix(1.0, 0.55, gutter);
        float dash = step(0.58, fract(vW.x * 0.09));
        float center = smoothstep(0.045, 0.0, abs(vW.z + 11.0));
        col = mix(col, vec3(0.78, 0.64, 0.22), center * dash);
        vec3 lamps[6];
        lamps[0]=vec3(-48.0,6.2,-5.55); lamps[1]=vec3(-32.0,6.2,-5.55); lamps[2]=vec3(-16.0,6.2,-5.55);
        lamps[3]=vec3(4.0,6.2,-5.55); lamps[4]=vec3(27.0,6.2,-5.55); lamps[5]=vec3(48.0,6.2,-5.55);
        float specAcc = 0.0;
        vec3 specCol = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          vec3 L = lamps[i] - vW;
          float dist = length(L);
          L /= max(dist, 0.001);
          vec3 H = normalize(L + viewDir);
          float spec = pow(max(H.y, 0.0), 90.0);
          float pool = wet * 0.85 / (1.0 + dist * dist * 0.04);
          specAcc += spec * pool;
          specCol += vec3(1.0, 0.72, 0.42) * spec * pool;
        }
        col += specCol * 0.9;
        col += vec3(0.35, 0.18, 0.06) * specAcc * 0.15;
        float streak = pow(max(dot(n, normalize(viewDir + vec3(0.0, 0.35, 0.4))), 0.0), 28.0);
        col += vec3(0.9, 0.55, 0.28) * streak * wet * 0.16;
        float foam = smoothstep(2.4, 0.0, abs(vW.z + 32.0));
        col += vec3(0.72, 0.8, 0.86) * foam * (0.35 + 0.25 * sin(vW.x * 1.7 + uTime * 1.4));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }), []);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.01, -11]} material={mat}>
      <planeGeometry args={[186, 11]} />
    </mesh>
  );
}

function HeroLight() {
  const key = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const yaw = world.face;
    key.current?.position.set(world.px + Math.cos(yaw) * 1.1, world.py + 2.2, world.pz + Math.sin(yaw) * 1.1);
    rim.current?.position.set(world.px - Math.cos(yaw) * 0.8, world.py + 1.8, world.pz - Math.sin(yaw) * 0.8);
  });
  return (
    <>
      <pointLight ref={key} color="#ffe2c4" intensity={2.4} distance={4.5} decay={2} />
      <pointLight ref={rim} color="#9eb6d4" intensity={1.1} distance={3.5} decay={2} />
    </>
  );
}

export function City() {
  const hull = useTexture("/facades/hull.jpg");
  hull.colorSpace = THREE.SRGBColorSpace;
  hull.anisotropy = 8;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, -8]} receiveShadow>
        <planeGeometry args={[500, 300]} />
        <meshStandardMaterial color="#06070a" roughness={1} />
      </mesh>
      <WetRoad />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.021, -3.15]} receiveShadow material={sidewalkMaterial()}>
        <planeGeometry args={[186, 6.1]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.02, -18.3]} receiveShadow material={sidewalkMaterial()}>
        <planeGeometry args={[186, 4]} />
      </mesh>
      <mesh position={[10, 0.07, -6.2]}>
        <boxGeometry args={[180, 0.14, 0.2]} />
        <meshStandardMaterial color="#3c434c" roughness={0.65} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[24, 0.03, -15.5 + i * 1.05]}>
          <boxGeometry args={[4.2, 0.012, 0.34]} />
          <meshStandardMaterial color="#f2eee6" roughness={0.4} />
        </mesh>
      ))}
      <Water />
      <Quay hull={hull} />
      <HarborDetail />
      {BLOCKS.map((block) => (
        <BlockMesh key={`${block.x}-${block.z}`} {...block} />
      ))}
      {SKYLINE.map((block) => (
        <BlockMesh key={`s-${block.seed}`} {...block} />
      ))}
      <HarborTower />
      <HeroLight />
      <Crane />
      <Containers />
      <Dressing />
      <Lamp x={-52} z={-6.4} live />
      <Lamp x={-34} z={-4.7} live />
      <Lamp x={-17} z={-6.8} live />
      <Lamp x={3} z={-5.1} live />
      <Lamp x={22} z={-7.2} live />
      <Lamp x={46} z={-4.9} live />
      <Lamp x={64} z={-6.6} live />
    </group>
  );
}

function Quay({ hull }: { hull: THREE.Texture }) {
  const name = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 180;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.clearRect(0, 0, 1024, 180);
    g.fillStyle = "#f4efe6";
    g.font = "600 96px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("M / V  MERIDIAN", 512, 96);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const berth = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 220;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.fillStyle = "#14110e";
    g.fillRect(0, 0, 1024, 220);
    g.fillStyle = "#e7d7b4";
    g.font = "600 78px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("BERTH 4  ·  HARBOR", 512, 110);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const deck = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const g = canvas.getContext("2d");
    if (!g) throw new Error("canvas");
    g.fillStyle = "#4a4338";
    g.fillRect(0, 0, 1024, 512);
    const img = g.getImageData(0, 0, 1024, 512);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() * 30) | 0;
      img.data[i] = Math.min(255, (img.data[i] ?? 0) + n - 10);
      img.data[i + 1] = Math.min(255, (img.data[i + 1] ?? 0) + n - 14);
      img.data[i + 2] = Math.min(255, (img.data[i + 2] ?? 0) + n - 18);
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = "rgba(20,16,12,0.55)";
    g.lineWidth = 3;
    for (let x = 8; x < 1024; x += 72) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 512);
      g.stroke();
    }
    g.strokeStyle = "rgba(20,16,12,0.4)";
    for (let y = 16; y < 512; y += 160) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1024, y);
      g.stroke();
    }
    g.fillStyle = "rgba(12,10,8,0.28)";
    for (let i = 0; i < 22; i += 1) {
      g.beginPath();
      g.ellipse(Math.random() * 1024, Math.random() * 512, 18 + Math.random() * 50, 8 + Math.random() * 18, Math.random() * 3, 0, Math.PI * 2);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 2);
    tex.anisotropy = 8;
    return tex;
  }, []);
  return (
    <group>
      <mesh position={[6, 0.22, -27]} receiveShadow>
        <boxGeometry args={[168, 0.44, 12]} />
        <meshStandardMaterial color="#2a241c" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.46, -27]} receiveShadow>
        <planeGeometry args={[168, 12]} />
        <meshStandardMaterial map={deck} roughness={0.86} metalness={0.04} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={`rail${i}`} position={[-78 + i * 7.6, 0.95, -21.15]}>
          <boxGeometry args={[0.08, 1.15, 0.08]} />
          <meshStandardMaterial color="#2a3138" metalness={0.72} roughness={0.32} />
        </mesh>
      ))}
      <mesh position={[6, 1.48, -21.15]}>
        <boxGeometry args={[164, 0.05, 0.05]} />
        <meshStandardMaterial color="#3c4650" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[6, 0.72, -21.15]}>
        <boxGeometry args={[164, 0.04, 0.04]} />
        <meshStandardMaterial color="#3c4650" metalness={0.8} roughness={0.28} />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={`p${i}`} position={[-70 + i * 9, -0.2, -33.2]}>
          <cylinderGeometry args={[0.28, 0.38, 4.2, 8]} />
          <meshStandardMaterial color="#2a241c" roughness={0.86} />
        </mesh>
      ))}
      {[-48, -24, 2, 28, 52].map((x) => (
        <group key={`b${x}`} position={[x, 0.44, -21.8]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.28, 0.7, 10]} />
            <meshStandardMaterial color="#1c1a18" metalness={0.45} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.12, 12]} />
            <meshStandardMaterial color="#2a261f" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0.9, 0.15, -6]} rotation={[0.15, 0, 0.4]}>
            <cylinderGeometry args={[0.035, 0.035, 8, 5]} />
            <meshStandardMaterial color="#6a5438" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {[-36, -8, 18, 44].map((x) => (
        <mesh key={`ring${x}`} position={[x, 1.15, -21.6]} rotation={[0, 0, 0.2]}>
          <torusGeometry args={[0.28, 0.06, 8, 16]} />
          <meshStandardMaterial color="#c4553a" roughness={0.45} />
        </mesh>
      ))}
      <group position={[2, 0, -34]}>
        <mesh position={[0, 1.7, 5.52]}>
          <planeGeometry args={[51, 4.5]} />
          <meshStandardMaterial map={hull} roughness={0.62} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.7, -5.52]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[51, 4.5]} />
          <meshStandardMaterial map={hull} roughness={0.55} metalness={0.25} />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[52, 4.6, 11]} />
          <meshStandardMaterial color="#1c2830" metalness={0.35} roughness={0.48} />
        </mesh>
        <mesh position={[24, 3.1, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[10, 3.2, 9]} />
          <meshStandardMaterial color="#24343c" metalness={0.32} roughness={0.5} />
        </mesh>
        <mesh position={[-6, 6.2, 0]} castShadow>
          <boxGeometry args={[16, 4.2, 8]} />
          <meshStandardMaterial color="#8e99a1" roughness={0.55} />
        </mesh>
        <mesh position={[-2, 8.6, 0]}>
          <boxGeometry args={[6, 2.2, 6]} />
          <meshStandardMaterial color="#c5ccd2" roughness={0.5} />
        </mesh>
        <mesh position={[-6, 6.4, 4.05]}>
          <planeGeometry args={[12, 1.5]} />
          <meshBasicMaterial map={name} transparent toneMapped={false} />
        </mesh>
        {[-8, -2, 4].map((x) => (
          <mesh key={`win${x}`} position={[x, 6.5, 4.06]}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshStandardMaterial color="#9fd0e8" emissive="#7eb6d4" emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        ))}
        {[-16, -8, 0, 8, 14].map((x, i) => (
          <mesh key={`box${x}`} position={[x, 5.4, (i % 2) * 0.4]}>
            <boxGeometry args={[2.2, 2.3, 5.4]} />
            <meshStandardMaterial color={["#8a3a2a", "#1d3c4a", "#c4a574", "#243028", "#3a3a3a"][i]} roughness={0.5} metalness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, 1.05, 5.6]}>
          <boxGeometry args={[48, 0.35, 0.25]} />
          <meshStandardMaterial color="#8a1c16" roughness={0.5} />
        </mesh>
      </group>
      <group position={[46, 0, -38]}>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[9, 2.2, 4]} />
          <meshStandardMaterial color="#243028" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[1.2, 3.1, 0]}>
          <boxGeometry args={[3.2, 1.6, 3]} />
          <meshStandardMaterial color="#f2efe6" roughness={0.55} />
        </mesh>
      </group>
      {[-18, 22, 58].map((x) => (
        <mesh key={`buoy${x}`} position={[x, 0.15, -48]}>
          <sphereGeometry args={[0.55, 14, 12]} />
          <meshStandardMaterial color={x > 0 ? "#c4553a" : "#d7c27a"} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-30, 3.2, -20.6]}>
        <boxGeometry args={[0.16, 6.2, 0.16]} />
        <meshStandardMaterial color="#2a241c" roughness={0.6} />
      </mesh>
      <mesh position={[-30, 5.5, -20.5]}>
        <planeGeometry args={[6.4, 1.35]} />
        <meshBasicMaterial map={berth} toneMapped={false} />
      </mesh>
      <pointLight position={[-6, 9, -36]} color="#fff1d2" intensity={6} distance={22} decay={2} />
      <pointLight position={[20, 4, -30]} color="#ffb36a" intensity={4} distance={16} decay={2} />
    </group>
  );
}

function Water() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      uniform float uTime;
      varying vec3 vW;
      varying vec3 vN;
      void main(){
        vec3 p = position;
        float w1 = sin(p.x * 0.11 + uTime * 0.7) * 0.18;
        float w2 = sin(p.y * 0.17 - uTime * 0.55) * 0.12;
        float w3 = sin((p.x + p.y) * 0.07 + uTime * 0.35) * 0.08;
        p.z += w1 + w2 + w3;
        vec3 n = normalize(vec3(-cos(p.x * 0.11 + uTime * 0.7) * 0.02, -cos(p.y * 0.17 - uTime * 0.55) * 0.02, 1.0));
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * n);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      varying vec3 vW;
      varying vec3 vN;
      uniform float uTime;
      void main(){
        vec3 viewDir = normalize(cameraPosition - vW);
        float fres = pow(1.0 - clamp(dot(normalize(vN), viewDir), 0.0, 1.0), 3.0);
        vec3 deep = vec3(0.035, 0.075, 0.11);
        vec3 mid = vec3(0.08, 0.14, 0.18);
        float swell = sin(vW.x * 0.08 + uTime * 0.6) * 0.5 + 0.5;
        vec3 col = mix(deep, mid, swell * 0.35);
        vec3 sky = mix(vec3(0.05, 0.08, 0.12), vec3(0.85, 0.55, 0.28), fres * fres);
        col = mix(col, sky, fres * 0.72);
        float spec = pow(max(dot(normalize(vN), normalize(viewDir + vec3(-0.15, 0.85, 0.2))), 0.0), 40.0);
        float spec2 = pow(max(dot(normalize(vN), normalize(viewDir + vec3(0.4, 0.2, 0.4))), 0.0), 12.0);
        col += vec3(1.0, 0.86, 0.7) * spec * 0.7;
        col += vec3(0.45, 0.62, 0.8) * spec2 * 0.18;
        float lamp = exp(-pow((vW.x + 6.0) * 0.04, 2.0)) * exp(-pow((vW.z + 40.0) * 0.08, 2.0));
        col += vec3(1.0, 0.62, 0.28) * lamp * 0.35;
        float foam = smoothstep(4.2, 0.2, abs(vW.z + 32.2));
        float lace = sin(vW.x * 1.3 + uTime * 1.6) * sin(vW.x * 0.37 - uTime);
        col = mix(col, vec3(0.72, 0.8, 0.84), foam * (0.35 + 0.25 * lace));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  }), []);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.22, -60]} material={mat}>
      <planeGeometry args={[420, 48, 64, 18]} />
    </mesh>
  );
}

function Crane() {
  const steel = "#3a424c";
  return (
    <group position={[-10, 0, -32]}>
      {[-0.7, 0.7].map((x) =>
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 16, z]}>
            <boxGeometry args={[0.16, 32, 0.16]} />
            <meshStandardMaterial color={steel} metalness={0.75} roughness={0.28} />
          </mesh>
        )),
      )}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`br${i}`} position={[0, 3 + i * 3.6, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[1.7, 0.08, 0.08]} />
            <meshStandardMaterial color="#2a3138" metalness={0.7} roughness={0.32} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[1.7, 0.08, 0.08]} />
            <meshStandardMaterial color="#2a3138" metalness={0.7} roughness={0.32} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 32.2, 0]}>
        <boxGeometry args={[2.2, 0.4, 2.2]} />
        <meshStandardMaterial color="#2a3036" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[11, 31.6, 0]}>
        <boxGeometry args={[24, 0.35, 0.55]} />
        <meshStandardMaterial color="#c45c3a" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[11, 31.15, 0]}>
        <boxGeometry args={[22, 0.12, 0.12]} />
        <meshStandardMaterial color="#8a4030" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[22.2, 16, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 30, 6]} />
        <meshStandardMaterial color="#1a1e22" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[22.2, 1.3, 0]}>
        <boxGeometry args={[1.4, 0.55, 2.4]} />
        <meshStandardMaterial color="#c45c3a" roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[21, 30.4, 0]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshBasicMaterial color="#ff3b2a" toneMapped={false} />
      </mesh>
      <mesh position={[-2, 33.2, 0]}>
        <boxGeometry args={[1.4, 1.1, 1.2]} />
        <meshStandardMaterial color="#d7d2c6" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Containers() {
  const colors = ["#8a3a2a", "#1d3c4a", "#c4a574", "#243028", "#3a3a3a", "#6a3030", "#1a2830", "#8a7048"];
  return (
    <group>
      {Array.from({ length: 14 }, (_, i) => {
        const x = -48 + i * 6.4;
        const color = colors[i % colors.length] ?? "#243028";
        const stacked = i % 3 !== 1;
        return (
          <group key={x} position={[x, 0, -29.5]}>
            <mesh position={[0, 1.25, 0]} castShadow>
              <boxGeometry args={[2.5, 2.5, 6.2]} />
              <meshStandardMaterial color={color} roughness={0.55} metalness={0.28} />
            </mesh>
            <mesh position={[0, 1.25, 3.12]}>
              <boxGeometry args={[2.35, 2.2, 0.06]} />
              <meshStandardMaterial color="#14181c" metalness={0.4} roughness={0.45} />
            </mesh>
            {[-0.7, 0, 0.7].map((x) => (
              <mesh key={x} position={[x, 1.25, 3.16]}>
                <boxGeometry args={[0.06, 2.3, 0.04]} />
                <meshStandardMaterial color="#0c1014" metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
            {stacked ? (
              <mesh position={[0, 3.8, 0]} castShadow>
                <boxGeometry args={[2.5, 2.5, 6.2]} />
                <meshStandardMaterial color={colors[(i + 3) % colors.length]} roughness={0.55} metalness={0.28} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function Dressing() {
  return (
    <group>
      {[[-58, 1.4, 0.8], [-41, -0.4, 1.3], [-19, 1.1, 0.7], [-2, 0.2, 1.15], [21, 1.6, 0.85], [47, -0.6, 1.25]].map(([x, z, s]) => (
        <group key={x} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.08, 0.14, 2.2, 6]} /><meshStandardMaterial color="#1a1410" roughness={0.9} /></mesh>
          <mesh position={[0.15, 2.4, 0]} scale={s}><sphereGeometry args={[1.05, 10, 8]} /><meshStandardMaterial color="#152018" roughness={0.92} /></mesh>
        </group>
      ))}
      {[-34, -8, 16].map((x) => (
        <mesh key={x} position={[x, 0.45, -4.4]}>
          <boxGeometry args={[1.5, 0.08, 0.42]} />
          <meshStandardMaterial color="#5a4030" roughness={0.55} />
        </mesh>
      ))}
      <group position={[-16, 0, -26]}>
        <mesh position={[0, 1, 0]}><boxGeometry args={[11, 1.4, 3]} /><meshStandardMaterial color="#12161c" metalness={0.35} roughness={0.5} /></mesh>
        <mesh position={[1.5, 2.2, 1.2]}><planeGeometry args={[1.4, 0.65]} /><meshStandardMaterial color="#ffd2a4" emissive="#ffb06a" emissiveIntensity={2.5} toneMapped={false} /></mesh>
      </group>
    </group>
  );
}

export function Rain() {
  const count = 500;
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  useFrame((_, dt) => {
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      let y = arr[i * 6 + 1] - dt * 22;
      if (y < 0 || arr[i * 6 + 1] === 0) {
        const x = world.camX + (Math.random() - 0.5) * 30;
        const z = world.camZ + (Math.random() - 0.5) * 30;
        const top = 12 + Math.random() * 8;
        arr[i * 6] = x; arr[i * 6 + 1] = top; arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x + 0.06; arr[i * 6 + 4] = top - 0.6; arr[i * 6 + 5] = z;
      } else {
        arr[i * 6 + 1] = y; arr[i * 6 + 4] = y - 0.6;
      }
    }
    attr.needsUpdate = true;
  });
  return <lineSegments geometry={geo}><lineBasicMaterial color="#c9d4e2" transparent opacity={0.2} /></lineSegments>;
}

export function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    step(dt);
    const aerial = world.ending;
    const yaw = world.camYaw;
    const pitch = Math.max(-1.05, Math.min(1.15, world.camPitch));
    const dist = aerial ? 34 : world.driving ? 9.2 : 4.45;
    const focusX = aerial ? 27 : world.px;
    const focusY = aerial ? 16 : world.py + 1.38;
    const focusZ = aerial ? 6 : world.pz;
    const lookUp = Math.max(0, -pitch);
    const lookDown = Math.max(0, pitch);
    const horiz = dist * (1 - lookDown * 0.32) * (1 - lookUp * 0.15);
    const shoulder = aerial || world.driving ? 0 : 0.42;
    const tx = focusX - Math.cos(yaw) * horiz + Math.sin(yaw) * shoulder;
    const tz = focusZ - Math.sin(yaw) * horiz - Math.cos(yaw) * shoulder;
    const ty = Math.max(world.py + 0.55, focusY + 0.4 + lookDown * dist * 0.95 - lookUp * dist * 0.35);
    const lookY = focusY + lookUp * dist * 2.6 - lookDown * 1.4;
    const k = world.snap ? 1 : 1 - Math.exp(-8 * dt);
    world.snap = false;
    world.camX += (tx - world.camX) * k;
    world.camY += (ty - world.camY) * k;
    world.camZ += (tz - world.camZ) * k;
    camera.position.set(world.camX, world.camY, world.camZ);
    camera.lookAt(focusX, lookY, focusZ);
    const spot = markerNow();
    if (spot) {
      const p = new THREE.Vector3(spot.x, spot.y + 2.2, spot.z).project(camera);
      world.markerSx = p.x * 0.5 + 0.5;
      world.markerSy = -p.y * 0.5 + 0.5;
      world.markerBehind = p.z > 1;
      world.markerDist = Math.hypot(world.px - spot.x, world.pz - spot.z);
      world.markerOn = true;
    } else {
      world.markerOn = false;
    }
    const fov = aerial ? 38 : world.driving ? 60 : 48;
    if (Math.abs(camera.fov - fov) > 0.08) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
