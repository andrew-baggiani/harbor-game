import { create } from "zustand";
import { CAR_SPAWN, SPAWN } from "@/game/layout";
import { applyFlag, barkFor, emptyFlags, nextBeat, objectiveFor, panelFor, scoreOf, talkFor, type Beat, type Flags, type Talk } from "@/game/story";
import { say } from "@/game/audio";

export type Bark = { who: string; text: string };

type Data = {
  beat: Beat;
  talk: Talk | null;
  bark: Bark | null;
  objective: string;
  prompt: string | null;
  flags: Flags;
  driving: boolean;
  paused: boolean;
  boot: boolean;
  hint: boolean;
  minute: number;
  report: boolean;
  laptopBad: boolean;
  phoneBad: boolean;
  wireSent: boolean;
};

type HarborStore = Data & {
  choose: (id: string) => void;
  setPrompt: (prompt: string | null) => void;
  setDriving: (driving: boolean) => void;
  setPaused: (paused: boolean) => void;
  setBoot: (boot: boolean) => void;
  setHint: (hint: boolean) => void;
  setMinute: (minute: number) => void;
  setBark: (bark: Bark | null) => void;
  openPanel: (id: string) => void;
  finish: () => void;
  reset: () => void;
};

export const world = {
  px: SPAWN.x,
  py: 0,
  pz: SPAWN.z,
  face: SPAWN.yaw,
  camYaw: SPAWN.yaw,
  camPitch: 0.08,
  driving: false,
  carX: CAR_SPAWN.x,
  carZ: CAR_SPAWN.z,
  carYaw: CAR_SPAWN.yaw,
  carSpeed: 0,
  brake: false,
  wheelSteer: 0,
  carRoll: 0,
  doorOpen: 0,
  reader: "off" as "off" | "red" | "green",
  badgeOut: 0,
  moving: false,
  speed: 0,
  walk: 0,
  guyX: 1.55,
  guyZ: 1.05,
  guyVisible: true,
  guyGone: false,
  fade: 0,
  fadingIn: true,
  bootT: 0,
  transition: null as null | "up" | "down",
  greeted: false,
  ending: false,
  endT: 0,
  interactCd: 0,
  barkT: 0,
  minutes: 8 * 60 + 41,
  camX: SPAWN.x,
  camY: 2.4,
  camZ: SPAWN.z + 6,
  lookX: 0,
  lookY: 0,
  stickX: 0,
  stickY: 0,
  touchRun: false,
  wantInteract: false,
  use: "" as string,
  snap: false,
  choice: 0,
  markerSx: 0.5,
  markerSy: 0.35,
  markerDist: 0,
  markerBehind: false,
  markerOn: false,
  captionWho: "",
  captionText: "",
  captionT: 0,
};

export type FleetCar = { x: number; z: number; yaw: number; color: string; kind: "sedan" | "van" };

const fleetHome: FleetCar[] = [
  { x: CAR_SPAWN.x, z: CAR_SPAWN.z, yaw: CAR_SPAWN.yaw, color: "#1e4a86", kind: "sedan" },
  { x: -43.5, z: -12.8, yaw: -0.55, color: "#6a3024", kind: "van" },
  { x: -9.2, z: -13.4, yaw: 0.18, color: "#1a2420", kind: "sedan" },
  { x: 16.4, z: -6.8, yaw: -0.72, color: "#3a3428", kind: "van" },
  { x: 39.5, z: -12.1, yaw: 0.4, color: "#24161c", kind: "sedan" },
];

export const fleet: FleetCar[] = fleetHome.map((car) => ({ ...car }));

function parkCars() {
  fleetHome.forEach((car, index) => Object.assign(fleet[index], car));
}

export const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  left: false,
  right: false,
  up: false,
  down: false,
  run: false,
};

