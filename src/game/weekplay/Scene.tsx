import { useFrame, useThree } from "@react-three/fiber";
import { Beam } from "@/game/Beam";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CastSlot, Prop, WeekBeat } from "@/content/week/types";
import type { Find } from "@/content/week/play";
import { Figure } from "@/game/draw";
import { CastActor } from "@/game/cast";
import { blocked } from "@/game/layout";
import { roomBlocked } from "@/game/weekplay/BakedRoom";
import { blockedIn, type RoomSet, type Spot } from "@/game/weekplay/sets";

/** Mutable per-frame player state, shared with the HUD. */
export const player = {
  x: 0,
  z: 0,
  yaw: 0,
  pitch: -0.08,
  moveX: 0,
  moveZ: 0,
  keys: new Set<string>(),
  near: false,
  moving: false,
};

/** Greybox cast colours. A MetaHuman swap keys off the same slot name. */
const CAST_LOOK: Record<CastSlot, { color: string; accent: string }> = {
  "dock-runner": { color: "#c8a23a", accent: "#e8e2d0" },
  "desk-coworker": { color: "#2f3a52", accent: "#c4a574" },
  contractor: { color: "#5a6b5a", accent: "#e0e0e0" },
  "last-day": { color: "#5b4a5f", accent: "#c4a574" },
  "at-home": { color: "#7a5c48", accent: "#d9cbb5" },
  "night-desk": { color: "#1d2433", accent: "#d0b37a" },
  "admin-peer": { color: "#3d4a3f", accent: "#9fd4b0" },
  caller: { color: "#333", accent: "#333" },
};

const textureCache = new Map<string, THREE.Texture>();
function loadTexture(path: string): THREE.Texture {
  const hit = textureCache.get(path);
  if (hit) return hit;
  const tex = new THREE.TextureLoader().load(`/assets/textures/${path}`);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(path, tex);
  return tex;
}

