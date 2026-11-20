import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { blip } from "@/game/audio";
import { detailBoxes, floorMood, walker, OFFICE_Y } from "@/game/layout";

/**
 * Floor 14 set dressing, drawn in code on top of the modeled and baked floor. Shared by Monday and every
 * week shift on this floor. Five passes: the desks, the walls, floor furniture, the kitchenette, and the
 * ceiling plus the things that move. Coordinates are tower world coordinates (floor at y = 50.6).
 *
 * Surfaces (measured from the model): pod desks 51.34, your desk 51.34, island 51.62, back counter 51.52,
 * ceiling underside about 53.6. Furniture that stands on the floor registers a collision box.
 */

const F = OFFICE_Y;
const DESK = 51.34;
const ISLAND = 51.62;
const COUNTER = 51.52;
const CEIL = 53.6;

/* ------------------------------------------------------------------ shared geometry and materials */

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24);
const CONE = new THREE.CylinderGeometry(0.55, 1, 1, 24, 1, true);
const SPH = new THREE.SphereGeometry(1, 20, 14);
const PLANE = new THREE.PlaneGeometry(1, 1);
const TORUS = new THREE.TorusGeometry(1, 0.06, 8, 32);

const mats = new Map<string, THREE.Material>();
function mat(color: string, rough = 0.7, metal = 0, glow?: string, glowK = 1): THREE.Material {
  const key = `${color}|${rough}|${metal}|${glow ?? ""}|${glowK}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive: glow ?? "#000000", emissiveIntensity: glow ? glowK : 0 });
    mats.set(key, m);
  }
  return m;
}
const lit = (color: string) => {
  const key = `basic|${color}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    mats.set(key, m);
  }
  return m;
};

type V3 = [number, number, number];
type BProps = { p: V3; s: V3; c: string; r?: number; m?: number; rot?: V3; glow?: string; k?: number; basic?: boolean };

/** A box by centre and size. */
function B({ p, s, c, r = 0.7, m = 0, rot, glow, k, basic }: BProps) {
  return <mesh geometry={BOX} material={basic ? lit(c) : mat(c, r, m, glow, k)} position={p} scale={s} rotation={rot} />;
}
/** A box standing on a surface: y is the surface, h the height. */
function On({
  x,
  y,
  z,
  w,
  h,
  d,
  c,
  r,
  m,
  ry = 0,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  c: string;
  r?: number;
  m?: number;
  ry?: number;
}) {
  return <B p={[x, y + h / 2, z]} s={[w, h, d]} c={c} r={r} m={m} rot={[0, ry, 0]} />;
}
/** A cylinder standing on y. */
function Cyl({
  x,
  y,
  z,
  rad,
  h,
  c,
  r = 0.6,
  m = 0,
  glow,
  k,
}: {
  x: number;
  y: number;
  z: number;
  rad: number;
  h: number;
  c: string;
  r?: number;
  m?: number;
  glow?: string;
  k?: number;
}) {
  return <mesh geometry={CYL} material={mat(c, r, m, glow, k)} position={[x, y + h / 2, z]} scale={[rad, h, rad]} />;
}

function solid(minX: number, maxX: number, minZ: number, maxZ: number, h: number) {
  return { minX, maxX, minZ, maxZ, minY: F, maxY: F + h };
}

/* ------------------------------------------------------------------ canvas art */

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function redraw(t: THREE.CanvasTexture, draw: (g: CanvasRenderingContext2D) => void) {
  const c = t.image as HTMLCanvasElement;
  draw(c.getContext("2d")!);
  t.needsUpdate = true;
}

const HAND = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive";

/** The west-wall whiteboard: the night shift's handoff, and a counter that resets when someone slips. */
function drawWhiteboard(g: CanvasRenderingContext2D, slips: number) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#f4f5f2";
  g.fillRect(0, 0, W, H);
  // ghosting from old marker
  g.fillStyle = "rgba(120,130,140,0.06)";
  for (let i = 0; i < 14; i++) g.fillRect((i * 97) % W, (i * 53) % H, 160, 22);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.fillStyle = "#1f3f8a";
  g.font = `bold 46px ${HAND}`;
  g.fillText("NIGHT SHIFT HANDOFF", 34, 64);
  g.strokeStyle = "#1f3f8a";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(34, 78);
  g.lineTo(520, 74);
  g.stroke();
  g.font = `30px ${HAND}`;
  g.fillStyle = "#222";
  const items = [
    "Lock your screen (Win + L)",
    "Badge in. Every door. Every time.",
    "Weird email? Report it, don't reply",
    "Vendor bank change = call them back",
    "Shred bin, not recycling",
  ];
  items.forEach((t, i) => {
    const y = 128 + i * 46;
    g.strokeStyle = "#2a7a3a";
    g.lineWidth = 4;
    g.strokeRect(36, y - 24, 24, 24);
    if (i < 2) {
      g.beginPath();
      g.moveTo(40, y - 12);
      g.lineTo(48, y - 3);
      g.lineTo(64, y - 30);
      g.stroke();
    }
    g.fillStyle = "#222";
    g.fillText(t, 74, y);
  });
  // the counter
  g.fillStyle = "#b3261e";
  g.font = `28px ${HAND}`;
  g.fillText("Days since someone", 640, 120);
  g.fillText("took the bait:", 640, 154);
  g.strokeStyle = "#b3261e";
  g.lineWidth = 5;
  g.strokeRect(700, 176, 170, 120);
  g.font = `bold 92px ${HAND}`;
  if (slips > 0) {
    g.fillStyle = "rgba(179,38,30,0.5)";
    g.fillText("12", 726, 270);
    g.strokeStyle = "#b3261e";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(712, 200);
    g.lineTo(860, 280);
    g.moveTo(712, 280);
    g.lineTo(860, 200);
    g.stroke();
    g.fillStyle = "#b3261e";
    g.font = `bold 86px ${HAND}`;
    g.fillText("0", 890, 268);
    g.font = `24px ${HAND}`;
    g.fillText(slips > 1 ? `(${slips} tonight...)` : "(...tonight)", 700, 330);
  } else {
    g.fillStyle = "#b3261e";
    g.fillText("12", 726, 270);
  }
  // doodle: a fish hook and a fish that didn't bite
  g.strokeStyle = "#1f3f8a";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(980, 60);
  g.lineTo(980, 200);
  g.arc(960, 200, 20, 0, Math.PI, false);
  g.stroke();
  g.beginPath();
  g.ellipse(1040, 250, 46, 22, 0, 0, Math.PI * 2);
  g.moveTo(1086, 250);
  g.lineTo(1110, 232);
  g.lineTo(1110, 268);
  g.closePath();
  g.stroke();
  g.fillStyle = "#1f3f8a";
  g.font = `22px ${HAND}`;
  g.fillText("don't bite", 1000, 300);
  g.fillStyle = "#555";
  g.font = `22px ${HAND}`;
  g.fillText("IT is ext 4100. Not the number in the email.", 36, 390);
  g.fillText("- J.", 980, 390);
  // tray shadow
  g.fillStyle = "rgba(0,0,0,0.08)";
  g.fillRect(0, H - 10, W, 10);
}