const initial: Data = {
  beat: "tower",
  talk: null,
  bark: null,
  objective: objectiveFor("tower"),
  prompt: null,
  flags: emptyFlags(),
  driving: false,
  paused: false,
  boot: true,
  hint: true,
  minute: 8 * 60 + 41,
  report: false,
  laptopBad: false,
  phoneBad: false,
  wireSent: false,
};

export const useHarbor = create<HarborStore>((set, get) => ({
  ...initial,
  choose: (id) => {
    if (id === "reception-ok") {
      world.barkT = 6;
      world.captionWho = "June Park · Reception";
      world.captionText = "The elevator is at the back of the lobby. Badge yourself. Floor fourteen.";
      world.captionT = 7;
      say("reception-ok");
      set({
        talk: null,
        bark: { who: "June Park · Reception", text: "Elevator at the back. Badge yourself. Floor fourteen." },
        objective: "June Park: elevator at the back. Floor fourteen.",
      });
      return;
    }
    const flags = applyFlag(get().flags, id);
    const beat = nextBeat(id);
    const bark = barkFor(id);
    world.barkT = 5.5;
    world.minutes += 11;
    say(id);
    set({
      flags,
      beat,
      talk: beat === "door" ? talkFor("door") : null,
      bark,
      objective: objectiveFor(beat),
      laptopBad: id === "usb-plug" || get().laptopBad,
      phoneBad: id === "phone-code" || get().phoneBad,
      wireSent: id === "wire-send" || get().wireSent,
      minute: Math.floor(world.minutes),
    });
    if (id === "door-hold") {
      world.guyGone = false;
      world.doorOpen = 1;
      world.reader = "red";
      world.badgeOut = 1;
    }
    if (id === "door-shut") {
      world.guyGone = false;
      world.doorOpen = 0;
      world.reader = "red";
      world.badgeOut = 0;
    }
  },
  setPrompt: (prompt) => {
    if (get().prompt !== prompt) set({ prompt });
  },
  setDriving: (driving) => {
    if (get().driving !== driving) set({ driving });
  },
  setPaused: (paused) => set({ paused }),
  setBoot: (boot) => set({ boot }),
  setHint: (hint) => {
    if (get().hint !== hint) set({ hint });
  },
  setMinute: (minute) => {
    if (get().minute !== minute) set({ minute });
  },
  setBark: (bark) => set({ bark }),
  openPanel: (id) => {
    const talk = panelFor(id);
    if (talk) set({ talk });
  },
  finish: () => {
    if (get().report) return;
    set({ beat: "done", report: true, objective: objectiveFor("done"), prompt: null, talk: null });
    world.ending = true;
  },
  reset: () => {
    world.px = SPAWN.x;
    world.py = 0;
    world.pz = SPAWN.z;
    world.face = SPAWN.yaw;
    world.camYaw = SPAWN.yaw;
    world.camPitch = 0.08;
    world.driving = false;
    world.carX = CAR_SPAWN.x;
    world.carZ = CAR_SPAWN.z;
    world.carYaw = CAR_SPAWN.yaw;
    world.carSpeed = 0;
    world.brake = false;
    world.wheelSteer = 0;
    world.carRoll = 0;
    world.doorOpen = 0;
    world.reader = "off";
    world.badgeOut = 0;
    world.moving = false;
    world.walk = 0;
    world.guyX = 1.55;
    world.guyZ = 1.05;
    world.guyVisible = true;
    world.guyGone = false;
    world.fade = 0;
    world.fadingIn = true;
    world.bootT = 0;
    world.transition = null;
    world.greeted = false;
    world.ending = false;
    world.endT = 0;
    world.interactCd = 0;
    world.barkT = 0;
    world.minutes = 8 * 60 + 41;
    world.wantInteract = false;
    world.use = "";
    world.choice = 0;
    world.stickX = 0;
    world.stickY = 0;
    world.touchRun = false;
    parkCars();
    set({ ...initial, flags: emptyFlags() });
  },
}));

export function resultOf() {
  return scoreOf(useHarbor.getState().flags);
}
