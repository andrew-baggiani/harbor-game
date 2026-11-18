import type { SetKind } from "@/content/week/types";

/** A greybox piece of furniture: drawn as a box and used for collision. y is the bottom. */
export type Piece = { x: number; z: number; w: number; d: number; h: number; color?: string; y?: number; glow?: string; solid?: boolean };

/**
 * Where a beat happens: the prop sits at (x, py, z) facing `face` (radians about Y, 0 = facing +Z).
 * A speaking figure stands at (fx, fz). The player interacts from (ax, az), where the gold ring sits.
 * `monitor` puts the screen art on the real desk monitor mesh of that name instead of a floating prop.
 */
export type Spot = {
  x: number;
  z: number;
  py: number;
  fx?: number;
  fz?: number;
  ax?: number;
  az?: number;
  face?: number;
  monitor?: string;
  label: string;
};

export type RoomSet = {
  w: number;
  d: number;
  h: number;
  floor: string;
  wall: string;
  light: string;
  /** A wall made of night windows: n, s, e or w. */
  windows?: "n" | "s" | "e" | "w";
  spawn: { x: number; z: number; yaw: number };
  pieces: Piece[];
  spots: Record<string, Spot>;
  name: string;
  /** Use Monday's modeled and baked Harbor Tower instead of a greybox room. y is the floor height. */
  harbor?: { y: number };
  /** A modeled, baked room GLB in /assets/models (the cafe, the home). Coordinates are that file's. */
  baked?: string;
  /** Posters and signs hung in this room for this set. face: radians about Y, 0 = facing +Z. */
  decor?: { file: string; x: number; y: number; z: number; w: number; h: number; face: number }[];
  /** What the player's desk monitor shows when no beat is using it. */
  idle?: string;
};

const desk = (x: number, z: number, color = "#3b3f47"): Piece[] => [
  { x, z, w: 1.6, d: 0.8, h: 0.74, color },
  { x, z: z - 0.32, w: 0.56, d: 0.04, h: 0.36, y: 0.76, color: "#15171c", glow: "#2a3a52", solid: false },
];