function drawMural(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d2238");
  bg.addColorStop(1, "#14324f");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // lat/long grid
  g.strokeStyle = "rgba(160,200,230,0.08)";
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  // stylised coastlines
  g.fillStyle = "#1c4466";
  const blob = (pts: number[][]) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)));
    g.closePath();
    g.fill();
  };
  blob([
    [0.05, 0.2],
    [0.27, 0.12],
    [0.33, 0.3],
    [0.28, 0.55],
    [0.2, 0.62],
    [0.12, 0.48],
    [0.06, 0.35],
  ]);
  blob([
    [0.25, 0.62],
    [0.32, 0.66],
    [0.3, 0.9],
    [0.24, 0.86],
  ]);
  blob([
    [0.44, 0.15],
    [0.58, 0.1],
    [0.6, 0.3],
    [0.52, 0.42],
    [0.46, 0.34],
  ]);
  blob([
    [0.48, 0.45],
    [0.58, 0.44],
    [0.6, 0.72],
    [0.52, 0.8],
    [0.47, 0.6],
  ]);
  blob([
    [0.6, 0.12],
    [0.9, 0.1],
    [0.95, 0.3],
    [0.82, 0.48],
    [0.68, 0.4],
    [0.62, 0.28],
  ]);
  blob([
    [0.82, 0.66],
    [0.94, 0.66],
    [0.95, 0.8],
    [0.84, 0.8],
  ]);
  const ports: [number, number, string][] = [
    [0.22, 0.36, "Harbor HQ"],
    [0.14, 0.3, "Seattle"],
    [0.29, 0.6, "Savannah"],
    [0.5, 0.26, "Rotterdam"],
    [0.55, 0.62, "Durban"],
    [0.86, 0.36, "Busan"],
    [0.79, 0.44, "Singapore"],
    [0.9, 0.74, "Sydney"],
  ];
  const hq = ports[0];
  g.lineWidth = 3;
  for (const pt of ports.slice(1)) {
    const x0 = hq[0] * W;
    const y0 = hq[1] * H;
    const x1 = pt[0] * W;
    const y1 = pt[1] * H;
    const grad = g.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, "rgba(196,165,116,0.9)");
    grad.addColorStop(1, "rgba(127,214,168,0.7)");
    g.strokeStyle = grad;
    g.setLineDash([10, 8]);
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 90, x1, y1);
    g.stroke();
  }
  g.setLineDash([]);
  g.font = "600 22px system-ui, sans-serif";
  for (const [x, y, name] of ports) {
    const big = name === "Harbor HQ";
    g.fillStyle = big ? "#f0d29a" : "#9fe3c0";
    g.beginPath();
    g.arc(x * W, y * H, big ? 9 : 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(240,236,226,0.9)";
    g.fillText(name, x * W + 12, y * H - 10);
  }
  g.fillStyle = "#f0ece2";
  g.font = "700 52px Georgia, serif";
  g.fillText("Harbor & Co.", 40, H - 86);
  g.font = "26px system-ui, sans-serif";
  g.fillStyle = "rgba(240,236,226,0.75)";
  g.fillText("Moving freight since 1962  ·  41 ports  ·  every one of them counts on floor 14", 42, H - 44);
}

function drawPhoto(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#d9c7a4");
  sky.addColorStop(0.6, "#bfa47c");
  sky.addColorStop(1, "#7d6646");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#5e4b33";
  g.fillRect(0, H * 0.68, W, H * 0.32);
  // cranes and a ship
  g.strokeStyle = "#3e3022";
  g.lineWidth = 5;
  for (const x of [70, 190]) {
    g.beginPath();
    g.moveTo(x, H * 0.68);
    g.lineTo(x, H * 0.18);
    g.lineTo(x + 110, H * 0.18);
    g.moveTo(x, H * 0.3);
    g.lineTo(x + 90, H * 0.18);
    g.moveTo(x + 80, H * 0.18);
    g.lineTo(x + 80, H * 0.45);
    g.stroke();
  }
  g.fillStyle = "#3e3022";
  g.beginPath();
  g.moveTo(250, H * 0.62);
  g.lineTo(480, H * 0.62);
  g.lineTo(455, H * 0.72);
  g.lineTo(270, H * 0.72);
  g.closePath();
  g.fill();
  g.fillRect(300, H * 0.5, 50, H * 0.12);
  g.fillRect(360, H * 0.54, 80, H * 0.08);
  g.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 400; i++) g.fillRect((i * 37) % W, (i * 91) % H, 1, 1);
  g.fillStyle = "#2c2116";
  g.font = "italic 22px Georgia, serif";
  g.fillText("Pier 4, opening day · 1962", 18, H - 16);
}

function drawDirectory(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#1b1f26";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#c4a574";
  g.font = "700 120px system-ui, sans-serif";
  g.fillText("14", 36, 136);
  g.fillStyle = "#f0ece2";
  g.font = "600 34px system-ui, sans-serif";
  g.fillText("Harbor & Co.", 210, 76);
  g.font = "26px system-ui, sans-serif";
  g.fillStyle = "#a8a59c";
  g.fillText("Operations · Finance · IT", 210, 118);
  g.strokeStyle = "rgba(255,255,255,0.12)";
  g.beginPath();
  g.moveTo(36, 170);
  g.lineTo(W - 36, 170);
  g.stroke();
  const rows = [
    ["Desks · Your desk", "→"],
    ["Meeting room · IT room", "←"],
    ["Kitchen · Lounge", "←"],
    ["Print & shred", "←"],
  ];
  g.font = "26px system-ui, sans-serif";
  rows.forEach(([t, a], i) => {
    g.fillStyle = "#f0ece2";
    g.fillText(t, 40, 222 + i * 46);
    g.fillStyle = "#c4a574";
    g.fillText(a, W - 70, 222 + i * 46);
  });
}

function drawHangingSign(g: CanvasRenderingContext2D, left: string, right: string) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#1b1f26";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#c4a574";
  g.fillRect(0, H - 8, W, 8);
  g.fillStyle = "#f0ece2";
  g.font = "600 46px system-ui, sans-serif";
  g.textBaseline = "middle";
  g.fillText(left, 30, H / 2 - 2);
  const w = g.measureText(right).width;
  g.fillText(right, W - 30 - w, H / 2 - 2);
}

/** Night-ops wall TV. Redrawn once a second; `t` is seconds since the floor loaded. */
function drawDashboard(g: CanvasRenderingContext2D, t: number, slips: number) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#0b1118";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#7fd6a8";
  g.font = "600 26px system-ui, sans-serif";
  g.fillText("NIGHT OPS · FLOOR 14", 28, 44);
  g.fillStyle = "#a8a59c";
  g.font = "20px system-ui, sans-serif";
  const shipped = 1284 + Math.floor(t / 7);
  g.fillText(`Containers moved tonight`, 28, 92);
  g.fillStyle = "#f0ece2";
  g.font = "700 64px system-ui, sans-serif";
  g.fillText(shipped.toLocaleString("en-US"), 28, 158);
  // sparkline
  g.strokeStyle = "#c4a574";
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i < 40; i++) {
    const x = 28 + i * 9;
    const y = 230 - (Math.sin(i * 0.5 + t * 0.3) * 0.5 + 0.5) * 40 - i * 0.6;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
  // status column
  const ok = slips === 0;
  const rows: [string, string, string][] = [
    ["Gate scanners", "OK", "#7fd6a8"],
    ["Vessel feed", "OK", "#7fd6a8"],
    ["Phishing reports", `${3 + Math.floor(t / 90)}`, "#c4a574"],
    ["Security alerts", ok ? "0" : `${slips}`, ok ? "#7fd6a8" : "#ff7a66"],
  ];
  g.font = "20px system-ui, sans-serif";
  rows.forEach(([k, v, c], i) => {
    const y = 92 + i * 44;
    g.fillStyle = "#a8a59c";
    g.fillText(k, 450, y);
    g.fillStyle = c;
    g.fillText(v, W - 60, y);
  });
  // ticker
  const msg =
    "   Reminder: IT will never ask for your password or an MFA code   ·   Badge every door   ·   Report odd emails with the button   ·   Coffee machine descaled Tuesday   ";
  g.fillStyle = "#141c26";
  g.fillRect(0, H - 46, W, 46);
  g.fillStyle = "#f0ece2";
  g.font = "20px system-ui, sans-serif";
  const span = g.measureText(msg).width;
  const off = (t * 70) % span;
  g.fillText(msg + msg, -off, H - 16);
}