/** A small screen rendered from text, for props that have no art file yet. */
export function textTexture(text: string, w: number, h: number, bg: string, fg: string): THREE.Texture {
  const key = `${text}|${w}|${h}|${bg}|${fg}`;
  const hit = textureCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  const size = Math.round(Math.min(w, h) / 9);
  ctx.font = `600 ${size}px Barlow Condensed, Arial Narrow, sans-serif`;
  ctx.textBaseline = "top";
  const words = text.split(" ");
  let line = "";
  let y = size * 0.8;
  const pad = size * 0.7;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w - pad * 2 && line) {
      ctx.fillText(line, pad, y);
      line = word;
      y += size * 1.25;
    } else line = test;
  }
  if (line) ctx.fillText(line, pad, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function propTexture(prop: Prop, flipped: boolean): THREE.Texture | null {
  const file = flipped ? (prop.b ?? prop.a) : prop.a;
  if (file) return loadTexture(file);
  const text = flipped ? (prop.textB ?? prop.text) : prop.text;
  if (!text) return null;
  const phone = prop.kind === "phone";
  return textTexture(text, phone ? 360 : 640, phone ? 720 : 400, flipped ? "#3a1416" : "#0f1824", flipped ? "#ffd6cf" : "#d8e6f5");
}

function windowTexture(): THREE.Texture {
  const hit = textureCache.get("__windows");
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0b1220");
  grad.addColorStop(1, "#1b2436");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let b = 0; b < 26; b += 1) {
    const bx = b * 40 + rnd() * 10;
    const bh = 60 + rnd() * 170;
    ctx.fillStyle = "#0a0e16";
    ctx.fillRect(bx, 256 - bh, 34, bh);
    for (let i = 0; i < 40; i += 1) {
      if (rnd() > 0.38) continue;
      ctx.fillStyle = rnd() > 0.3 ? "#e9c27a" : "#9fc0e8";
      ctx.fillRect(bx + 3 + Math.floor(rnd() * 5) * 6, 256 - bh + 6 + Math.floor(rnd() * (bh / 9)) * 8, 3, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set("__windows", tex);
  return tex;
}

export function Room({ set }: { set: RoomSet }) {
  const { w, d, h } = set;
  const win = useMemo(() => (set.windows ? windowTexture() : null), [set.windows]);
  const wall = (pos: [number, number, number], rot: number, len: number, face: "n" | "s" | "e" | "w") =>
    set.windows === face && win ? (
      <group key={face} position={pos} rotation={[0, rot, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[len, h]} />
          <meshBasicMaterial map={win} toneMapped={false} />
        </mesh>
        {Array.from({ length: Math.floor(len / 2) + 1 }, (_, i) => (
          <mesh key={i} position={[-len / 2 + i * 2, 0, 0.02]}>
            <boxGeometry args={[0.08, h, 0.06]} />
            <meshStandardMaterial color="#14161b" />
          </mesh>
        ))}
      </group>
    ) : (
      <mesh key={face} position={pos} rotation={[0, rot, 0]} receiveShadow>
        <planeGeometry args={[len, h]} />
        <meshStandardMaterial color={set.wall} roughness={0.92} />
      </mesh>
    );
  return (
    <group>
      <ambientLight intensity={0.7} color={set.light} />
      <hemisphereLight args={[set.light, "#2a251e", 0.8]} />
      {[-w / 4, w / 4].map((x) =>
        [-d / 4, d / 4].map((z) => <pointLight key={`${x}${z}`} position={[x, h - 0.3, z]} intensity={9} distance={10} decay={1.4} color={set.light} />),
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={set.floor} roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#1c1e22" roughness={1} />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, h - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, d * 0.5]} />
          <meshBasicMaterial color={set.light} transparent opacity={0.55} />
        </mesh>
      ))}
      {wall([0, h / 2, -d / 2], 0, w, "n")}
      {wall([0, h / 2, d / 2], Math.PI, w, "s")}
      {wall([-w / 2, h / 2, 0], Math.PI / 2, d, "w")}
      {wall([w / 2, h / 2, 0], -Math.PI / 2, d, "e")}
      {set.pieces.map((p, i) => (
        <mesh key={i} position={[p.x, (p.y ?? 0) + p.h / 2, p.z]} castShadow receiveShadow>
          <boxGeometry args={[p.w, p.h, p.d]} />
          <meshStandardMaterial color={p.color ?? "#3a3d44"} roughness={0.8} emissive={p.glow ?? "#000"} emissiveIntensity={p.glow ? 0.16 : 0} />
        </mesh>
      ))}
    </group>
  );
}

const PROP_SIZE: Record<Prop["kind"], [number, number]> = {
  screen: [0.96, 0.54],
  laptop: [0.5, 0.32],
  phone: [0.17, 0.36],
  badge: [0.2, 0.2],
  paper: [0.3, 0.3],
  drive: [0.08, 0.04],
};

/** Where the player stands to use a spot, and where the gold ring goes. */
export function approach(spot: Spot) {
  return { x: spot.ax ?? spot.x, z: spot.az ?? spot.z + 0.9 };
}

/** One beat's prop at its spot, with a column of light where the player stands when it's the live beat. */
export function BeatProp({ beat, set, flipped, live, shakeAt = 0 }: { beat: WeekBeat; set: RoomSet; flipped: boolean; live: boolean; shakeAt?: number }) {
  const spot = set.spots[beat.spot];
  const tex = beat.prop ? propTexture(beat.prop, flipped) : null;
  const shaker = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = shaker.current;
    if (!g) return;
    const age = (performance.now() - shakeAt) / 1000;
    const k = shakeAt && age < 1.4 ? (1 - age / 1.4) * 0.012 : 0;
    g.position.set(Math.sin(age * 90) * k, Math.abs(Math.sin(age * 60)) * k * 0.6, Math.cos(age * 75) * k);
  });
  if (!spot) return null;
  const kind = beat.prop?.kind ?? "screen";
  const [pw, ph] = PROP_SIZE[kind];
  const onMonitor = !!spot.monitor && kind === "screen";
  const floor = set.harbor?.y ?? 0;
  const at = approach(spot);
  const flat = kind === "paper" || kind === "badge";
  return (
    <group>
      {beat.prop && !onMonitor && (
        <group position={[spot.x, spot.py, spot.z]} rotation={[0, spot.face ?? Math.atan2(at.x - spot.x, at.z - spot.z), 0]}>
          <group ref={shaker}>
            <group position={[0, flat ? 0.01 : ph / 2 + 0.02, 0]} rotation={[flat ? -Math.PI / 2 + 0.35 : -0.12, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[pw + 0.02, ph + 0.02, kind === "paper" ? 0.003 : 0.012]} />
                <meshStandardMaterial
                  color={kind === "paper" ? "#e9e4d8" : "#0e1014"}
                  roughness={kind === "paper" ? 0.9 : 0.35}
                  metalness={kind === "paper" ? 0 : 0.4}
                />
              </mesh>
              <mesh position={[0, 0, kind === "paper" ? 0.002 : 0.0065]}>
                <planeGeometry args={[pw, ph]} />
                <meshBasicMaterial map={tex ?? undefined} color={tex ? "#ffffff" : "#1a2230"} toneMapped={false} />
              </mesh>
              {kind === "laptop" && (
                <mesh position={[0, -ph / 2 - 0.01, 0.16]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
                  <boxGeometry args={[pw + 0.02, 0.3, 0.014]} />
                  <meshStandardMaterial color="#1c1f25" roughness={0.4} metalness={0.5} />
                </mesh>
              )}
            </group>
          </group>
          {/* No lights here on purpose: adding or removing a light recompiles every material in the tower. */}
        </group>
      )}
      {live && (
        <group position={[at.x, floor, at.z]}>
          <Beam height={2.5} radius={0.42} />
        </group>
      )}
    </group>
  );
}

/** Greybox stand-in for a cast slot. Turns to face the player. */
export function CastFigure({ slot, x, z, y = 0, talking = false }: { slot: CastSlot; x: number; z: number; y?: number; talking?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const look = CAST_LOOK[slot];
  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = Math.atan2(player.x - x, player.z - z);
    let diff = target - ref.current.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ref.current.rotation.y += diff * Math.min(1, dt * 3);
  });
  return (
    <group ref={ref} position={[x, y, z]} userData={{ cast: slot }}>
      <CastActor slot={slot} talking={talking} fallback={<Figure color={look.color} accent={look.accent} />} />
    </group>
  );
}

/** First-person walker. W forward, S back, A strafe left, D strafe right, drag to look. */
/** Something optional the player can use when standing within r of (x, z). */
export type Nearby = { id: string; x: number; z: number; r: number };

export function Walker({
  set,
  target,
  onNear,
  items = [],
  onItem,
}: {
  set: RoomSet;
  target: { x: number; z: number; lx?: number; ly?: number; lz?: number } | null;
  onNear: (near: boolean) => void;
  items?: Nearby[];
  onItem?: (id: string | null) => void;
}) {
  const { camera } = useThree();
  const lastNear = useRef(false);
  const lastItem = useRef<string | null>(null);
  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);
  useEffect(() => {
    // Test hook for automated play-throughs: read the live target and move the player.
    (window as unknown as { __drc?: unknown }).__drc = { player, target };
  }, [target]);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const k = player.keys;
    let fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    let side = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    const turn = (k.has("ArrowRight") ? 1 : 0) - (k.has("ArrowLeft") ? 1 : 0);
    player.yaw -= turn * dt * 2.2;
    fwd += -player.moveZ;
    side += player.moveX;
    const len = Math.hypot(fwd, side);
    if (len > 1) {
      fwd /= len;
      side /= len;
    }
    const speed = 2.6;
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    // Camera looks down -Z at yaw 0. Forward is (-sin, -cos); right is (cos, -sin).
    const dx = (-sin * fwd + cos * side) * speed * dt;
    const dz = (-cos * fwd - sin * side) * speed * dt;
    const floor = set.harbor?.y ?? 0;
    const hit = (x: number, z: number) => (set.harbor ? blocked(x, z, floor, 0.26) : set.baked ? roomBlocked(x, z, floor, 0.26) : blockedIn(set, x, z));
    if (!hit(player.x + dx, player.z)) player.x += dx;
    if (!hit(player.x, player.z + dz)) player.z += dz;
    const bob = len > 0.1 ? Math.sin(performance.now() / 140) * 0.025 : 0;
    camera.position.set(player.x, floor + 1.62 + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    const near = !!target && Math.hypot(player.x - target.x, player.z - target.z) < 1.2;
    player.moving = len > 0.1;
    if (near !== lastNear.current) {
      lastNear.current = near;
      player.near = near;
      onNear(near);
    }
    // The beat always wins; optional things only offer themselves when the beat isn't in reach.
    let item: string | null = null;
    if (!near && onItem) {
      let best = Infinity;
      for (const it of items) {
        const d = Math.hypot(player.x - it.x, player.z - it.z);
        if (d < it.r && d < best) {
          best = d;
          item = it.id;
        }
      }
    }
    if (item !== lastItem.current) {
      lastItem.current = item;
      onItem?.(item);
    }
  });
  return null;
}