export const SETS: Record<SetKind, RoomSet> = {
  floor: {
    name: "Floor 14",
    harbor: { y: 50.6 },
    w: 20,
    d: 16,
    h: 3,
    floor: "#2a2d33",
    wall: "#3a3e46",
    light: "#d9e4f2",
    spawn: { x: 1.5, z: -14.2, yaw: Math.PI },
    pieces: [],
    spots: {
      desk: { x: -5.8, z: -1.57, py: 51.54, ax: -5.8, az: -2.75, fx: -4.6, fz: -2.9, monitor: "Monitor_Player_Screen", label: "Your desk" },
      nextdesk: { x: -4.7, z: -5.75, py: 51.45, ax: -4.7, az: -5.0, fx: -5.6, fz: -5.0, face: Math.PI, label: "Next desk" },
      aisle: { x: -3.95, z: -8.0, py: 51.45, ax: -2.9, az: -8.0, fx: -2.6, fz: -8.9, face: Math.PI / 2, label: "The aisle" },
      phone: { x: -6.3, z: -1.9, py: 51.45, ax: -6.3, az: -2.75, face: Math.PI, label: "Your phone" },
      paper: { x: -5.25, z: -1.8, py: 51.43, ax: -5.3, az: -2.75, fx: -4.4, fz: -2.9, face: Math.PI, label: "Your desk" },
      podeast: { x: 4.1, z: -5.75, py: 51.45, ax: 4.1, az: -5.0, fx: 3.2, fz: -4.9, face: Math.PI, label: "East pod" },
    },
  },
  lobby: {
    name: "Lobby",
    harbor: { y: 0 },
    w: 20,
    d: 16,
    h: 4,
    floor: "#34322e",
    wall: "#46423c",
    light: "#f2e2c8",
    spawn: { x: 1.2, z: -13.6, yaw: Math.PI },
    pieces: [],
    spots: {
      bench: { x: 6.45, z: -6.95, py: 0.52, ax: 5.85, az: -6.3, fx: -4.4, fz: -8.7, label: "Lobby sofa" },
    },
  },
  cafe: {
    name: "Tidewater cafe",
    baked: "harbor_cafe_baked.glb",
    w: 14,
    d: 10,
    h: 3.3,
    floor: "#3b2f27",
    wall: "#4b3d33",
    light: "#ffd2a0",
    spawn: { x: 2.4, z: 3.6, yaw: 1.32 },
    pieces: [],
    spots: {
      table: { x: -5.45, z: 1.75, py: 0.75, ax: -4.4, az: 0.9, label: "Your table" },
      chair: { x: -4.75, z: 2.25, py: 0.46, ax: -3.9, az: 2.7, label: "The chair" },
    },
  },
  home: {
    name: "Home",
    baked: "harbor_home_baked.glb",
    w: 12,
    d: 10,
    h: 2.7,
    floor: "#4a3f35",
    wall: "#5a544c",
    light: "#ffd9b0",
    spawn: { x: -3.1, z: 3.9, yaw: -0.11 },
    pieces: [],
    spots: {
      table: { x: -2.5, z: -1.5, py: 0.76, ax: -3.9, az: -1.5, fx: -1.2, fz: -0.6, label: "Kitchen table" },
      counter: { x: -4.0, z: -4.62, py: 0.92, ax: -4.0, az: -3.7, label: "Counter" },
      couch: { x: 1.5, z: 1.0, py: 0.5, ax: 2.3, az: -0.2, label: "Couch" },
      shelf: { x: 5.75, z: 0.22, py: 0.6, ax: 4.9, az: 0.22, label: "Router" },
    },
  },
  helpdesk: {
    name: "Service desk · Floor 14",
    idle: "week/decor/desk-queue-screen.webp",
    decor: [{ file: "week/decor/desk-verify-poster.webp", x: -9.97, y: 52.15, z: -2.6, w: 0.6, h: 0.9, face: Math.PI / 2 }],
    harbor: { y: 50.6 },
    w: 20,
    d: 16,
    h: 3,
    floor: "#262a30",
    wall: "#353a42",
    light: "#cfe0f2",
    spawn: { x: 1.5, z: -14.2, yaw: Math.PI },
    pieces: [],
    spots: {
      console: { x: -5.8, z: -1.57, py: 51.54, ax: -5.8, az: -2.75, monitor: "Monitor_Player_Screen", label: "Your console" },
      phone: { x: -6.3, z: -1.9, py: 51.46, ax: -6.3, az: -2.75, face: Math.PI, label: "Desk phone" },
    },
  },
  server: {
    name: "IT room · Floor 14",
    decor: [
      { file: "week/decor/srv-door-sign.webp", x: -2.3, y: 51.95, z: -14.285, w: 0.3, h: 0.3, face: 0 },
      { file: "week/decor/srv-rack-labels.webp", x: -0.86, y: 52.0, z: -15.0, w: 1.2, h: 0.6, face: Math.PI / 2 },
    ],
    harbor: { y: 50.6 },
    w: 20,
    d: 16,
    h: 3,
    floor: "#1f2328",
    wall: "#2b3036",
    light: "#b9d4ff",
    spawn: { x: 1.5, z: -14.2, yaw: Math.PI },
    pieces: [],
    spots: {
      console: { x: -5.8, z: -1.57, py: 51.54, ax: -5.8, az: -2.75, monitor: "Monitor_Player_Screen", label: "Admin console" },
      desk: { x: 4.1, z: -5.75, py: 51.45, ax: 4.1, az: -5.0, fx: 3.2, fz: -4.9, face: Math.PI, label: "Your coworker's desk" },
      phone: { x: -6.3, z: -1.9, py: 51.45, ax: -6.3, az: -2.75, face: Math.PI, label: "Your phone" },
      rack: { x: -2.3, z: -14.0, py: 51.2, ax: -2.3, az: -13.2, face: 0, label: "IT room door" },
    },
  },
};

/** Circle-vs-box test against solid pieces and the room walls. */
export function blockedIn(set: RoomSet, x: number, z: number, r = 0.28): boolean {
  if (Math.abs(x) > set.w / 2 - r || Math.abs(z) > set.d / 2 - r) return true;
  for (const p of set.pieces) {
    if (p.solid === false || (p.y ?? 0) > 1.2) continue;
    if (Math.abs(x - p.x) < p.w / 2 + r && Math.abs(z - p.z) < p.d / 2 + r) return true;
  }
  return false;
}