function drawRug(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#3a4552";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "#c4a574";
  g.lineWidth = 10;
  g.strokeRect(24, 24, W - 48, H - 48);
  g.strokeStyle = "rgba(240,236,226,0.25)";
  g.lineWidth = 4;
  g.strokeRect(48, 48, W - 96, H - 96);
  g.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 2000; i++) g.fillRect((i * 53) % W, (i * 29) % H, 2, 2);
}

function drawNote(g: CanvasRenderingContext2D, text: string[], bg: string) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#222";
  g.font = `bold 30px ${HAND}`;
  text.forEach((t, i) => g.fillText(t, 16, 44 + i * 38));
}

function drawGrille(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  g.fillStyle = "#c9ccd0";
  g.fillRect(0, 0, W, W);
  g.fillStyle = "#4d5359";
  for (let i = 1; i < 12; i++) g.fillRect(8, i * (W / 12) - 3, W - 16, 6);
}

/* ------------------------------------------------------------------ pass 1: the desks */

type DeskSpot = { x: number; near: number; dir: 1 | -1 };
// Pod desks (x centre, near edge where the sitter is, and which way the sitter faces).
const PODS: Record<string, DeskSpot> = {
  d03: { x: -6.3, near: -8.0, dir: 1 },
  d04: { x: -4.7, near: -8.0, dir: 1 },
  d01: { x: -6.3, near: -6.82, dir: -1 },
  d02: { x: -4.7, near: -6.82, dir: -1 },
  d07: { x: 2.5, near: -8.0, dir: 1 },
  d08: { x: 4.1, near: -8.0, dir: 1 },
  d05: { x: 2.5, near: -6.82, dir: -1 },
  d06: { x: 4.1, near: -6.82, dir: -1 },
};

function Mug({ x, z, c = "#e8e2d6", y = DESK }: { x: number; z: number; c?: string; y?: number }) {
  return (
    <group>
      <Cyl x={x} y={y} z={z} rad={0.04} h={0.095} c={c} r={0.35} />
      <mesh geometry={TORUS} material={mat(c, 0.35)} position={[x + 0.045, y + 0.05, z]} scale={[0.025, 0.025, 0.025]} />
      <Cyl x={x} y={y + 0.08} z={z} rad={0.034} h={0.005} c="#3b2416" r={0.2} />
    </group>
  );
}

function Lamp({ x, z, y = DESK, ry = 0 }: { x: number; z: number; y?: number; ry?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <Cyl x={0} y={0} z={0} rad={0.07} h={0.02} c="#22252b" m={0.5} r={0.4} />
      <B p={[0, 0.2, 0]} s={[0.018, 0.38, 0.018]} c="#22252b" m={0.5} r={0.4} />
      <B p={[0, 0.38, 0.1]} s={[0.018, 0.018, 0.22]} c="#22252b" m={0.5} r={0.4} />
      <mesh geometry={CONE} material={mat("#22252b", 0.4, 0.5)} position={[0, 0.34, 0.2]} scale={[0.06, 0.08, 0.06]} />
      <mesh geometry={SPH} material={lit("#ffe2b0")} position={[0, 0.3, 0.2]} scale={[0.03, 0.03, 0.03]} />
    </group>
  );
}

function Plant({ x, z, y = DESK, s = 1 }: { x: number; z: number; y?: number; s?: number }) {
  return (
    <group position={[x, y, z]} scale={s}>
      <Cyl x={0} y={0} z={0} rad={0.055} h={0.09} c="#d9d4c8" r={0.8} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          geometry={SPH}
          material={mat(i % 2 ? "#2f6b3a" : "#3c7f47", 0.8)}
          position={[Math.cos(i) * 0.03, 0.14 + (i % 3) * 0.02, Math.sin(i) * 0.03]}
          scale={[0.035, 0.07, 0.035]}
          rotation={[Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5]}
        />
      ))}
    </group>
  );
}

function Headset({ x, z, y = DESK }: { x: number; z: number; y?: number }) {
  return (
    <group position={[x, y + 0.02, z]} rotation={[Math.PI / 2, 0, 0.4]}>
      <mesh geometry={TORUS} material={mat("#1b1d22", 0.5)} scale={[0.08, 0.08, 0.3]} />
      <mesh geometry={SPH} material={mat("#2a2d33", 0.6)} position={[0.08, 0, 0]} scale={[0.035, 0.035, 0.02]} />
      <mesh geometry={SPH} material={mat("#2a2d33", 0.6)} position={[-0.08, 0, 0]} scale={[0.035, 0.035, 0.02]} />
    </group>
  );
}

function Folders({ x, z, y = DESK, ry = 0.1 }: { x: number; z: number; y?: number; ry?: number }) {
  const cols = ["#3d6fa8", "#c4a574", "#e9e4d8", "#7a3b3b"];
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      {cols.map((c, i) => (
        <B key={c} p={[(i % 2) * 0.008, 0.006 + i * 0.012, (i % 3) * 0.006]} s={[0.24, 0.011, 0.31]} c={c} r={0.85} />
      ))}
    </group>
  );
}

function Frame({ x, z, y = DESK, ry = 0 }: { x: number; z: number; y?: number; ry?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <B p={[0, 0.07, 0]} s={[0.12, 0.15, 0.012]} c="#2b2b2b" r={0.5} />
      <B p={[0, 0.07, 0.007]} s={[0.1, 0.12, 0.002]} c="#9fb6c8" r={0.3} />
      <B p={[0, 0.04, -0.03]} s={[0.01, 0.08, 0.05]} c="#2b2b2b" rot={[0.5, 0, 0]} />
    </group>
  );
}

function Bottle({ x, z, y = DESK }: { x: number; z: number; y?: number }) {
  return (
    <group>
      <Cyl x={x} y={y} z={z} rad={0.035} h={0.2} c="#4f88b8" r={0.25} m={0.6} />
      <Cyl x={x} y={y + 0.2} z={z} rad={0.022} h={0.03} c="#1b1d22" />
    </group>
  );
}

function PenCup({ x, z, y = DESK }: { x: number; z: number; y?: number }) {
  return (
    <group>
      <Cyl x={x} y={y} z={z} rad={0.035} h={0.09} c="#30343b" r={0.5} />
      {["#1f3f8a", "#b3261e", "#111", "#2a7a3a"].map((c, i) => (
        <B
          key={c}
          p={[x + Math.cos(i * 1.6) * 0.012, y + 0.12, z + Math.sin(i * 1.6) * 0.012]}
          s={[0.008, 0.11, 0.008]}
          c={c}
          rot={[Math.cos(i) * 0.15, 0, Math.sin(i) * 0.15]}
        />
      ))}
    </group>
  );
}

