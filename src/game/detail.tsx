import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BLOCKS } from "@/game/layout";

function Scatter({
  count,
  color,
  args,
  seed,
  y,
  metal = 0.2,
}: {
  count: number;
  color: string;
  args: [number, number, number];
  seed: number;
  y: number;
  metal?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number, number, number][] = [];
    let s = seed;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return (s & 2147483647) / 2147483647;
    };
    for (let i = 0; i < count; i += 1) {
      out.push([-70 + rnd() * 140, -24.4 - rnd() * 5.4, rnd() * Math.PI, 0.65 + rnd() * 0.55]);
    }
    return out;
  }, [count, seed]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    spots.forEach(([x, z, rot, scale], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.y = rot;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [spots, y]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.62} metalness={metal} />
    </instancedMesh>
  );
}

export function HarborDetail() {
  return (
    <group>
      <ShipSkin />
      <DockKit />
      <Faces />
      <StreetKit />
      <Practicals />
    </group>
  );
}

function ShipSkin() {
  const plates = useMemo(() => Array.from({ length: 14 }, (_, i) => -22 + i * 3.4), []);
  return (
    <group position={[2, 0, -34]}>
      {plates.map((x) => (
        <mesh key={x} position={[x, 2.4, 5.55]}>
          <boxGeometry args={[0.08, 3.4, 0.08]} />
          <meshStandardMaterial color="#8ea0aa" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {[-12, -4, 4, 12, 18].map((x) => (
        <mesh key={`port${x}`} position={[x, 2.6, 5.58]}>
          <circleGeometry args={[0.28, 12]} />
          <meshStandardMaterial color="#9fd0e8" emissive="#7eb6d4" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[-24, 1.1, 2]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[0.12, 2.4, 0.35]} />
        <meshStandardMaterial color="#1a1e22" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.35, 7.2]}>
        <boxGeometry args={[28, 0.12, 1.4]} />
        <meshStandardMaterial color="#6a5438" roughness={0.7} />
      </mesh>
      <mesh position={[18, 7.4, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 6, 6]} />
        <meshStandardMaterial color="#d7d2c6" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[18, 10.2, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color="#f4efe6" />
      </mesh>
      <pointLight position={[18, 9.4, 2]} color="#fff6e0" intensity={20} distance={24} decay={2} />
      <mesh position={[-20, 1.5, 5.7]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#ff3a2a" toneMapped={false} />
      </mesh>
      <mesh position={[22, 1.5, 5.7]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#7CFFB2" toneMapped={false} />
      </mesh>
      <mesh position={[0, 4.15, 5.35]}>
        <boxGeometry args={[46, 0.08, 0.08]} />
        <meshStandardMaterial color="#d7d2c6" metalness={0.55} roughness={0.35} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`rail${i}`} position={[-22 + i * 4, 3.55, 5.35]}>
          <boxGeometry args={[0.06, 1.2, 0.06]} />
          <meshStandardMaterial color="#c5ced6" metalness={0.6} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function DockKit() {
  return (
    <group>
      {[-60, -42, -20, 6, 30, 54].map((x) => (
        <group key={x} position={[x, 0.5, -21.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0.4]}>
            <torusGeometry args={[0.55, 0.12, 8, 14]} />
            <meshStandardMaterial color="#6a5438" roughness={0.8} />
          </mesh>
          <mesh position={[0.7, 0.15, -0.2]} rotation={[0.2, 0.4, 0.8]}>
            <torusGeometry args={[0.38, 0.1, 8, 12]} />
            <meshStandardMaterial color="#5a4630" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {[-50, -16, 12, 40].map((x, i) => (
        <group key={`pal${x}`} position={[x, 0.35, -19.4]} rotation={[0, i * 0.4, 0]}>
          <mesh>
            <boxGeometry args={[1.3, 0.12, 1.05]} />
            <meshStandardMaterial color="#6a4a30" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.1, 0.7, 0.9]} />
            <meshStandardMaterial color={i % 2 ? "#8a3a2a" : "#1d3c4a"} roughness={0.55} />
          </mesh>
        </group>
      ))}
      <Scatter count={26} color="#3a342c" args={[0.55, 0.7, 0.55]} seed={9} y={0.92} />
      <Scatter count={18} color="#8a3a2a" args={[1.1, 0.9, 0.7]} seed={21} y={1.15} metal={0.15} />
      {[-33, 8, 47].map((x) => (
        <mesh key={`fender${x}`} position={[x, 1.3, -21.5]}>
          <boxGeometry args={[1.6, 0.45, 0.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Faces() {
  const street = BLOCKS.filter((block) => block.z < 22);
  return (
    <group>
      {street.map((block) => {
        const floors = Math.min(6, Math.max(2, Math.floor((block.h - 4) / 3.6)));
        const cx = block.x + block.w / 2;
        const front = block.z - 0.72;
        return (
          <group key={`${block.x}-${block.seed}`}>
            <mesh position={[cx, 0.48, front]} castShadow>
              <boxGeometry args={[block.w * 0.98, 0.96, 0.42]} />
              <meshStandardMaterial color="#3e3934" roughness={0.82} metalness={0.08} />
            </mesh>
            <mesh position={[cx, 3.15, front - 0.7]}>
              <boxGeometry args={[Math.min(block.w * 0.72, 8), 0.08, 1.5]} />
              <meshStandardMaterial color={block.seed % 2 ? "#6a3030" : "#1c2830"} roughness={0.55} metalness={0.2} />
            </mesh>
            <mesh position={[cx, 3.05, front - 1.35]}>
              <boxGeometry args={[0.08, 0.9, 0.08]} />
              <meshStandardMaterial color="#2a241c" />
            </mesh>
            {Array.from({ length: floors }, (_, i) => (
              <mesh key={i} position={[cx + (((block.seed + i) % 5) - 2) * 0.7, 4.6 + i * 3.15, front - 0.15]}>
                <boxGeometry args={[1.15, 0.42, 0.38]} />
                <meshStandardMaterial color="#d5dbe3" metalness={0.45} roughness={0.35} />
              </mesh>
            ))}
            <mesh position={[block.x + 0.4, block.h * 0.42, front]}>
              <boxGeometry args={[0.14, block.h * 0.62, 0.16]} />
              <meshStandardMaterial color="#4a4038" roughness={0.55} metalness={0.25} />
            </mesh>
            <mesh position={[block.x + block.w - 0.4, block.h * 0.42, front]}>
              <boxGeometry args={[0.14, block.h * 0.62, 0.16]} />
              <meshStandardMaterial color="#4a4038" roughness={0.55} metalness={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function StreetKit() {
  const bins = [-62, -48, -33, -18, -4, 11, 27, 44, 61];
  const meters = [-55, -40, -25, -9, 6, 22, 38, 54];
  const benches = [-50, -22, 8, 34, 58];
  return (
    <group>
      <mesh position={[6, 0.1, -6.2]} receiveShadow>
        <boxGeometry args={[168, 0.18, 0.28]} />
        <meshStandardMaterial color="#5c574e" roughness={0.78} />
      </mesh>
      <mesh position={[6, 0.1, -16.6]}>
        <boxGeometry args={[168, 0.16, 0.24]} />
        <meshStandardMaterial color="#5c574e" roughness={0.78} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={`boll${i}`} position={[-70 + i * 6.2, 0.42, -5.55]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.84, 8]} />
          <meshStandardMaterial color="#2c3138" metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
      {bins.map((x) => (
        <group key={`bin${x}`} position={[x, 0, -4.35]}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[0.62, 0.96, 0.48]} />
            <meshStandardMaterial color="#243028" roughness={0.62} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.98, 0]}>
            <boxGeometry args={[0.66, 0.08, 0.52]} />
            <meshStandardMaterial color="#1a1e18" metalness={0.4} roughness={0.45} />
          </mesh>
        </group>
      ))}
      {meters.map((x) => (
        <group key={`m${x}`} position={[x, 0, -5.15]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.4, 6]} />
            <meshStandardMaterial color="#3a4048" metalness={0.65} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.28, 0.06]}>
            <boxGeometry args={[0.28, 0.22, 0.08]} />
            <meshStandardMaterial color="#14181c" />
          </mesh>
          <mesh position={[0, 1.28, 0.11]}>
            <planeGeometry args={[0.18, 0.1]} />
            <meshStandardMaterial color="#9fd0c8" emissive="#6ec8b8" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      {benches.map((x, i) => (
        <group key={`bench${x}`} position={[x, 0, -4.05]} rotation={[0, i % 2 ? 0.08 : -0.05, 0]}>
          <mesh position={[-0.7, 0.32, 0]}>
            <boxGeometry args={[0.08, 0.64, 0.08]} />
            <meshStandardMaterial color="#2a241c" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0.7, 0.32, 0]}>
            <boxGeometry args={[0.08, 0.64, 0.08]} />
            <meshStandardMaterial color="#2a241c" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[1.7, 0.07, 0.48]} />
            <meshStandardMaterial color="#6a5438" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.78, -0.18]}>
            <boxGeometry args={[1.7, 0.36, 0.07]} />
            <meshStandardMaterial color="#6a5438" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {[-58, -30, -6, 18, 46].map((x) => (
        <group key={`hyd${x}`} position={[x, 0, -4.7]}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.76, 8]} />
            <meshStandardMaterial color="#8a2a22" roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh position={[0.16, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.22, 6]} />
            <meshStandardMaterial color="#c9ced4" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {[-36, -14, 8, 30, 52].map((x) => (
        <mesh key={`puddle${x}`} position={[x, 0.03, -10.6]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <circleGeometry args={[1.1 + (Math.abs(x) % 5) * 0.15, 18]} />
          <meshStandardMaterial color="#0c1016" roughness={0.08} metalness={0.85} envMapIntensity={1.4} />
        </mesh>
      ))}
      {[-42, -16, 12, 40].map((x) => (
        <group key={`bike${x}`} position={[x, 0, -5.85]}>
          <mesh position={[-0.35, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.03, 8, 16]} />
            <meshStandardMaterial color="#1a1e22" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0.35, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.03, 8, 16]} />
            <meshStandardMaterial color="#1a1e22" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.04]} />
            <meshStandardMaterial color="#2a3038" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Practicals() {
  return (
    <group>
      {[-40, -10, 16, 42].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.2, -20.8]}>
            <boxGeometry args={[0.5, 0.12, 0.2]} />
            <meshStandardMaterial color="#ffd7a8" emissive="#ffb36a" emissiveIntensity={3} toneMapped={false} />
          </mesh>
          <pointLight position={[x, 3.6, -20]} color="#ffb36a" intensity={5} distance={12} decay={2} />
        </group>
      ))}
      <pointLight position={[8, 6, -30]} color="#9fd0e8" intensity={10} distance={18} decay={2} />
    </group>
  );
}
