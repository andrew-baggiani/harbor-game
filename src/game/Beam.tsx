import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The waypoint: a column of light, not a pole.
 *
 * Two open cylinders share one shader. The alpha falls off toward each silhouette edge (so it reads
 * as a volume, not a flat stripe), fades out with height, and carries faint bands that drift up. A
 * soft disc and a pulsing ring sit on the floor, and a few motes rise inside. Everything is additive
 * with no depth writes, so it glows over the scene without hiding it, and uses no lights (adding a
 * light recompiles every material in the tower).
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vRim;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec3 toCam = normalize(cameraPosition - world.xyz);
    // 1 facing the camera, 0 at the silhouette, on the horizontal plane only.
    vRim = abs(dot(normalize(n.xz), normalize(toCam.xz)));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBands;
  varying vec2 vUv;
  varying float vRim;
  void main() {
    float h = vUv.y;
    float core = pow(vRim, 2.2);
    float fade = pow(1.0 - h, 1.6) * smoothstep(0.0, 0.04, h);
    float bands = 0.82 + 0.18 * sin((h * uBands - uTime * 1.6) * 6.2831);
    float a = core * fade * bands * uOpacity;
    gl_FragColor = vec4(uColor * (0.9 + 0.6 * core), a);
  }
`;

const DISC_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float a = pow(clamp(1.0 - r, 0.0, 1.0), 2.4) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;
const DISC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function beamMaterial(color: string, opacity: number, bands: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uOpacity: { value: opacity }, uBands: { value: bands } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

const MOTES = 14;

export type BeamProps = {
  /** Height of the column in metres. Keep it under the ceiling indoors. */
  height?: number;
  /** Radius of the floor ring. The column is about a third of it. */
  radius?: number;
  color?: string;
};

/** Place at floor level. Ref is the outer group, so a caller can move or hide it every frame. */
export const Beam = forwardRef<THREE.Group, BeamProps>(function Beam({ height = 3, radius = 0.6, color = "#e7c48a" }, outer) {
  const core = useMemo(() => beamMaterial(color, 0.95, height * 0.9), [color, height]);
  const halo = useMemo(() => beamMaterial(color, 0.35, height * 0.5), [color, height]);
  const disc = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DISC_VERT,
        fragmentShader: DISC_FRAG,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.55 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color],
  );
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const motes = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: MOTES }, (_, i) => ({ a: (i / MOTES) * Math.PI * 2 + i * 1.7, r: 0.15 + ((i * 37) % 10) / 40, off: (i * 0.61) % 1 })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    core.uniforms.uTime.value = t;
    halo.uniforms.uTime.value = t * 0.7;
    const pulse = 1 + Math.sin(t * 2.6) * 0.06;
    if (ring.current) ring.current.scale.set(pulse, pulse, 1);
    if (ring2.current) {
      // A second ring that expands and fades, once every 1.8 s.
      const k = (t % 1.8) / 1.8;
      const s = 1 + k * 0.9;
      ring2.current.scale.set(s, s, 1);
      (ring2.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - k);
    }
    const m = motes.current;
    if (m) {
      for (let i = 0; i < MOTES; i += 1) {
        const sd = seeds.at(i)!;
        const k = (t * 0.22 + sd.off) % 1;
        dummy.position.set(Math.cos(sd.a + t * 0.4) * sd.r * radius, k * height * 0.85, Math.sin(sd.a + t * 0.4) * sd.r * radius);
        const s = 0.6 + Math.sin(k * Math.PI) * 0.8;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
  });

  const col = radius * 0.32;
  return (
    <group ref={outer}>
      <mesh position={[0, height / 2, 0]} material={core} renderOrder={2}>
        <cylinderGeometry args={[col * 0.75, col, height, 24, 1, true]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={halo} renderOrder={1}>
        <cylinderGeometry args={[col * 2.4, col * 2.6, height, 24, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} material={disc}>
        <planeGeometry args={[radius * 3, radius * 3]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[radius * 0.86, radius, 56]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius * 0.94, radius, 56]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <instancedMesh ref={motes} args={[undefined, undefined, MOTES]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </group>
  );
});