function Desks() {
  const d = PODS;
  // The -x side of every desk is free; the model's own clutter sits on the +x side.
  return (
    <group>
      <Mug x={d.d03.x - 0.58} z={d.d03.near + 0.08} />
      <Lamp x={d.d03.x - 0.58} z={d.d03.near + 0.36} ry={Math.PI} />
      <Plant x={d.d04.x - 0.58} z={d.d04.near + 0.34} />
      <Headset x={d.d04.x - 0.55} z={d.d04.near + 0.1} />
      <Bottle x={d.d01.x - 0.6} z={d.d01.near - 0.08} />
      <Folders x={d.d01.x - 0.56} z={d.d01.near - 0.3} />
      <Mug x={d.d02.x - 0.58} z={d.d02.near - 0.08} c="#b3261e" />
      <Frame x={d.d02.x - 0.6} z={d.d02.near - 0.32} ry={0.4} />
      <Lamp x={d.d07.x - 0.58} z={d.d07.near + 0.36} ry={Math.PI} />
      <Mug x={d.d07.x - 0.6} z={d.d07.near + 0.08} c="#1f3f8a" />
      <Folders x={d.d08.x - 0.5} z={d.d08.near + 0.44} ry={-0.2} />
      <Plant x={d.d05.x - 0.58} z={d.d05.near - 0.34} />
      <Mug x={d.d05.x - 0.6} z={d.d05.near - 0.08} />
      <Headset x={d.d06.x - 0.55} z={d.d06.near - 0.1} />
      <PenCup x={d.d06.x - 0.62} z={d.d06.near - 0.32} />
      {/* your desk: a pen cup and a photo, clear of the phone, the paper and the monitor */}
      <PenCup x={-6.52} z={-1.48} />
      <Frame x={-5.05} z={-1.45} ry={-0.5} />
    </group>
  );
}

/* ------------------------------------------------------------------ pass 2: the walls */

function Clock({ x, y, z, ry }: { x: number; y: number; z: number; ry: number }) {
  const hour = useRef<THREE.Group>(null);
  const min = useRef<THREE.Group>(null);
  const sec = useRef<THREE.Group>(null);
  const start = useMemo(() => performance.now(), []);
  useFrame(() => {
    // Night shift time: 9:47 pm when the floor loads, running in real time.
    const s = 21 * 3600 + 47 * 60 + (performance.now() - start) / 1000;
    if (sec.current) sec.current.rotation.z = -((s % 60) / 60) * Math.PI * 2;
    if (min.current) min.current.rotation.z = -(((s / 60) % 60) / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(((s / 3600) % 12) / 12) * Math.PI * 2;
  });
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh geometry={CYL} material={mat("#1b1d22", 0.4, 0.3)} rotation={[Math.PI / 2, 0, 0]} scale={[0.19, 0.04, 0.19]} />
      <mesh geometry={CYL} material={mat("#f4f1ea", 0.6)} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.021]} scale={[0.172, 0.002, 0.172]} />
      {Array.from({ length: 12 }, (_, i) => (
        <B
          key={i}
          p={[Math.sin((i / 12) * Math.PI * 2) * 0.15, Math.cos((i / 12) * Math.PI * 2) * 0.15, 0.024]}
          s={[0.008, i % 3 ? 0.018 : 0.032, 0.002]}
          c="#1b1d22"
          rot={[0, 0, -(i / 12) * Math.PI * 2]}
        />
      ))}
      <group ref={hour} position={[0, 0, 0.026]}>
        <B p={[0, 0.045, 0]} s={[0.012, 0.09, 0.003]} c="#1b1d22" />
      </group>
      <group ref={min} position={[0, 0, 0.029]}>
        <B p={[0, 0.065, 0]} s={[0.008, 0.13, 0.003]} c="#1b1d22" />
      </group>
      <group ref={sec} position={[0, 0, 0.032]}>
        <B p={[0, 0.055, 0]} s={[0.003, 0.14, 0.002]} c="#b3261e" />
      </group>
    </group>
  );
}

