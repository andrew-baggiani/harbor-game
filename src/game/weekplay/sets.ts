import type { SetKind } from "@/content/week/types";

/** A greybox piece of furniture: drawn as a box and used for collision. y is the bottom. */
export type Piece = { x: number; z: number; w: number; d: number; h: number; color?: string; y?: number; glow?: string; solid?: boolean };

/** Where a beat happens: the prop sits at (x, py, z); a speaking figure stands at (fx, fz). */
export type Spot = { x: number; z: number; py: number; fx?: number; fz?: number; label: string };

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
};

const desk = (x: number, z: number, color = "#3b3f47"): Piece[] => [
  { x, z, w: 1.6, d: 0.8, h: 0.74, color },
  { x, z: z - 0.32, w: 0.56, d: 0.04, h: 0.36, y: 0.76, color: "#15171c", glow: "#2a3a52", solid: false },
];

export const SETS: Record<SetKind, RoomSet> = {
  floor: {
    name: "Floor 14",
    w: 18,
    d: 12,
    h: 3,
    floor: "#2a2d33",
    wall: "#3a3e46",
    light: "#d9e4f2",
    windows: "n",
    spawn: { x: 6.5, z: 4.5, yaw: Math.PI * 0.25 },
    pieces: [
      ...desk(-5, 1.6),
      ...desk(-3, 1.6),
      ...desk(-1, 1.6),
      ...desk(-5, -2.4),
      ...desk(-3, -2.4),
      ...desk(-1, -2.4),
      ...desk(4, -2.4),
      ...desk(6, -2.4),
      { x: 8.2, z: 4.8, w: 1.2, d: 1.6, h: 2.6, color: "#4a4e57" },
      { x: 2.4, z: 4.9, w: 2.2, d: 0.6, h: 1.0, color: "#565049" },
      { x: 2.6, z: -0.4, w: 0.6, d: 0.6, h: 0.93, color: "#4a4d55" },
    ],
    spots: {
      desk: { x: -3, z: 1.4, py: 0.98, fx: -2.1, fz: 2.6, label: "Your desk" },
      nextdesk: { x: -1, z: 1.4, py: 0.98, fx: 0, fz: 2.6, label: "Next desk" },
      aisle: { x: 2.6, z: -0.4, py: 0.95, fx: 2.6, fz: -1.2, label: "The aisle" },
    },
  },
  lobby: {
    name: "Lobby",
    w: 14,
    d: 10,
    h: 4,
    floor: "#34322e",
    wall: "#46423c",
    light: "#f2e2c8",
    windows: "s",
    spawn: { x: -4.5, z: -3, yaw: -Math.PI * 0.75 },
    pieces: [
      { x: 2.5, z: 2.2, w: 2.2, d: 0.5, h: 0.45, color: "#5a4c3e" },
      { x: -3.5, z: 1.5, w: 2.4, d: 0.8, h: 1.05, color: "#2f3138" },
      { x: 0, z: -2.5, w: 0.3, d: 1.4, h: 1.0, color: "#22242a", glow: "#2f6b4f" },
      { x: 1.6, z: -2.5, w: 0.3, d: 1.4, h: 1.0, color: "#22242a", glow: "#2f6b4f" },
      { x: 5.8, z: -3.5, w: 1.6, d: 1.6, h: 3.4, color: "#55595f" },
    ],
    spots: {
      bench: { x: 2.5, z: 2.2, py: 0.47, fx: -3.5, fz: 0.6, label: "Lobby bench" },
    },
  },
  cafe: {
    name: "Cafe",
    w: 14,
    d: 10,
    h: 3.2,
    floor: "#3b2f27",
    wall: "#4b3d33",
    light: "#ffd2a0",
    windows: "w",
    spawn: { x: 4.5, z: 3.5, yaw: Math.PI * 0.2 },
    pieces: [
      { x: -2, z: -1, w: 1.0, d: 1.0, h: 0.74, color: "#6a5240" },
      { x: -2, z: 2.2, w: 1.0, d: 1.0, h: 0.74, color: "#6a5240" },
      { x: 1.5, z: 2.2, w: 1.0, d: 1.0, h: 0.74, color: "#6a5240" },
      { x: 1.2, z: -2.6, w: 0.5, d: 0.5, h: 0.46, color: "#2d2520" },
      { x: 4.6, z: -3.2, w: 3.2, d: 0.9, h: 1.05, color: "#2b2522", glow: "#5a3c26" },
    ],
    spots: {
      table: { x: -2, z: -1, py: 0.76, label: "Your table" },
      chair: { x: 1.2, z: -2.6, py: 0.48, label: "The chair" },
    },
  },
  home: {
    name: "Home",
    w: 12,
    d: 10,
    h: 2.7,
    floor: "#4a3f35",
    wall: "#5a544c",
    light: "#ffd9b0",
    windows: "e",
    spawn: { x: -4.2, z: 3.6, yaw: -Math.PI * 0.2 },
    pieces: [
      { x: 0, z: 0, w: 1.8, d: 1.0, h: 0.76, color: "#6f5a45" },
      { x: -3.6, z: -3.6, w: 3.0, d: 0.7, h: 0.92, color: "#3e3a35" },
      { x: 3.2, z: 2.4, w: 2.4, d: 0.9, h: 0.45, color: "#3c4654" },
      { x: 4.6, z: -3.6, w: 1.4, d: 0.5, h: 0.8, color: "#2e2b28" },
    ],
    spots: {
      table: { x: 0, z: 0, py: 0.78, fx: 1.4, fz: 0.6, label: "Kitchen table" },
      counter: { x: -3.6, z: -3.5, py: 0.94, label: "Counter" },
      couch: { x: 3.2, z: 2.4, py: 0.47, label: "Couch" },
      shelf: { x: 4.6, z: -3.6, py: 0.82, label: "Router" },
    },
  },
  helpdesk: {
    name: "Service desk",
    w: 14,
    d: 10,
    h: 3,
    floor: "#262a30",
    wall: "#353a42",
    light: "#cfe0f2",
    windows: "n",
    spawn: { x: 4.5, z: 3.5, yaw: Math.PI * 0.25 },
    pieces: [...desk(-2, -1.6), ...desk(0, -1.6), ...desk(2, -1.6), { x: -5.5, z: 3.5, w: 1.6, d: 1.0, h: 1.9, color: "#3a3f48" }],
    spots: {
      console: { x: -2, z: -1.8, py: 0.98, label: "Your console" },
      phone: { x: 2, z: -1.8, py: 0.76, label: "Desk phone" },
    },
  },
  server: {
    name: "Server room",
    w: 14,
    d: 10,
    h: 3,
    floor: "#1f2328",
    wall: "#2b3036",
    light: "#b9d4ff",
    spawn: { x: 5, z: 3.5, yaw: Math.PI * 0.25 },
    pieces: [
      ...[-4.5, -3.5, -2.5, -1.5, -0.5].map((x) => ({ x, z: -3.6, w: 0.9, d: 1.1, h: 2.1, color: "#16191e", glow: "#1f7a52" })),
      ...desk(0.5, 1.6, "#33373e"),
      ...desk(-3.5, 1.6, "#33373e"),
      { x: 3, z: -3.6, w: 0.9, d: 1.1, h: 2.1, color: "#16191e", glow: "#8a3a2a" },
    ],
    spots: {
      console: { x: 0.5, z: 1.4, py: 0.98, label: "Admin console" },
      desk: { x: -3.5, z: 1.4, py: 0.98, fx: -2.6, fz: 2.6, label: "Your coworker's desk" },
      rack: { x: 3, z: -2.9, py: 1.1, label: "The rack" },
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
