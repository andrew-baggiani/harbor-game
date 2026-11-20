export type Box = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
};

let worldHit: ((x: number, z: number, y: number, radius: number) => boolean) | null = null;
let worldLive = false;

export function setWorldHit(fn: (x: number, z: number, y: number, radius: number) => boolean) {
  worldHit = fn;
}

export function setWorldLive(on: boolean) {
  worldLive = on;
}

export const OFFICE_Y = 50.6;

export const TOWER = { x: -11, z: -18, w: 22, d: 18, h: 58 };

export const SPAWN = { x: 0, z: 4, yaw: -Math.PI / 2 };

export const CAR_SPAWN = { x: -12.5, z: 15.1, yaw: 0 };

export type Block = { x: number; z: number; w: number; d: number; h: number; seed: number };

/** North-side blocks. Nothing crosses the sidewalk at z < 2. */
export const BLOCKS: Block[] = [
  { x: -62, z: 3, w: 14, d: 16, h: 18, seed: 2 },
  { x: -44, z: 2, w: 12, d: 14, h: 34, seed: 5 },
  { x: -28, z: 3, w: 12, d: 12, h: 22, seed: 9 },
  { x: -12, z: 2, w: 18, d: 14, h: 11, seed: 3 },
  { x: 42, z: 2, w: 14, d: 16, h: 52, seed: 7 },
  { x: 60, z: 4, w: 16, d: 14, h: 74, seed: 11 },
  { x: -54, z: 24, w: 18, d: 16, h: 48, seed: 4 },
  { x: -30, z: 26, w: 16, d: 18, h: 28, seed: 8 },
  { x: -8, z: 28, w: 20, d: 14, h: 64, seed: 6 },
  { x: 18, z: 30, w: 18, d: 16, h: 44, seed: 12 },
  { x: 42, z: 28, w: 22, d: 18, h: 58, seed: 15 },
  { x: 68, z: 24, w: 12, d: 20, h: 36, seed: 18 },
];

export const SKYLINE: Block[] = [
  { x: -110, z: -108, w: 16, d: 16, h: 90, seed: 21 },
  { x: -86, z: -120, w: 14, d: 14, h: 140, seed: 22 },
  { x: -64, z: -100, w: 18, d: 18, h: 110, seed: 23 },
  { x: -40, z: -118, w: 12, d: 12, h: 160, seed: 24 },
  { x: -18, z: -104, w: 20, d: 16, h: 96, seed: 25 },
  { x: 6, z: -122, w: 14, d: 14, h: 180, seed: 26 },
  { x: 28, z: -108, w: 18, d: 18, h: 120, seed: 27 },
  { x: 52, z: -124, w: 16, d: 14, h: 150, seed: 28 },
  { x: 76, z: -102, w: 14, d: 16, h: 88, seed: 29 },
  { x: 98, z: -116, w: 20, d: 18, h: 130, seed: 30 },
];

export const boxes: Box[] = [];

function add(minX: number, maxX: number, minZ: number, maxZ: number, minY: number, maxY: number) {
  boxes.push({ minX, maxX, minZ, maxZ, minY, maxY });
}

for (const block of BLOCKS) {
  add(block.x, block.x + block.w, block.z, block.z + block.d, 0, block.h);
}

const T = TOWER;
const doorL = T.x + 8.4;
const doorR = T.x + 13.6;
add(T.x, doorL, T.z, T.z + 0.7, 0, 20);
add(doorR, T.x + T.w, T.z, T.z + 0.7, 0, 20);
add(doorL, doorR, T.z, T.z + 0.7, 3.15, 20);
add(T.x, T.x + T.w, T.z + T.d - 0.7, T.z + T.d, 0, 78);
add(T.x, T.x + 0.7, T.z, T.z + T.d, 0, 78);
add(T.x + T.w - 0.7, T.x + T.w, T.z, T.z + T.d, 0, 78);
add(T.x, T.x + T.w, T.z, T.z + 0.55, 20, 26);
add(T.x, T.x + T.w, T.z, T.z + T.d, 25, 86);

add(-90, 100, -22.4, -21.5, 0, 4);
add(-90, -70, -20, 40, 0, 8);
add(82, 100, -20, 40, 0, 8);
add(-90, 100, 46, 52, 0, 10);
add(19.2, 25.4, 8.6, 11.2, 0, 1.15);
add(21, 24.2, 7.2, 8.4, OFFICE_Y, OFFICE_Y + 1.2);
add(30.4, 34.6, 9.4, 11.2, OFFICE_Y, OFFICE_Y + 1.05);

/** Furniture added in code on top of the modeled floors (see FloorDetail). Always solid. */
export const detailBoxes: Box[] = [];

/** Where the player is standing right now, in either game mode (Monday's sim and the week walker both write it). */
export const walker = { x: 0, y: -100, z: 0 };

/** Mistakes made this shift, for the things in the room that notice (the whiteboard counter). */
export const floorMood = { slips: 0 };

function hitDetail(x: number, z: number, y: number, radius: number) {
  const head = y + 1.75;
  for (const box of detailBoxes) {
    if (head <= box.minY || y >= box.maxY) continue;
    const cx = Math.max(box.minX, Math.min(x, box.maxX));
    const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
    if ((x - cx) ** 2 + (z - cz) ** 2 < radius * radius) return true;
  }
  return false;
}

export function blocked(x: number, z: number, y: number, radius: number, extra: Box[] = []): boolean {
  if (worldHit?.(x, z, y, radius)) return true;
  if (detailBoxes.length && hitDetail(x, z, y, radius)) return true;
  const list = worldLive ? extra : extra.length > 0 ? boxes.concat(extra) : boxes;
  if (worldLive && extra.length === 0) return false;
  const head = y + 1.75;
  for (const box of list) {
    if (head <= box.minY || y >= box.maxY) continue;
    const cx = Math.max(box.minX, Math.min(x, box.maxX));
    const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

export function slide(
  x: number,
  z: number,
  y: number,
  dx: number,
  dz: number,
  radius: number,
  extra: Box[] = [],
): { x: number; z: number } {
  let nx = x + dx;
  if (blocked(nx, z, y, radius, extra)) nx = x;
  let nz = z + dz;
  if (blocked(nx, nz, y, radius, extra)) nz = z;
  return { x: nx, z: nz };
}

export const DOOR = { x: 0, z: -0.8 };
export const ELEVATOR = { x: 1.5, z: -15.6 };
export const ELEVATOR_F14 = { x: 1.5, z: -15.1 };
export const DESK = { x: -5.3, z: -2.75 };
export const USB = { x: 7.6, z: -8.7 };
export const MAYA = { x: 3.35, z: -14.55 };
export const RECEPTION = { x: -4.4, z: -6.4 };