function Walls() {
  const board = useMemo(() => canvasTexture(1200, 600, (g) => drawWhiteboard(g, 0)), []);
  const mural = useMemo(() => canvasTexture(1400, 680, drawMural), []);
  const photo = useMemo(() => canvasTexture(512, 360, drawPhoto), []);
  const dir = useMemo(() => canvasTexture(640, 400, drawDirectory), []);
  const tv = useMemo(() => canvasTexture(800, 450, (g) => drawDashboard(g, 0, 0)), []);
  const seen = useRef({ slips: -1, tick: -1 });
  const start = useMemo(() => performance.now(), []);
  useFrame(() => {
    if (floorMood.slips !== seen.current.slips) {
      seen.current.slips = floorMood.slips;
      redraw(board, (g) => drawWhiteboard(g, floorMood.slips));
    }
    const t = (performance.now() - start) / 1000;
    const tick = Math.floor(t * 4);
    if (tick !== seen.current.tick) {
      seen.current.tick = tick;
      redraw(tv, (g) => drawDashboard(g, t, floorMood.slips));
    }
  });
  const W = Math.PI / 2;
  return (
    <group>
      {/* west wall: the whiteboard gets the night's handoff written on it */}
      <mesh geometry={PLANE} position={[-9.955, 52.1, -9.2]} rotation={[0, W, 0]} scale={[2.3, 1.15, 1]}>
        <meshStandardMaterial map={board} roughness={0.35} />
      </mesh>
      {/* framed photo from opening day, and the thermostat and switches */}
      <B p={[-9.965, 52.1, -11.45]} s={[0.025, 0.56, 0.76]} c="#2b2219" r={0.5} />
      <mesh geometry={PLANE} position={[-9.95, 52.1, -11.45]} rotation={[0, W, 0]} scale={[0.68, 0.48, 1]}>
        <meshStandardMaterial map={photo} roughness={0.6} />
      </mesh>
      <B p={[-9.975, 51.95, -7.3]} s={[0.02, 0.12, 0.09]} c="#f1efe9" r={0.5} />
      <B p={[-9.962, 51.97, -7.3]} s={[0.002, 0.04, 0.06]} c="#9fe3c0" basic />
      <B p={[-9.975, 51.7, -6.75]} s={[0.012, 0.12, 0.08]} c="#f1efe9" r={0.5} />
      <B p={[-9.966, 51.72, -6.75]} s={[0.006, 0.03, 0.018]} c="#d9d6cf" r={0.5} />
      {/* east wall: the company's routes, and night ops on a TV */}
      <B p={[9.965, 52.15, -3.3]} s={[0.03, 1.42, 2.88]} c="#1b1f26" r={0.4} />
      <mesh geometry={PLANE} position={[9.948, 52.15, -3.3]} rotation={[0, -W, 0]} scale={[2.8, 1.36, 1]}>
        <meshStandardMaterial map={mural} roughness={0.5} emissive="#ffffff" emissiveMap={mural} emissiveIntensity={0.45} />
      </mesh>
      <B p={[9.94, 52.35, -6.1]} s={[0.05, 0.72, 1.24]} c="#0d0f12" r={0.3} m={0.4} />
      <mesh geometry={PLANE} position={[9.913, 52.35, -6.1]} rotation={[0, -W, 0]} scale={[1.16, 0.65, 1]}>
        <meshBasicMaterial map={tv} toneMapped={false} />
      </mesh>
      <Clock x={9.97} y={53.2} z={-11.5} ry={-W} />
      {/* north wall by the elevators: the floor directory */}
      <B p={[-0.25, 52.15, -16.585]} s={[0.74, 0.48, 0.02]} c="#0d0f12" r={0.4} />
      <mesh geometry={PLANE} position={[-0.25, 52.15, -16.573]} scale={[0.7, 0.44, 1]}>
        <meshStandardMaterial map={dir} roughness={0.5} emissive="#ffffff" emissiveMap={dir} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ pass 3: floor furniture */

const FURNITURE = [
  // lounge by the south windows
  solid(5.85, 8.15, -2.1, -1.15, 0.85),
  solid(6.48, 7.52, -3.22, -2.68, 0.45),
  solid(8.35, 9.15, -3.42, -2.58, 0.8),
  solid(5.62, 5.88, -1.52, -1.26, 1.6),
  // east wall: water cooler and filing cabinets
  solid(9.5, 9.92, -7.95, -7.55, 1.3),
  solid(9.36, 9.92, -7.4, -5.75, 1.05),
  // west wall: deliveries
  solid(-9.92, -9.24, -7.85, -6.7, 1),
  // credenza under the west windows
  solid(-3.65, -1.95, -1.37, -0.93, 0.75),
  // the cleaner's cart
  solid(1.55, 2.25, -2.6, -1.4, 1.1),
  // umbrella stand
  solid(-9.82, -9.5, -2.32, -2.0, 0.6),
];

function Sofa() {
  const fabric = "#4a5a6b";
  const cushion = "#56687b";
  return (
    <group>
      <B p={[7.0, F + 0.21, -1.62]} s={[2.2, 0.3, 0.85]} c={fabric} r={0.9} />
      <B p={[7.0, F + 0.55, -1.27]} s={[2.2, 0.62, 0.18]} c={fabric} r={0.9} />
      <B p={[5.95, F + 0.38, -1.62]} s={[0.12, 0.42, 0.85]} c={fabric} r={0.9} />
      <B p={[8.05, F + 0.38, -1.62]} s={[0.12, 0.42, 0.85]} c={fabric} r={0.9} />
      {[6.37, 7.0, 7.63].map((x) => (
        <B key={x} p={[x, F + 0.41, -1.68]} s={[0.6, 0.12, 0.6]} c={cushion} r={0.95} />
      ))}
      <B p={[6.3, F + 0.62, -1.42]} s={[0.4, 0.34, 0.12]} c="#c4a574" r={0.95} rot={[-0.25, 0.25, 0]} />
      {[5.95, 8.05].map((x) => [-1.24, -2.0].map((z) => <B key={`${x}${z}`} p={[x, F + 0.03, z]} s={[0.05, 0.06, 0.05]} c="#1b1d22" m={0.6} r={0.3} />))}
    </group>
  );
}

function CoffeeTable() {
  return (
    <group>
      <B p={[7.0, F + 0.41, -2.95]} s={[1.04, 0.04, 0.54]} c="#6b4a2e" r={0.45} />
      {[6.54, 7.46].map((x) => [-2.72, -3.18].map((z) => <B key={`${x}${z}`} p={[x, F + 0.2, z]} s={[0.04, 0.4, 0.04]} c="#1b1d22" m={0.5} r={0.4} />))}
      <B p={[6.75, F + 0.44, -2.9]} s={[0.24, 0.012, 0.31]} c="#c9d6e0" r={0.6} rot={[0, 0.3, 0]} />
      <B p={[6.78, F + 0.452, -2.92]} s={[0.22, 0.01, 0.29]} c="#e9d6b0" r={0.6} rot={[0, 0.1, 0]} />
      <Plant x={7.28} z={-3.0} y={F + 0.43} s={1.2} />
    </group>
  );
}

function Armchair() {
  const c = "#7a5b45";
  return (
    <group position={[8.75, F, -3.0]} rotation={[0, -Math.PI / 2, 0]}>
      <B p={[0, 0.22, 0]} s={[0.78, 0.3, 0.74]} c={c} r={0.85} />
      <B p={[0, 0.55, -0.32]} s={[0.78, 0.6, 0.14]} c={c} r={0.85} />
      <B p={[-0.35, 0.4, 0]} s={[0.1, 0.32, 0.74]} c={c} r={0.85} />
      <B p={[0.35, 0.4, 0]} s={[0.1, 0.32, 0.74]} c={c} r={0.85} />
      <B p={[0, 0.41, 0.03]} s={[0.58, 0.1, 0.6]} c="#8a6a52" r={0.9} />
    </group>
  );
}

function FloorLamp() {
  return (
    <group position={[5.75, F, -1.39]}>
      <Cyl x={0} y={0} z={0} rad={0.13} h={0.03} c="#1b1d22" m={0.6} r={0.4} />
      <B p={[0, 0.8, 0]} s={[0.025, 1.55, 0.025]} c="#1b1d22" m={0.6} r={0.4} />
      <mesh geometry={CONE} material={mat("#efe2c6", 0.9, 0, "#ffd9a0", 0.6)} position={[0, 1.55, 0]} scale={[0.2, 0.26, 0.2]} />
      <mesh geometry={SPH} material={lit("#fff1d6")} position={[0, 1.5, 0]} scale={[0.05, 0.05, 0.05]} />
    </group>
  );
}

function Rug() {
  const tex = useMemo(() => canvasTexture(512, 400, drawRug), []);
  return (
    <mesh geometry={PLANE} position={[7.1, F + 0.006, -2.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.9, 2.2, 1]}>
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

function Cabinets() {
  return (
    <group>
      {[-7.05, -6.5, -5.95].map((z, i) => (
        <group key={z}>
          <B p={[9.64, F + 0.52, z]} s={[0.56, 1.04, 0.52]} c="#8b9096" m={0.4} r={0.45} />
          {[0.2, 0.52, 0.84].map((y) => (
            <group key={y}>
              <B p={[9.355, F + y, z]} s={[0.01, 0.28, 0.46]} c="#9aa0a6" m={0.4} r={0.4} />
              <B p={[9.345, F + y + 0.08, z]} s={[0.02, 0.02, 0.14]} c="#d0d4d8" m={0.8} r={0.25} />
              <B p={[9.348, F + y + 0.03, z]} s={[0.004, 0.04, 0.09]} c={i === 1 && y === 0.52 ? "#c4a574" : "#f1efe9"} />
            </group>
          ))}
        </group>
      ))}
      <B p={[9.65, F + 1.13, -6.95]} s={[0.3, 0.18, 0.36]} c="#3d6fa8" r={0.8} />
      <Plant x={9.65} z={-6.0} y={F + 1.04} s={1.3} />
    </group>
  );
}

function WaterCooler() {
  const led = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (led.current) (led.current.material as THREE.MeshBasicMaterial).color.setHSL(0.55, 0.9, 0.45 + Math.sin(performance.now() / 600) * 0.12);
  });
  return (
    <group position={[9.71, F, -7.75]}>
      <B p={[0, 0.48, 0]} s={[0.34, 0.96, 0.34]} c="#e9ecef" r={0.5} />
      <B p={[-0.172, 0.82, 0]} s={[0.01, 0.1, 0.22]} c="#c9ccd0" r={0.4} />
      <B p={[-0.18, 0.84, -0.05]} s={[0.03, 0.03, 0.03]} c="#3d6fa8" r={0.3} />
      <B p={[-0.18, 0.84, 0.05]} s={[0.03, 0.03, 0.03]} c="#b3261e" r={0.3} />
      <mesh geometry={CYL} position={[0, 1.13, 0]} scale={[0.14, 0.34, 0.14]}>
        <meshStandardMaterial color="#8ec5ec" roughness={0.05} metalness={0.1} transparent opacity={0.55} />
      </mesh>
      <mesh ref={led} geometry={BOX} position={[-0.172, 0.68, 0]} scale={[0.006, 0.02, 0.02]}>
        <meshBasicMaterial color="#5fb8ff" toneMapped={false} />
      </mesh>
      <Cyl x={0.04} y={0.25} z={0.2} rad={0.035} h={0.24} c="#f4f1ea" r={0.6} />
    </group>
  );
}

function Deliveries() {
  return (
    <group>
      <B p={[-9.58, F + 0.25, -7.45]} s={[0.6, 0.5, 0.58]} c="#b98d5c" r={0.95} />
      <B p={[-9.58, F + 0.251, -7.45]} s={[0.605, 0.06, 0.585]} c="#d6c7a8" r={0.6} />
      <B p={[-9.6, F + 0.68, -7.4]} s={[0.48, 0.36, 0.44]} c="#c29a69" r={0.95} rot={[0, 0.12, 0]} />
      <B p={[-9.55, F + 0.2, -6.95]} s={[0.46, 0.4, 0.42]} c="#b98d5c" r={0.95} rot={[0, -0.08, 0]} />
      <B p={[-9.55, F + 0.43, -6.74]} s={[0.44, 0.02, 0.2]} c="#a87e50" r={0.95} rot={[-0.9, -0.08, 0]} />
      <B p={[-9.29, F + 0.3, -7.45]} s={[0.004, 0.14, 0.2]} c="#f4f1ea" r={0.8} />
    </group>
  );
}

function Credenza() {
  const binders = ["#1f3f8a", "#1f3f8a", "#c4a574", "#2a7a3a", "#7a3b3b", "#30343b"];
  return (
    <group>
      <B p={[-2.8, F + 0.36, -1.15]} s={[1.7, 0.72, 0.44]} c="#5c4632" r={0.55} />
      <B p={[-2.8, F + 0.73, -1.15]} s={[1.72, 0.03, 0.46]} c="#3a2c20" r={0.4} />
      {[-3.35, -2.8, -2.25].map((x) => (
        <B key={x} p={[x, F + 0.38, -1.374]} s={[0.5, 0.6, 0.006]} c="#4e3b2a" r={0.55} />
      ))}
      {binders.map((c, i) => (
        <B key={i} p={[-3.4 + i * 0.075, F + 0.89, -1.12]} s={[0.065, 0.3, 0.26]} c={c} r={0.75} rot={[0, 0, i === 5 ? 0.25 : 0]} />
      ))}
      <Plant x={-2.2} z={-1.12} y={F + 0.745} s={1.6} />
      <Frame x={-2.7} z={-1.06} y={F + 0.745} ry={0.2} />
    </group>
  );
}

function CleaningCart() {
  return (
    <group position={[1.9, F, -2.0]} rotation={[0, 0.22, 0]}>
      <B p={[0, 0.12, 0]} s={[0.56, 0.06, 1.06]} c="#2a2d33" r={0.6} />
      <B p={[0, 0.78, -0.4]} s={[0.56, 0.04, 0.3]} c="#2a2d33" r={0.6} />
      <B p={[0.25, 0.48, -0.4]} s={[0.03, 0.72, 0.03]} c="#9aa0a6" m={0.7} r={0.3} />
      <B p={[-0.25, 0.48, -0.4]} s={[0.03, 0.72, 0.03]} c="#9aa0a6" m={0.7} r={0.3} />
      <Cyl x={0} y={0.15} z={0.22} rad={0.22} h={0.32} c="#e3b52b" r={0.5} />
      <B p={[0, 0.55, -0.4]} s={[0.46, 0.5, 0.26]} c="#e3b52b" r={0.5} />
      <B p={[0.0, 0.56, -0.53]} s={[0.4, 0.42, 0.01]} c="#151515" r={0.7} />
      <B p={[0.12, 0.85, 0.22]} s={[0.025, 1.4, 0.025]} c="#9aa0a6" m={0.6} r={0.3} rot={[0.12, 0, -0.15]} />
      {[-0.15, -0.05].map((x, i) => (
        <group key={x}>
          <Cyl x={x} y={0.8} z={-0.36} rad={0.035} h={0.16} c={i ? "#3d9be0" : "#7fd6a8"} r={0.3} />
          <B p={[x, 1.0, -0.36]} s={[0.03, 0.05, 0.05]} c="#f4f1ea" r={0.5} />
        </group>
      ))}
      {/* wet floor sign, set down beside the cart */}
      <group position={[0.55, 0, 0.25]} rotation={[0, -0.6, 0]}>
        <B p={[0, 0.32, 0.08]} s={[0.3, 0.62, 0.012]} c="#f2c230" r={0.5} rot={[-0.22, 0, 0]} />
        <B p={[0, 0.32, -0.08]} s={[0.3, 0.62, 0.012]} c="#f2c230" r={0.5} rot={[0.22, 0, 0]} />
        <B p={[0, 0.34, 0.153]} s={[0.12, 0.12, 0.002]} c="#151515" rot={[-0.22, 0, Math.PI / 4]} />
      </group>
    </group>
  );
}

function UmbrellaStand() {
  return (
    <group>
      <Cyl x={-9.66} y={F} z={-2.16} rad={0.13} h={0.5} c="#30343b" m={0.6} r={0.35} />
      <B p={[-9.68, F + 0.62, -2.13]} s={[0.018, 0.75, 0.018]} c="#151515" rot={[0.1, 0, 0.08]} />
      <mesh geometry={CONE} material={mat("#1f3f8a", 0.8)} position={[-9.67, F + 0.55, -2.13]} scale={[0.06, 0.45, 0.06]} rotation={[0.1, 0, 0.08]} />
      <mesh geometry={CONE} material={mat("#7a3b3b", 0.8)} position={[-9.62, F + 0.5, -2.2]} scale={[0.055, 0.42, 0.055]} rotation={[-0.12, 0, -0.1]} />
    </group>
  );
}

/* ------------------------------------------------------------------ pass 4: the kitchenette */

function CoffeeMachine() {
  const led = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (led.current) (led.current.material as THREE.MeshBasicMaterial).color.setHSL(0.36, 0.7, 0.35 + Math.abs(Math.sin(performance.now() / 900)) * 0.2);
  });
  // A coffee station cabinet where the coffee machine's poke point already was.
  const y = F + 0.9;
  return (
    <group position={[6.78, 0, -12.3]}>
      <B p={[0, F + 0.45, 0]} s={[0.56, 0.9, 0.62]} c="#6b4a2e" r={0.55} />
      <B p={[0, y + 0.015, 0]} s={[0.6, 0.03, 0.66]} c="#1b1d22" r={0.35} />
      <B p={[0.04, y + 0.23, 0]} s={[0.36, 0.42, 0.3]} c="#141619" m={0.3} r={0.3} />
      <B p={[-0.13, y + 0.36, 0]} s={[0.02, 0.1, 0.22]} c="#22252b" m={0.3} r={0.3} />
      <B p={[-0.13, y + 0.06, 0]} s={[0.1, 0.02, 0.18]} c="#9aa0a6" m={0.8} r={0.2} />
      <B p={[-0.1, y + 0.18, 0]} s={[0.06, 0.04, 0.05]} c="#9aa0a6" m={0.8} r={0.2} />
      <Mug x={-0.1} z={0} y={y + 0.07} c="#f4f1ea" />
      <mesh ref={led} geometry={BOX} position={[-0.142, y + 0.36, 0.06]} scale={[0.004, 0.025, 0.05]}>
        <meshBasicMaterial color="#5ad18a" toneMapped={false} />
      </mesh>
      <B p={[-0.142, y + 0.36, -0.05]} s={[0.004, 0.025, 0.04]} c="#e8e2d6" basic />
      {/* a sleeve of cups and a sugar jar */}
      <Cyl x={0.12} y={y + 0.03} z={0.24} rad={0.04} h={0.16} c="#f4f1ea" r={0.7} />
      <Cyl x={0.12} y={y + 0.03} z={-0.24} rad={0.05} h={0.12} c="#d6dde3" r={0.1} m={0.1} />
    </group>
  );
}