/** Posters and signs for a set, hung on the tower's walls. */
export function Decor({ set }: { set: RoomSet }) {
  if (!set.decor?.length) return null;
  return (
    <group>
      {set.decor.map((d) => (
        <mesh key={d.file} position={[d.x, d.y, d.z]} rotation={[0, d.face, 0]}>
          <planeGeometry args={[d.w, d.h]} />
          <meshStandardMaterial map={loadTexture(d.file)} roughness={0.8} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
    </group>
  );
}

const FIND_SIZE: Record<Find["kind"], [number, number, string, string]> = {
  sticky: [0.075, 0.075, "#f3dc5a", "#2a2410"],
  badge: [0.086, 0.054, "#f4f1ea", "#18202c"],
  paper: [0.21, 0.297, "#f2efe8", "#1d1d1d"],
  usb: [0.055, 0.02, "#1f6fd1", "#ffffff"],
  tablet: [0.24, 0.17, "#0f1824", "#d8e6f5"],
  flyer: [0.21, 0.297, "#ffe14a", "#151515"],
  board: [0.42, 0.2, "#fbfbf8", "#1f4fa8"],
};

/** A small security slip-up placed in the room. Glints now and then until it's found. */
export function FindProp({ find, found }: { find: Find; found: boolean }) {
  const glint = useRef<THREE.Mesh>(null);
  const [w, h, bg, fg] = FIND_SIZE[find.kind];
  const big = 1;
  const tex = useMemo(() => {
    const scale = find.kind === "usb" ? 256 : 512;
    return textTexture(find.text, Math.round(scale * (w / Math.max(w, h))), Math.round(scale * (h / Math.max(w, h))), bg, fg);
  }, [find, w, h, bg, fg]);
  useFrame(({ clock }) => {
    if (!glint.current) return;
    const t = (clock.elapsedTime + find.x) % 2.6;
    const k = found ? 0 : t < 0.6 ? Math.sin((t / 0.6) * Math.PI) : 0;
    glint.current.scale.setScalar(0.6 + k * 1.6);
    (glint.current.material as THREE.MeshBasicMaterial).opacity = k;
  });
  const pw = w * big;
  const ph = h * big;
  return (
    <group position={[find.x, find.y, find.z]} rotation={[0, find.face ?? 0, 0]}>
      <group rotation={[find.flat ? -Math.PI / 2 : 0, 0, 0]}>
        {find.kind === "usb" ? (
          <mesh position={[0, 0, 0.006]}>
            <boxGeometry args={[pw, ph, 0.012]} />
            <meshStandardMaterial map={tex} roughness={0.5} />
          </mesh>
        ) : (
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[pw, ph]} />
            <meshStandardMaterial
              map={tex}
              roughness={0.8}
              side={THREE.DoubleSide}
              emissive="#ffffff"
              emissiveMap={tex}
              emissiveIntensity={find.kind === "tablet" ? 0.9 : 0.12}
            />
          </mesh>
        )}
        <mesh ref={glint} position={[pw * 0.3, ph * 0.3, 0.02]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshBasicMaterial map={sparkTexture()} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

let spark: THREE.Texture | null = null;
function sparkTexture(): THREE.Texture {
  if (spark) return spark;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,240,200,0.6)");
  g.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(30, 4, 4, 56);
  ctx.fillRect(4, 30, 56, 4);
  spark = new THREE.CanvasTexture(c);
  return spark;
}

/** A quick ring of light where the player just poked something. Remount with a new key to replay. */
export function Poke({ x, y, z }: { x: number; y: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const born = useRef<number | null>(null);
  useFrame(({ clock, camera }) => {
    const m = ref.current;
    if (!m) return;
    born.current ??= clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - born.current) / 0.7);
    m.quaternion.copy(camera.quaternion);
    m.scale.setScalar(0.15 + k * 0.5);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
  });
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <ringGeometry args={[0.8, 1, 40]} />
      <meshBasicMaterial color="#e7c48a" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

/** A red warning pulse where something just went wrong: three beats over about two seconds. */
export function Alarm({ x, y, z }: { x: number; y: number; z: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const born = useRef<number | null>(null);
  useFrame(({ clock, camera }) => {
    born.current ??= clock.elapsedTime;
    const t = clock.elapsedTime - born.current;
    const alive = t < 2.4;
    const beat = alive ? Math.max(0, Math.sin((t / 0.8) * Math.PI * 2 - Math.PI / 2)) : 0;
    const fade = alive ? 1 - t / 2.4 : 0;
    if (ring.current) {
      ring.current.quaternion.copy(camera.quaternion);
      ring.current.scale.setScalar(0.25 + ((t % 0.8) / 0.8) * 0.45);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * fade * (1 - (t % 0.8) / 0.8);
    }
    if (glow.current) {
      glow.current.quaternion.copy(camera.quaternion);
      (glow.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * beat * fade;
    }
  });
  return (
    <group position={[x, y, z]}>
      <mesh ref={glow}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={glowTexture()} color="#ff2a1a" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.85, 1, 40]} />
        <meshBasicMaterial color="#ff3b2b" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

let glowTex: THREE.Texture | null = null;
function glowTexture(): THREE.Texture {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

const SHEETS = 12;
/** Sheets of paper thrown out of something and fluttering to the floor. */
/** dir: the way they fly, radians in the floor plane (cos → x, sin → z). Defaults to +Z, out into the room. */
export function Papers({ x, y, z, floor, dir = Math.PI / 2 }: { x: number; y: number; z: number; floor: number; dir?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const born = useRef<number | null>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: SHEETS }, (_, i) => ({
        a: dir + (i / (SHEETS - 1) - 0.5) * 2.0 + Math.sin(i * 7.3) * 0.15,
        v: 0.6 + ((i * 53) % 10) / 12,
        up: 1.4 + ((i * 31) % 10) / 8,
        spin: 2 + (i % 5),
        delay: i * 0.07,
      })),
    [dir],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    born.current ??= clock.elapsedTime;
    const t0 = clock.elapsedTime - born.current;
    for (let i = 0; i < SHEETS; i += 1) {
      const s = seeds.at(i)!;
      const t = Math.max(0, t0 - s.delay);
      // Thrown up and out, then a slow flutter down with drag; rests on the floor.
      const out = s.v * (1 - Math.exp(-t * 1.6));
      const h = y + s.up * t - 2.2 * t * t * 0.5;
      const py = Math.max(floor + 0.004, h - Math.max(0, t - 0.6) * 0.35);
      dummy.position.set(x + Math.cos(s.a) * out, t0 < s.delay ? -999 : py, z + Math.sin(s.a) * out);
      const landed = py <= floor + 0.005;
      dummy.rotation.set(landed ? -Math.PI / 2 : Math.sin(t * s.spin) * 1.2, s.a + t * s.spin * 0.6, landed ? 0 : Math.cos(t * s.spin) * 0.8);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SHEETS]}>
      <planeGeometry args={[0.21, 0.297]} />
      <meshStandardMaterial color="#f2efe8" roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** A small gold dot over each thing you can poke, shown when you're near and until you've poked it. */
export function ToyDots({
  toys,
  poked,
  player: who,
}: {
  toys: { id: string; x: number; y: number; z: number }[];
  poked: Record<string, number | true>;
  player: () => { x: number; z: number; y?: number };
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock, camera }) => {
    const m = mesh.current;
    if (!m) return;
    const p = who();
    toys.forEach((t, i) => {
      const d = Math.hypot(p.x - t.x, p.z - t.z);
      const level = p.y === undefined || Math.abs(t.y - p.y) < 3.2;
      const show = !poked[t.id] && d < 6.5 && level;
      const near = THREE.MathUtils.clamp((6.5 - d) / 2.5, 0, 1);
      dummy.position.set(t.x, t.y + 0.55 + Math.sin(clock.elapsedTime * 2.2 + i) * 0.04, t.z);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(show ? 1 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const a = show ? 0.35 + 0.55 * near : 0;
      m.setColorAt(i, col.setRGB(0.91 * a, 0.77 * a, 0.54 * a));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    if (!m.userData.colored) {
      m.userData.colored = true;
      (m.material as THREE.Material).needsUpdate = true;
    }
  });
  if (!toys.length) return null;
  return (
    <instancedMesh key={toys.length} ref={mesh} args={[undefined, undefined, toys.length]}>
      <planeGeometry args={[0.11, 0.11]} />
      <meshBasicMaterial map={sparkTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </instancedMesh>
  );
}
