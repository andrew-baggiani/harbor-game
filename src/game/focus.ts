import * as THREE from "three";

// Seamless "sit down at the screen" camera.
//
// enterFocus("desk") glides the follow camera onto a registered in-world screen until
// the screen fills the view. Once it settles (phase "hold"), the DOM app (DeskScreen)
// is laid exactly over the screen's projected rectangle, so the 3D monitor and the
// clickable app line up. exitFocus() glides back out, then runs a callback.
//
// Rig (draw.tsx) drives stepFocus + applyFocus every frame. sim.ts freezes the player
// while focusActive(). Nothing here touches React state; DeskScreen polls `focus`.

export type FocusPhase = "off" | "in" | "hold" | "out";
export type FocusApp = "mail" | "phone" | "signin";

type Screen = { center: THREE.Vector3; normal: THREE.Vector3; up: THREE.Vector3; right: THREE.Vector3; w: number; h: number };

const IN_SECONDS = 0.85;
const OUT_SECONDS = 0.6;
/** How much of the view the screen fills when settled (desktop). */
const FILL = 0.94;

export const focus = {
  phase: "off" as FocusPhase,
  t: 0,
  target: "",
  app: null as FocusApp | null,
  /** Screen rectangle in page (CSS) pixels, updated every frame while focused. */
  rect: { x: 0, y: 0, w: 0, h: 0 },
  /** Which phish the desk inbox shows this shift (0 gift cards, 1 fake sign-in). */
  mailVariant: Math.random() < 0.5 ? 0 : 1,
  /** Last MailResult, for records (evidence, verified). */
  lastResult: null as unknown,
  onOut: null as null | (() => void),
};

const screens = new Map<string, Screen>();

export function registerScreen(id: string, mesh: THREE.Object3D) {
  mesh.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  let normal = new THREE.Vector3(0, 0, 1);
  const m = mesh as THREE.Mesh;
  const n = m.isMesh ? (m.geometry.getAttribute("normal") as THREE.BufferAttribute | undefined) : undefined;
  if (n) {
    normal = new THREE.Vector3(n.getX(0), n.getY(0), n.getZ(0))
      .applyMatrix3(new THREE.Matrix3().getNormalMatrix(m.matrixWorld))
      .normalize();
  }
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, normal).normalize();
  // Screens here are vertical and axis-aligned: width is along whichever horizontal axis isn't the normal.
  const w = Math.abs(normal.z) > Math.abs(normal.x) ? size.x : size.z;
  screens.set(id, { center, normal, up, right, w, h: size.y });
}

export function resetFocus() {
  focus.phase = "off";
  focus.t = 0;
  focus.app = null;
  focus.onOut = null;
  // mailVariant stays for the session: the desk monitor texture was picked with it.
}

export function enterFocus(id: string, app: FocusApp): boolean {
  if (!screens.has(id) || focus.phase !== "off") return false;
  focus.target = id;
  focus.app = app;
  focus.phase = "in";
  focus.t = 0;
  return true;
}

/** Open an app with no camera move (e.g. a phone call). Freezes the player like a focus. */
export function showApp(app: FocusApp): boolean {
  if (focus.phase !== "off") return false;
  focus.target = "";
  focus.app = app;
  focus.phase = "hold";
  focus.t = 1;
  return true;
}

export function exitFocus(onOut?: () => void) {
  if (focus.phase === "off") return;
  focus.phase = "out";
  focus.onOut = onOut ?? null;
}

export function focusActive() {
  return focus.phase !== "off";
}

export function stepFocus(dt: number) {
  if (focus.phase === "in") {
    focus.t = Math.min(1, focus.t + dt / IN_SECONDS);
    if (focus.t >= 1) focus.phase = "hold";
  } else if (focus.phase === "out") {
    focus.t = Math.max(0, focus.t - dt / OUT_SECONDS);
    if (focus.t <= 0) {
      focus.phase = "off";
      focus.app = null;
      const done = focus.onOut;
      focus.onOut = null;
      done?.();
    }
  }
}

function ease(t: number) {
  // smootherstep: no jolt at either end
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _from = new THREE.Vector3();
const _corner = new THREE.Vector3();

/**
 * Blend the camera from where the follow rig put it to the focus pose.
 * Call after the follow camera has been positioned and aimed at followLook.
 */
export function applyFocus(camera: THREE.PerspectiveCamera, followLook: THREE.Vector3, canvas: HTMLCanvasElement) {
  if (focus.phase === "off") return;
  const s = screens.get(focus.target);
  if (!s) return;
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const tanH = Math.tan(vfov / 2);
  const distH = s.h / (2 * tanH * FILL);
  const distW = s.w / (2 * tanH * camera.aspect * FILL);
  const d = Math.max(distH, distW);
  _pos.copy(s.center).addScaledVector(s.normal, d);
  const e = ease(focus.t);
  _from.copy(camera.position);
  camera.position.lerpVectors(_from, _pos, e);
  _look.lerpVectors(followLook, s.center, e);
  camera.lookAt(_look);
  camera.updateMatrixWorld();

  if (focus.t > 0.6) {
    const r = canvas.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      _corner
        .copy(s.center)
        .addScaledVector(s.right, (sx * s.w) / 2)
        .addScaledVector(s.up, (sy * s.h) / 2)
        .project(camera);
      const px = r.left + (_corner.x * 0.5 + 0.5) * r.width;
      const py = r.top + (-_corner.y * 0.5 + 0.5) * r.height;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    focus.rect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
}

/** Put an image on a screen mesh (emissive, so it reads at night). */
export function applyScreenImage(mesh: THREE.Object3D, url: string) {
  const m = mesh as THREE.Mesh;
  if (!m.isMesh || Array.isArray(m.material)) return;
  const tex = new THREE.TextureLoader().load(url);
  tex.flipY = false; // glTF UV convention, same as the texture the GLB shipped with
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = (m.material as THREE.MeshStandardMaterial).clone();
  mat.map = tex;
  mat.emissiveMap = tex;
  mat.emissive = new THREE.Color("#ffffff");
  mat.emissiveIntensity = 0.45; // bright enough to read at night without blooming to white
  mat.needsUpdate = true;
  m.material = mat;
}

// Test hook, same pattern as sim.ts __controlsTest: lets automated checks open the desk zoom.
if (typeof window !== "undefined") {
  (window as unknown as { __focusTest?: Record<string, unknown> }).__focusTest = {
    enter: () => enterFocus("desk", "mail"),
    state: () => ({ phase: focus.phase, t: focus.t, rect: { ...focus.rect } }),
  };
}