function Kitchen() {
  const fridge = useMemo(() => canvasTexture(256, 220, (g) => drawNote(g, ["PLEASE label", "your food!!", "  - mgmt"], "#fff59a")), []);
  const menu = useMemo(() => canvasTexture(220, 300, (g) => drawNote(g, ["PHO 88", "delivers", "til 2am", "", "ask Dev for", "the code"], "#f4f1ea")), []);
  const micro = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (micro.current) micro.current.visible = Math.floor(performance.now() / 700) % 2 === 0;
  });
  return (
    <group>
      {/* island */}
      <group position={[8.15, ISLAND, -10.36]}>
        <mesh geometry={SPH} material={mat("#e8e2d6", 0.4)} position={[0, 0.03, 0]} scale={[0.15, 0.06, 0.15]} />
        <mesh geometry={SPH} material={mat("#e98a2b", 0.6)} position={[0.04, 0.08, 0.02]} scale={[0.045, 0.045, 0.045]} />
        <mesh geometry={SPH} material={mat("#7cbf4a", 0.5)} position={[-0.05, 0.08, -0.02]} scale={[0.042, 0.042, 0.042]} />
        <mesh geometry={SPH} material={mat("#b3261e", 0.5)} position={[0.0, 0.085, -0.06]} scale={[0.04, 0.04, 0.04]} />
        <mesh geometry={SPH} material={mat("#f2d24b", 0.6)} position={[0.02, 0.1, 0.06]} scale={[0.09, 0.022, 0.025]} rotation={[0, 0.4, 0.3]} />
      </group>
      <B p={[6.66, ISLAND + 0.06, -10.2]} s={[0.12, 0.12, 0.05]} c="#9aa0a6" m={0.7} r={0.3} />
      <B p={[6.66, ISLAND + 0.06, -10.2]} s={[0.1, 0.1, 0.03]} c="#f4f1ea" r={0.9} />
      <Mug x={7.78} z={-10.12} y={ISLAND} c="#1f3f8a" />
      <Mug x={8.5} z={-10.62} y={ISLAND} c="#c4a574" />
      {/* back counter: kettle, dish rack, paper towels */}
      <group position={[9.62, COUNTER, -9.32]}>
        <Cyl x={0} y={0} z={0} rad={0.085} h={0.02} c="#22252b" />
        <Cyl x={0} y={0.02} z={0} rad={0.075} h={0.2} c="#d0d4d8" m={0.8} r={0.25} />
        <B p={[0.0, 0.17, -0.09]} s={[0.025, 0.12, 0.04]} c="#22252b" />
        <B p={[0.0, 0.16, 0.085]} s={[0.02, 0.02, 0.05]} c="#d0d4d8" m={0.8} r={0.25} rot={[0.6, 0, 0]} />
        <B p={[-0.07, 0.01, 0]} s={[0.005, 0.01, 0.01]} c="#ff4a3a" basic />
      </group>
      <group position={[9.62, COUNTER, -11.45]}>
        <B p={[0, 0.01, 0]} s={[0.32, 0.02, 0.42]} c="#9aa0a6" m={0.6} r={0.3} />
        {[-0.12, -0.04, 0.04, 0.12].map((z) => (
          <B key={z} p={[0.0, 0.1, z]} s={[0.24, 0.17, 0.008]} c="#f4f1ea" r={0.3} rot={[0, 0, 0.15]} />
        ))}
        <Mug x={0.08} z={0.15} y={0.02} c="#7fd6a8" />
      </group>
      <group position={[9.62, COUNTER, -9.85]}>
        <Cyl x={0} y={0} z={0} rad={0.06} h={0.02} c="#22252b" />
        <Cyl x={0} y={0.02} z={0} rad={0.055} h={0.26} c="#f4f1ea" r={0.95} />
        <B p={[0, 0.15, 0]} s={[0.01, 0.3, 0.01]} c="#22252b" />
      </group>
      {/* microwave clock blinking 12:00, nobody ever sets it */}
      <mesh ref={micro} geometry={PLANE} position={[9.37, 51.66, -9.98]} rotation={[0, -Math.PI / 2, 0]} scale={[0.07, 0.025, 1]}>
        <meshBasicMaterial color="#5ad18a" toneMapped={false} />
      </mesh>
      {/* fridge door: notes and magnets */}
      <mesh geometry={PLANE} position={[9.585, 51.95, -13.84]} rotation={[0, -Math.PI / 2, 0]} scale={[0.17, 0.15, 1]}>
        <meshStandardMaterial map={fridge} roughness={0.9} />
      </mesh>
      <mesh geometry={PLANE} position={[9.585, 51.62, -13.75]} rotation={[0, -Math.PI / 2, 0.06]} scale={[0.13, 0.18, 1]}>
        <meshStandardMaterial map={menu} roughness={0.9} />
      </mesh>
      {["#b3261e", "#1f3f8a", "#2a7a3a", "#c4a574"].map((c, i) => (
        <mesh
          key={c}
          geometry={CYL}
          material={mat(c, 0.4)}
          position={[9.582, 52.06 - i * 0.18, -13.66 - (i % 2) * 0.24]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.018, 0.012, 0.018]}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ pass 5: ceiling and the things that move */

function Ceiling() {
  const grille = useMemo(() => canvasTexture(128, 128, drawGrille), []);
  const northSign = useMemo(() => canvasTexture(1024, 200, (g) => drawHangingSign(g, "‹ Kitchen · Lounge", "Desks ›")), []);
  const southSign = useMemo(() => canvasTexture(1024, 200, (g) => drawHangingSign(g, "‹ Meeting room · IT", "Elevators ›")), []);
  const sprinklers: [number, number][] = [];
  for (let x = -4.8; x <= 8.2; x += 3.25) for (let z = -14.6; z <= -2.0; z += 3.15) sprinklers.push([x, z]);
  const flicker = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = flicker.current;
    if (!m) return;
    // Mostly steady; every few seconds it stutters, like one tube on its way out.
    const t = performance.now() / 1000;
    const phase = t % 7.3;
    const off = phase > 6.4 && (Math.sin(t * 61) > 0.2 || Math.sin(t * 23) > 0.6);
    (m.material as THREE.MeshBasicMaterial).color.setScalar(off ? 0.35 : 1);
  });
  return (
    <group>
      {sprinklers.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, CEIL, z]}>
          <mesh geometry={CYL} material={mat("#c9ccd0", 0.3, 0.8)} position={[0, -0.006, 0]} scale={[0.03, 0.012, 0.03]} />
          <mesh geometry={CYL} material={mat("#d8b44a", 0.3, 0.8)} position={[0, -0.03, 0]} scale={[0.006, 0.04, 0.006]} />
          <mesh geometry={CYL} material={mat("#c9ccd0", 0.3, 0.8)} position={[0, -0.052, 0]} scale={[0.022, 0.004, 0.022]} />
        </group>
      ))}
      {[
        [-1.6, -7.0],
        [1.6, -12.0],
        [7.0, -5.0],
        [-7.6, -3.6],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} geometry={PLANE} position={[x, CEIL - 0.004, z]} rotation={[Math.PI / 2, 0, 0]} scale={[0.6, 0.6, 1]}>
          <meshStandardMaterial map={grille} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[
        [-2.5, -11.2],
        [3.5, -3.2],
        [-7.5, -8.2],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, CEIL, z]}>
          <mesh geometry={CYL} material={mat("#f1efe9", 0.6)} position={[0, -0.02, 0]} scale={[0.065, 0.035, 0.065]} />
          <B p={[0.03, -0.04, 0]} s={[0.006, 0.004, 0.006]} c="#ff3b2f" basic />
        </group>
      ))}
      {/* hanging wayfinding over the main aisle */}
      <group position={[0.0, 53.12, -10.6]}>
        <B p={[-0.6, 0.27, 0]} s={[0.006, 0.42, 0.006]} c="#9aa0a6" m={0.8} r={0.3} />
        <B p={[0.6, 0.27, 0]} s={[0.006, 0.42, 0.006]} c="#9aa0a6" m={0.8} r={0.3} />
        <B p={[0, 0, 0]} s={[1.5, 0.3, 0.03]} c="#1b1f26" r={0.4} />
        <mesh geometry={PLANE} position={[0, 0, 0.016]} scale={[1.46, 0.28, 1]}>
          <meshBasicMaterial map={northSign} toneMapped={false} />
        </mesh>
        <mesh geometry={PLANE} position={[0, 0, -0.016]} rotation={[0, Math.PI, 0]} scale={[1.46, 0.28, 1]}>
          <meshBasicMaterial map={southSign} toneMapped={false} />
        </mesh>
      </group>
      {/* one light panel on its way out, over the west strip */}
      <B p={[-8.2, CEIL - 0.012, -8.6]} s={[0.66, 0.02, 1.26]} c="#d9dde2" r={0.6} />
      <mesh ref={flicker} geometry={PLANE} position={[-8.2, CEIL - 0.024, -8.6]} rotation={[Math.PI / 2, 0, 0]} scale={[0.6, 1.2, 1]}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DeskFan({ x, z }: { x: number; z: number }) {
  const blades = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 22;
    if (head.current) head.current.rotation.y = Math.sin(performance.now() / 2200) * 0.6;
  });
  return (
    <group position={[x, DESK, z]} rotation={[0, Math.PI, 0]}>
      <Cyl x={0} y={0} z={0} rad={0.07} h={0.025} c="#f1efe9" r={0.5} />
      <B p={[0, 0.12, 0]} s={[0.02, 0.2, 0.02]} c="#f1efe9" r={0.5} />
      <group ref={head} position={[0, 0.24, 0]}>
        <B p={[0, 0, -0.04]} s={[0.06, 0.06, 0.07]} c="#f1efe9" r={0.5} />
        <mesh geometry={TORUS} material={mat("#d0d4d8", 0.4, 0.6)} position={[0, 0, 0.02]} scale={[0.1, 0.1, 0.25]} />
        <group ref={blades} position={[0, 0, 0.02]}>
          {[0, 1, 2].map((i) => (
            <B
              key={i}
              p={[Math.cos((i * Math.PI * 2) / 3) * 0.045, Math.sin((i * Math.PI * 2) / 3) * 0.045, 0]}
              s={[0.08, 0.035, 0.004]}
              c="#8fb8d8"
              r={0.4}
              rot={[0.3, 0, (i * Math.PI * 2) / 3]}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

/** The night-shift robot vacuum. Loops the open floor; stops and beeps when someone's in its way. */
const ROUTE: [number, number][] = [
  [0.8, -12.8],
  [0.8, -4.3],
  [-3.0, -4.3],
  [-3.0, -10.4],
  [-1.0, -12.8],
];
function Vacuum() {
  const root = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const st = useRef({ seg: 0, u: 0, x: ROUTE[0][0], z: ROUTE[0][1], yaw: 0, held: 0, beeped: false });
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const s = st.current;
    const g = root.current;
    if (!g) return;
    const onFloor = Math.abs(walker.y - F) < 1.5;
    const near = onFloor && Math.hypot(walker.x - s.x, walker.z - s.z) < 0.75;
    if (near) {
      if (!s.beeped) {
        s.beeped = true;
        blip(880);
        window.setTimeout(() => blip(660), 140);
      }
      s.held = 1.2;
    } else if (s.held > 0) s.held -= dt;
    else s.beeped = false;
    if (s.held <= 0) {
      const a = ROUTE[s.seg];
      const b = ROUTE[(s.seg + 1) % ROUTE.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      s.u += (dt * 0.28) / len;
      if (s.u >= 1) {
        s.u = 0;
        s.seg = (s.seg + 1) % ROUTE.length;
      }
      const a2 = ROUTE[s.seg];
      const b2 = ROUTE[(s.seg + 1) % ROUTE.length];
      s.x = a2[0] + (b2[0] - a2[0]) * s.u;
      s.z = a2[1] + (b2[1] - a2[1]) * s.u;
      const want = Math.atan2(b2[0] - a2[0], b2[1] - a2[1]);
      let d = want - s.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      s.yaw += d * Math.min(1, dt * 3);
    }
    g.position.set(s.x, F, s.z);
    g.rotation.y = s.yaw;
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.color.set(s.held > 0 ? "#ff7a66" : "#5fb8ff");
      m.opacity = 0.6 + Math.sin(performance.now() / 300) * 0.3;
    }
  });
  return (
    <group ref={root}>
      <Cyl x={0} y={0.012} z={0} rad={0.17} h={0.075} c="#1b1d22" r={0.35} m={0.3} />
      <Cyl x={0} y={0.087} z={0} rad={0.14} h={0.006} c="#2a2d33" r={0.2} m={0.4} />
      <mesh ref={ring} geometry={TORUS} position={[0, 0.092, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.05, 0.05, 0.05]}>
        <meshBasicMaterial color="#5fb8ff" toneMapped={false} transparent />
      </mesh>
      <B p={[0, 0.05, 0.16]} s={[0.2, 0.05, 0.03]} c="#30343b" r={0.4} />
    </group>
  );
}

/* ------------------------------------------------------------------ the floor */

export function FloorDetail() {
  useEffect(() => {
    const before = detailBoxes.length;
    detailBoxes.push(...FURNITURE);
    return () => {
      detailBoxes.splice(before, FURNITURE.length);
    };
  }, []);
  return (
    <group>
      <Desks />
      <DeskFan x={d08Fan.x} z={d08Fan.z} />
      <Walls />
      <Rug />
      <Sofa />
      <CoffeeTable />
      <Armchair />
      <FloorLamp />
      <Cabinets />
      <WaterCooler />
      <Deliveries />
      <Credenza />
      <CleaningCart />
      <UmbrellaStand />
      <CoffeeMachine />
      <Kitchen />
      <Ceiling />
      <Vacuum />
    </group>
  );
}

const d08Fan = { x: PODS.d08.x - 0.6, z: PODS.d08.near + 0.12 };
