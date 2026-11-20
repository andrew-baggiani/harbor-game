import { enterFocus, focusActive, showApp } from "@/game/focus";
import { playSfx, setBed, setBedFor, warmSounds } from "@/game/sound";
import { mondayNearby, mondayUse, pokeClock } from "@/game/mondayPlay";
import { tickFallout } from "@/game/fallout";
import { DESK, DOOR, ELEVATOR, ELEVATOR_F14, MAYA, OFFICE_Y, USB, slide, walker } from "@/game/layout";
import { blip, caption, say, setEngine, setRing, setWalking, tickAudio, voiceBusy, sayNext } from "@/game/audio";
import { objectiveFor } from "@/game/story";
import { keys, useHarbor, world, fleet } from "@/game/state";

const traffic = [
  { x: -50, z: -9.3, dir: 1, speed: 7.5 },
  { x: 20, z: -9.3, dir: 1, speed: 9 },
  { x: 55, z: -13.4, dir: -1, speed: 8 },
  { x: -10, z: -13.4, dir: -1, speed: 6.5 },
];

export function trafficCars() {
  return traffic;
}

function nearestFleet(px: number, pz: number, reach = 4.2) {
  let best = -1;
  let bestD = reach;
  fleet.forEach((car, index) => {
    const d = Math.hypot(px - car.x, pz - car.z);
    if (d < bestD) {
      bestD = d;
      best = index;
    }
  });
  return best;
}

function len(x: number, z: number) {
  return Math.hypot(x, z);
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function insideTower(x: number, z: number) {
  return x > -10.7 && x < 10.7 && z < -0.95 && z > -17.6;
}

function dist(x: number, z: number, p: { x: number; z: number }) {
  return Math.hypot(x - p.x, z - p.z);
}

// Freeze the hero in place: stops footsteps and drops the run/walk animation to idle.
function standStill() {
  setEngine(0, false);
  setRing(false);
  setWalking(false, 0);
  if (!world.driving) {
    world.moving = false;
    world.speed = 0;
  }
}

export function step(dt: number) {
  const store = useHarbor.getState();
  publishProbe();
  dt = Math.min(dt, 0.033);
  tickAudio(dt);
  stepReach(dt);
  stepTiming(dt);
  walker.x = world.px;
  walker.y = world.py;
  walker.z = world.pz;
  // What plays under Monday: muzak in the elevator, the room's own bed indoors, the water outside.
  const riding = world.ride === "board" || world.ride === "hold" || world.ride === "shut" || world.ride === "ride";
  if (store.boot) setBed(null, null);
  else {
    warmSounds();
    setBedFor(riding ? "elevator" : world.py > 10 ? "f14" : world.py < 2 && insideTower(world.px, world.pz) ? "lobby" : "harbor");
  }

  if (world.ride === "idle" && world.fadingIn) {
    world.fade = Math.max(0, world.fade - dt * 1.7);
    if (world.fade === 0) world.fadingIn = false;
  }
  stepLanes(dt);
  stepRide(dt);
  if (world.ride === "hold" || world.ride === "shut" || world.ride === "ride") {
    standStill();
    // Nothing to steer in the cab, but the floor buttons are right there.
    const want = world.wantInteract;
    world.wantInteract = false;
    if (want && world.interactCd <= 0 && !store.talk) {
      mondayUse("toy:cab-panel");
      world.interactCd = 0.28;
    }
    store.setPrompt(store.talk ? null : "E  ·  Floor buttons");
    return;
  }

  // Zoomed into the desk screen: the player is sitting, the app has the keyboard.
  if (focusActive()) {
    standStill();
    store.setPrompt(null);
    return;
  }
  if (!store.paused && !store.boot && !world.ending) tickFallout(dt);

  if (world.ending) {
    world.endT += dt;
    standStill();
    return;
  }

  if (store.paused || store.boot) {
    standStill();
    return;
  }

  world.interactCd = Math.max(0, world.interactCd - dt);
  if (world.barkT > 0) {
    world.barkT -= dt;
    if (world.barkT <= 0) store.setBark(null);
  }

  world.minutes += dt * 0.35;
  store.setMinute(Math.floor(world.minutes));

  const locked = store.talk != null || world.entering >= 0;
  let mx = 0;
  let mz = 0;
  let pace = 0;

  if (!locked) {
    const forward = (keys.w ? 1 : 0) - (keys.s ? 1 : 0) + world.stickY;
    const strafe = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + world.stickX;
    const yaw = world.camYaw;
    const fx = Math.cos(yaw);
    const fz = Math.sin(yaw);
    const rx = -fz;
    const rz = fx;
    mx = fx * forward + rx * strafe;
    mz = fz * forward + rz * strafe;
    const mag = len(mx, mz);
    const input = mag > 1 ? 1 : mag;
    if (mag > 1) {
      mx /= mag;
      mz /= mag;
    }
    pace = (keys.run || world.touchRun ? 7.4 : 2.15) * (input > 0.04 ? input : 0);
  }

  if (keys.left) world.camYaw -= dt * 1.8;
  if (keys.right) world.camYaw += dt * 1.8;
  if (keys.up) world.camPitch -= dt * 1.7;
  if (keys.down) world.camPitch += dt * 1.7;
  world.camYaw += world.lookX;
  world.camPitch = Math.max(-1.05, Math.min(1.15, world.camPitch + world.lookY));
  world.lookX = 0;
  world.lookY = 0;

  if (world.driving) {
    const throttle = locked ? 0 : Math.min(1, (keys.w ? 1 : 0) + Math.max(0, world.stickY));
    const brake = locked ? 0 : Math.min(1, (keys.s ? 1 : 0) + Math.max(0, -world.stickY));
    const steer = locked ? 0 : (keys.a ? 1 : 0) - (keys.d ? 1 : 0) - world.stickX;
    world.brake = brake > 0.2 && world.carSpeed > 0.35;
    const drive = throttle * 16 - brake * (world.carSpeed > 0.15 ? 32 : -9);
    world.carSpeed += drive * dt;
    world.carSpeed *= Math.exp(-(throttle > 0.08 ? 0.7 : 1.8) * dt);
    world.carSpeed = Math.max(-5.5, Math.min(14, world.carSpeed));
    const sp = Math.abs(world.carSpeed);
    const turn = sp < 0.35 ? 0 : 0.55 + Math.min(0.7, sp / 10);
    world.carYaw += steer * turn * dt * Math.sign(world.carSpeed || 1);
    const axis = Math.cos(world.carYaw) >= 0 ? 0 : Math.PI;
    let off = world.carYaw - axis;
    while (off > Math.PI) off -= Math.PI * 2;
    while (off < -Math.PI) off += Math.PI * 2;
    const limit = sp < 2.4 ? 1.15 : 0.58;
    if (Math.abs(off) > limit) world.carYaw = dampAngle(world.carYaw, axis + Math.sign(off) * limit, 8, dt);
    world.wheelSteer = damp(world.wheelSteer, steer * 0.42, 10, dt);
    world.carRoll = damp(world.carRoll, -steer * Math.min(0.08, sp * 0.006), 6, dt);
    let nx = world.carX + Math.cos(world.carYaw) * world.carSpeed * dt;
    let nz = world.carZ + Math.sin(world.carYaw) * world.carSpeed * dt;
    const minZ = 7.5;
    const maxZ = 15.35;
    if (nz < minZ || nz > maxZ) {
      nz = Math.max(minZ, Math.min(maxZ, nz));
      const into = Math.abs(Math.sin(world.carYaw));
      world.carSpeed -= Math.sign(world.carSpeed || 1) * into * 10 * dt;
    }
    if (nx < -92 || nx > 92) {
      nx = Math.max(-92, Math.min(92, nx));
      world.carSpeed *= 0.2;
    }
    world.carX = nx;
    world.carZ = nz;
    world.px = world.carX;
    world.pz = world.carZ;
    world.py = 0;
    world.face = world.carYaw;
    world.moving = sp > 0.35;
    world.speed = 0;
    const looking = keys.left || keys.right || keys.up || keys.down || Math.abs(world.lookX) + Math.abs(world.lookY) > 0;
    if (sp > 0.8 && !looking) world.camYaw = damp(world.camYaw, world.carYaw, 3.4, dt);
    fleet[0].x = world.carX;
    fleet[0].z = world.carZ;
    fleet[0].yaw = world.carYaw;
  } else {
    const speed = pace;
    const next = slide(world.px, world.pz, world.py, mx * speed * dt, mz * speed * dt, 0.32, [...doorBlock(), ...gateBlock()]);
    world.moving = Math.hypot(next.x - world.px, next.z - world.pz) > 0.001;
    world.speed = world.moving ? speed : 0;
    world.px = next.x;
    world.pz = next.z;
    if (world.py > 40) {
      world.px = Math.max(-9.5, Math.min(9.5, world.px));
      world.pz = Math.max(-17.8, Math.min(-1.05, world.pz));
    }
    if (world.moving) {
      const desired = Math.atan2(mz, mx);
      world.face = dampAngle(world.face, desired, 10, dt);
      world.walk += dt * 9;
      if (store.hint && Math.hypot(world.px, world.pz - 4) > 2) store.setHint(false);
    }
    setWalking(world.moving, world.speed);
  }

  setEngine(world.carSpeed, world.driving);
  setRing(store.beat === "phone" && !store.talk && world.py > 10);
  if (world.driving) setWalking(false, 0);

  for (const car of traffic) {
    const ahead = car.x + car.dir * 9;
    const playerOnLane = Math.abs(world.pz - car.z) < 2.2 && Math.abs(world.px - ahead) < 6;
    const cruise = playerOnLane ? 0 : car.speed;
    car.x += car.dir * cruise * dt;
    if (car.x > 78) car.x = -68;
    if (car.x < -68) car.x = 78;
  }

  updateGuy(dt, store.flags.door);

  if (!world.greeted && store.beat === "lobby" && world.py < 2 && insideTower(world.px, world.pz)) {
    world.greeted = true;
    world.barkT = 6;
    sayNext("reception");
    store.setBark({ who: "June Park · Reception", text: "You're on my list for fourteen. Straight back, gold doors." });
  }

  if (store.beat === "leave" && world.py < 5 && world.pz > 0.55 && Math.abs(world.px) < 8) {
    store.finish();
  }

  if (world.buzz > 0) world.buzz = Math.max(0, world.buzz - dt);
  if (world.pending && !store.talk && !store.paused && !store.boot) {
    if (voiceBusy()) world.quiet = 0;
    else world.quiet += dt;
    const wait = world.pending === "signin" ? 3 : 0.45;
    if (world.quiet >= wait) {
      const which = world.pending;
      world.pending = "";
      world.quiet = 0;
      if (which === "misdirect") {
        world.misdirectScreen = "compose";
        sayNext("misdirect");
        if (!enterFocus("desk", "misdirect")) store.openPanel("misdirect");
      } else if (which === "signin") {
        world.signinScreen = "alert";
        world.buzz = 1.2;
        blip(740);
        sayNext("signin");
        // v2: authenticator push with number matching and repeat pushes; v1 panel is the fallback.
        if (!showApp("signin")) store.openPanel("signin");
      } else {
        world.printouts = true;
        sayNext("cleandesk");
        blip(480);
      }
    }
  }

  const want = world.wantInteract;
  world.wantInteract = false;
  const prompt = computePrompt();
  if (want && world.interactCd <= 0 && !store.talk && !locked) {
    tryInteract();
    world.interactCd = 0.28;
  }

  store.setPrompt(store.talk ? null : prompt);
  store.setDriving(world.driving);
}

function doorBlock() {
  if (world.doorOpen > 0.55 || world.py > 4) return [];
  return [{ minX: -1.4, maxX: 1.4, minZ: -1.2, maxZ: -0.45, minY: 0, maxY: 2.7 }];
}

const GATE_LANES: [number, number][] = [
  [-1.7, -0.8],
  [-0.6, 0.3],
  [0.5, 1.4],
  [1.6, 2.7],
];

function gateBlock() {
  if (world.py > 4) return [];
  return GATE_LANES.flatMap(([minX, maxX], index) => (world.laneT[index] > 0.75 ? [] : [{ minX, maxX, minZ: -12.35, maxZ: -11.65, minY: 0, maxY: 1.5 }]));
}

const RIDE_FLOORS = ["L", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"];

function inCab() {
  return Math.abs(world.px - 1.5) < 0.75 && world.pz < world.cabZ - 0.35 && Math.abs(world.py - world.cabY) < 1.6;
}

function stepLanes(dt: number) {
  // Free exit, like real turnstiles: walking up to a lane from the elevator side opens it. Badging is
  // only needed on the way in.
  if (world.py < 3 && world.pz < -12.3 && world.pz > -14.6) {
    GATE_LANES.forEach(([minX, maxX], index) => {
      if (world.px > minX - 0.15 && world.px < maxX + 0.15 && world.laneOpen[index] === 0) {
        world.laneOpen[index] = 1;
        world.laneHold[index] = 2.5;
      }
    });
  }
  for (let index = 0; index < 4; index += 1) {
    const target = world.laneOpen[index];
    const step = dt / 0.4;
    world.laneT[index] = world.laneT[index] < target ? Math.min(target, world.laneT[index] + step) : Math.max(target, world.laneT[index] - step);
    if (world.laneOpen[index] === 1 && world.laneT[index] > 0.95) {
      world.laneHold[index] -= dt;
      if (world.laneHold[index] <= 0) world.laneOpen[index] = 0;
    }
  }
}

function beginRide(up: boolean) {
  world.ride = "open";
  world.rideDir = up ? "up" : "down";
  world.rideT = 0;
  world.rideMoved = false;
  world.cabShown = true;
  world.cabY = up ? 0 : 50.6;
  world.cabZ = up ? -17.36 : -16.51;
  world.elevDoor = 0;
  world.callLit = true;
  world.cabButton = "";
  world.indicator = up ? "L" : "14";
  world.arrow = up ? "up" : "down";
  blip(240);
}

function stepRide(dt: number) {
  if (world.ride === "idle") return;
  const up = world.rideDir === "up";
  if (world.ride === "open") {
    world.cabShown = true;
    world.callLit = true;
    world.elevDoor = Math.min(1, world.elevDoor + dt / 1.2);
    world.indicator = up ? "L" : "14";
    world.arrow = up ? "up" : "down";
    if (world.elevDoor >= 1) world.ride = "board";
    return;
  }
  if (world.ride === "board") {
    if (inCab()) {
      world.ride = "hold";
      world.rideT = 0;
      world.callLit = false;
      world.cabButton = up ? "14" : "L";
    }
    return;
  }
  if (world.ride === "hold") {
    world.rideT += dt;
    // Turn around to face the doors, the way anyone does in an elevator.
    world.face = dampAngle(world.face, Math.PI / 2, 4.5, dt);
    world.camYaw = dampAngle(world.camYaw, Math.PI / 2, 4.5, dt);
    world.camPitch += (-0.13 - world.camPitch) * (1 - Math.exp(-4 * dt));
    if (world.rideT >= 1.1) world.ride = "shut";
    return;
  }
  if (world.ride === "shut") {
    world.face = dampAngle(world.face, Math.PI / 2, 4.5, dt);
    world.camYaw = dampAngle(world.camYaw, Math.PI / 2, 4.5, dt);
    world.elevDoor = Math.max(0, world.elevDoor - dt / 1.2);
    if (world.elevDoor <= 0) {
      world.ride = "ride";
      world.rideT = 0;
      world.rideMoved = false;
    }
    return;
  }
  if (world.ride === "ride") {
    // The whole ride happens inside the cab: doors shut, the readout above them counts the floors,
    // a little sway. The jump between floors happens behind closed doors, so there's nothing to see.
    world.rideT += dt;
    const RIDE = 5.2;
    const k = Math.min(1, world.rideT / RIDE);
    const eased = k * k * (3 - 2 * k);
    world.rideBob = Math.sin(world.rideT * 7) * 0.006 * Math.sin(Math.PI * k);
    const floors = up ? RIDE_FLOORS : [...RIDE_FLOORS].reverse();
    world.indicator = floors[Math.min(floors.length - 1, Math.round(eased * (floors.length - 1)))];
    world.arrow = up ? "up" : "down";
    if (!world.rideMoved) {
      world.py += up ? 50.6 : -50.6;
      world.pz += up ? 0.85 : -0.85;
      world.cabY += up ? 50.6 : -50.6;
      world.cabZ += up ? 0.85 : -0.85;
      world.camY += up ? 50.6 : -50.6;
      world.camZ += up ? 0.85 : -0.85;
      world.rideMoved = true;
    }
    if (world.rideT >= RIDE) {
      world.ride = "arrive";
      world.rideBob = 0;
      playSfx("sfx-elevator-ding", 0.6);
      world.rideT = 0;
      world.cabButton = "";
      world.indicator = up ? "14" : "L";
      world.arrow = "";
      if (up) {
        useHarbor.setState({ beat: "desk", objective: objectiveFor("desk") });
        world.minutes += 4;
      } else {
        useHarbor.setState({ beat: "leave", objective: objectiveFor("leave") });
      }
    }
    return;
  }
  if (world.ride === "arrive") {
    world.elevDoor = Math.min(1, world.elevDoor + dt / 1.2);
    world.callLit = false;
    if (world.elevDoor >= 1) {
      world.ride = "out";
      world.rideT = 0;
    }
    return;
  }
  world.rideT += dt;
  // Doors stay open until you've stepped out: never close on the player.
  const clear = !inCab() && (world.pz > world.cabZ + 0.9 || Math.abs(world.px - 1.5) > 1.3 || Math.abs(world.py - world.cabY) > 2);
  if (world.rideT > 0.8 && clear) {
    world.elevDoor = Math.max(0, world.elevDoor - dt / 1.2);
    if (world.elevDoor <= 0) {
      world.cabShown = false;
      world.ride = "idle";
      world.arrow = "";
      world.rideBob = 0;
    }
  }
}

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

function updateGuy(dt: number, door: "held" | "shut" | null) {
  if (!world.guyVisible) return;
  let tx = 1.55;
  let tz = 1.05;
  if (door === "held") {
    tx = world.doorOpen > 0.45 ? 0.2 : 1.35;
    tz = world.doorOpen > 0.45 ? -3.4 : 0.35;
  } else if (door === "shut") {
    // Off down the street, back toward his van, until he's out of sight.
    tx = 19;
    tz = 2.6;
  }
  // Walk there at a person's pace instead of gliding in on an ease-out curve.
  const dx = tx - world.guyX;
  const dz = tz - world.guyZ;
  const d = Math.hypot(dx, dz);
  const pace = door === "shut" ? 1.5 : 1.25;
  if (d > 0.02) {
    const stepLen = Math.min(d, pace * dt);
    world.guyX += (dx / d) * stepLen;
    world.guyZ += (dz / d) * stepLen;
  }
  if (door === "shut" && Math.hypot(world.guyX - tx, world.guyZ - tz) < 0.4) world.guyVisible = false;
}

/** The driver-side handle of a parked car, on whichever side the player is standing. */
function carHandle(index: number) {
  const car = fleet[index];
  const th = -car.yaw;
  const lx = car.kind === "van" ? 0.6 : 0.35;
  const sideA = { x: car.x + lx * Math.cos(th) + 0.86 * Math.sin(th), z: car.z - lx * Math.sin(th) + 0.86 * Math.cos(th) };
  const sideB = { x: car.x + lx * Math.cos(th) - 0.86 * Math.sin(th), z: car.z - lx * Math.sin(th) - 0.86 * Math.cos(th) };
  const a = Math.hypot(world.px - sideA.x, world.pz - sideA.z) < Math.hypot(world.px - sideB.x, world.pz - sideB.z) ? sideA : sideB;
  return { x: a.x, y: car.kind === "van" ? 0.96 : 0.82, z: a.z };
}

/** On the main path vs. exploring: walking away from the marker, or a moment around each poke or find. */
function stepTiming(dt: number) {
  const store = useHarbor.getState();
  if (store.boot || store.report) return;
  const t = world.time;
  if (store.talk) {
    t.onTask += dt;
    return;
  }
  const spot = markerNow();
  const dist = spot ? Math.hypot(world.px - spot.x, world.pz - spot.z) : 0;
  const away = world.moving && !world.driving && dist > 2 && dist >= t.lastDist - 0.01;
  const poking = performance.now() - pokeClock.last < 2500;
  if (away || poking) t.exploring += dt;
  else t.onTask += dt;
  t.lastDist = dist;
}

function smooth01(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

function startReach(x: number, y: number, z: number, dur: number) {
  world.reach.x = x;
  world.reach.y = y;
  world.reach.z = z;
  world.reach.t = 0;
  world.reach.dur = dur;
}

function stepReach(dt: number) {
  const r = world.reach;
  if (r.dur <= 0) return;
  r.t += dt;
  const k = r.t / r.dur;
  // Up to the handle over the first half, hold, then let go.
  r.w = k < 0.5 ? smooth01(k / 0.5) : 1 - smooth01((k - 0.75) / 0.25);
  if (world.entering >= 0 && k >= 0.62) {
    const car = world.entering;
    world.entering = -1;
    r.dur = 0;
    r.w = 0;
    playSfx("sfx-poke", 0.5);
    takeCar(car);
    return;
  }
  if (k >= 1) {
    r.dur = 0;
    r.w = 0;
  }
}

function takeCar(index: number) {
  if (index > 0) {
    const held = { ...fleet[0] };
    fleet[0].x = fleet[index].x;
    fleet[0].z = fleet[index].z;
    fleet[0].yaw = fleet[index].yaw;
    fleet[0].color = fleet[index].color;
    fleet[0].kind = fleet[index].kind;
    fleet[index].x = held.x;
    fleet[index].z = held.z;
    fleet[index].yaw = held.yaw;
    fleet[index].color = held.color;
    fleet[index].kind = held.kind;
  }
  world.carX = fleet[0].x;
  world.carZ = fleet[0].z;
  world.carYaw = fleet[0].yaw;
  world.carSpeed = 0;
  world.driving = true;
  world.px = world.carX;
  world.pz = world.carZ;
  world.py = 0;
  world.camYaw = world.carYaw;
  world.barkT = 4.5;
  caption.who = "Narrator";
  caption.text = "Company car. Hold the up arrow to drive. Left and right steer. It won't slide off the dock.";
  caption.t = 5;
  useHarbor.getState().setBark({ who: "Narrator", text: caption.text });
  blip(160);
}

function tryInteract() {
  const store = useHarbor.getState();
  const action = world.use;
  if (action.startsWith("toy:") || action.startsWith("find:")) {
    mondayUse(action);
    return;
  }
  if (action === "out") {
    fleet[0].x = world.carX;
    fleet[0].z = world.carZ;
    fleet[0].yaw = world.carYaw;
    world.driving = false;
    world.carSpeed = 0;
    world.px = world.carX;
    world.pz = -3.4;
    world.py = 0;
    blip(190);
    return;
  }
  if (action === "car") {
    const car = nearestFleet(world.px, world.pz, 8);
    if (car < 0) return;
    // Close enough to the driver's door: reach for the handle first, then get in.
    const h = carHandle(car);
    if (Math.hypot(world.px - h.x, world.pz - h.z) < 2.6) {
      world.entering = car;
      world.face = Math.atan2(h.z - world.pz, h.x - world.px);
      startReach(h.x, h.y, h.z, 0.6);
    } else takeCar(car);
    return;
  }
  if (action.startsWith("gate-")) {
    const lane = Number(action.slice(5)) - 1;
    if (lane >= 0 && lane < 4) {
      world.laneOpen[lane] = 1;
      world.laneHold[lane] = 2.5;
      blip(720);
    }
    return;
  }
  if (action === "door") {
    // v2: talk to the courier at the door (docs/MONDAY_V2.md). v1 panel is the fallback.
    if (showApp("door")) {
      useHarbor.setState({ beat: "door" });
      sayNext("door");
      world.badgeOut = 1;
      world.reader = "red";
      world.doorOpen = 0;
      blip(420);
      return;
    }
    useHarbor.setState({
      beat: "door",
      talk: {
        who: "Courier",
        role: "At the tower door · he has no badge",
        text: "Hey, can you grab the door? My badge is back in the van. I'm double-parked out there. Two seconds, I swear.",
        choices: [
          { id: "door-hold", label: "Hold it open for him" },
          { id: "door-shut", label: "Let the door close" },
        ],
      },
    });
    sayNext("door");
    world.badgeOut = 1;
    world.reader = "red";
    world.doorOpen = 0;
    blip(420);
    return;
  }
  if (action === "badge") {
    // Hand on the door's pull as it swings open.
    startReach(world.px < DOOR.x ? DOOR.x - 0.32 : DOOR.x + 0.32, 1.05, DOOR.z + 0.12, 0.9);
    world.doorOpen = 1;
    world.reader = "green";
    blip(720);
    store.setBark({ who: "Reader", text: "Green. That's your badge. His card never did that." });
    world.barkT = 4.5;
    return;
  }
  if (action === "up" || action === "down") {
    beginRide(action === "up");
    return;
  }
  if (action === "updates") {
    // v2 beats open as apps; the v1 panel stays as the fallback.
    if (showApp("updates")) {
      sayNext("updates");
      blip(420);
      return;
    }
    store.openPanel("updates");
    sayNext("updates");
    blip(420);
    return;
  }
  if (action === "cleandesk") {
    if (showApp("cleandesk")) {
      blip(420);
      return;
    }
    store.openPanel("cleandesk");
    blip(420);
    return;
  }
  if (action === "mail") {
    // v2: glide onto the monitor and open the real inbox (see docs/MONDAY_V2.md).
    // Falls back to the v1 choice panel if the desk screen isn't registered.
    if (enterFocus("desk", "mail")) {
      world.barkT = 6;
      store.setBark({ who: "Narrator", text: "Your inbox. Work it like you would at work. Anything off, report it." });
      blip(480);
      return;
    }
    store.openPanel("mail");
    say("mail");
    blip(480);
    return;
  }
  if (action === "phone") {
    // v2: the call is a conversation (docs/MONDAY_V2.md). v1 panel is the fallback.
    if (showApp("phone")) {
      setRing(false);
      sayNext("phone"); // the v1 opening line is the same as the call's first line
      return;
    }
    store.openPanel("phone");
    sayNext("phone");
    blip(520);
    return;
  }
  if (action === "usb") {
    // v2: look at it, call IT, decide (docs/MONDAY_V2.md). v1 panel is the fallback.
    if (showApp("usb")) {
      sayNext("usb");
      blip(360);
      return;
    }
    store.openPanel("usb");
    sayNext("usb");
    blip(360);
    return;
  }
  if (action === "maya") {
    if (showApp("wire")) {
      sayNext("maya");
      blip(420);
      return;
    }
    store.openPanel("maya");
    sayNext("maya");
    blip(420);
    return;
  }
  if (action === "reception") {
    useHarbor.setState({
      talk: {
        who: "June Park",
        role: "Reception · she is at the lobby desk",
        text: "Hi, you must be the new hire. You're on my list for fourteen. Elevator's straight back, gold doors. Badge yourself up.",
        choices: [{ id: "reception-ok", label: "I'll badge myself. Where's the elevator?" }],
      },
    });
    sayNext("reception");
    blip(300);
  }
}

const LAPTOP = { x: 4.7, z: -8.8 };
const PRINTER = { x: 8.13, z: -15.8 };

function computePrompt(): string | null {
  const store = useHarbor.getState();
  world.use = "";
  if (store.talk || store.paused || store.boot || store.report) return null;
  if (world.driving) {
    if (Math.abs(world.carSpeed) < 1.6) {
      world.use = "out";
      return "E  ·  Get out";
    }
    return "↑ drives  ·  ← → steers";
  }
  if (world.ride === "board") return "Walk into the cab";
  if (world.ride === "out" && inCab()) return "Step out of the elevator";
  if (world.ride !== "idle") return null;
  const x = world.px;
  const z = world.pz;
  if (world.py < 2 && nearestFleet(x, z, 7.5) >= 0) {
    world.use = "car";
    return "E  ·  Get in the car";
  }
  if ((store.beat === "tower" || store.beat === "door") && !store.flags.door && world.py < 2 && dist(x, z, DOOR) < 3.8) {
    world.use = "door";
    world.badgeOut = 1;
    world.reader = "red";
    return "E  ·  Courier at the door";
  }
  if (store.flags.door && world.doorOpen < 0.4 && world.py < 2 && !insideTower(x, z) && dist(x, z, DOOR) < 4) {
    world.use = "badge";
    return "E  ·  Badge in";
  }
  if (world.py < 3) {
    for (const point of world.gatePoints) {
      if (dist(x, z, point) < 1.15 && world.laneT[point.lane - 1] < 0.2) {
        world.use = `gate-${point.lane}`;
        return "E  ·  Badge the gate";
      }
    }
  }
  if (store.beat === "lobby" && world.py < 2 && dist(x, z, { x: world.callX, z: world.callZ }) < 1.8 && insideTower(x, z)) {
    world.use = "up";
    return "E  ·  Badge the elevator";
  }
  if (store.beat === "down" && world.py > 10 && dist(x, z, ELEVATOR) < 2.8) {
    world.use = "down";
    return "E  ·  Elevator down";
  }
  if (store.beat === "desk" && world.py > 10 && dist(x, z, DESK) < 2.6) {
    world.use = "mail";
    return "E  ·  Email on your desk";
  }
  if (store.beat === "phone" && world.py > 10 && dist(x, z, DESK) < 2.8) {
    world.use = "phone";
    return "E  ·  Answer the phone";
  }
  if (store.beat === "usb" && world.py > 10 && dist(x, z, USB) < 2.6) {
    world.use = "usb";
    return "E  ·  USB on the counter";
  }
  if (store.beat === "updates" && !store.flags.updates && world.py > 10 && dist(x, z, LAPTOP) < 1.4) {
    world.use = "updates";
    return "E  ·  Loaner laptop";
  }
  if (store.beat === "maya" && world.py > 10 && dist(x, z, MAYA) < 2.8) {
    world.use = "maya";
    return "E  ·  Maya Ruiz, finance";
  }
  if (store.beat === "cleandesk" && !store.flags.cleandesk && world.py > 10 && dist(x, z, PRINTER) < 1.6) {
    world.use = "cleandesk";
    return "E  ·  Printouts on the printer";
  }
  // Optional toys and finds, only when no beat above was in reach.
  const level = world.py > 10 ? "f14" : world.py < 2 && insideTower(x, z) ? "lobby" : null;
  if (level) {
    const near = mondayNearby(x, z, level);
    if (near) {
      world.use = near.use;
      return near.prompt;
    }
  }
  if (store.beat === "leave" && world.py < 2) return "Walk out the front door";
  if (world.py < 2 && insideTower(x, z)) {
    world.use = "reception";
    return "E  ·  June Park, reception";
  }
  return null;
}

export function markerNow(): { x: number; y: number; z: number } | null {
  const store = useHarbor.getState();
  if (store.report || store.boot) return null;
  // Nothing to point at while the cab is moving.
  if (world.ride === "hold" || world.ride === "shut" || world.ride === "ride") return null;
  const beat = store.beat;
  const outside = world.py < 2 && world.pz < 2.2;
  const inLobby = world.py < 2 && insideTower(world.px, world.pz);
  const inOffice = world.py > 10;
  if (beat === "tower" || beat === "door") return { x: DOOR.x, y: 0, z: DOOR.z };
  if (beat === "lobby") {
    if (outside) return { x: DOOR.x, y: 0, z: 0.2 };
    return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
  }
  if (beat === "desk" || beat === "phone" || beat === "misdirect" || beat === "signin") {
    if (inOffice) return { x: DESK.x, y: OFFICE_Y, z: DESK.z };
    if (inLobby) return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
    return { x: DOOR.x, y: 0, z: 0.2 };
  }
  if (beat === "usb") {
    if (inOffice) return { x: USB.x, y: OFFICE_Y, z: USB.z };
    if (inLobby) return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
    return { x: DOOR.x, y: 0, z: 0.2 };
  }
  if (beat === "updates") {
    if (inOffice) return { x: LAPTOP.x, y: OFFICE_Y, z: LAPTOP.z };
    if (inLobby) return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
    return { x: DOOR.x, y: 0, z: 0.2 };
  }
  if (beat === "maya" || beat === "down") {
    if (inOffice) return { x: beat === "maya" ? MAYA.x : ELEVATOR.x, y: OFFICE_Y, z: beat === "maya" ? MAYA.z : ELEVATOR.z };
    if (inLobby) return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
    return { x: DOOR.x, y: 0, z: 0.2 };
  }
  if (beat === "cleandesk") {
    if (inOffice) return { x: PRINTER.x, y: OFFICE_Y, z: PRINTER.z };
    if (inLobby) return { x: ELEVATOR.x, y: 0, z: ELEVATOR.z };
    return { x: DOOR.x, y: 0, z: 0.2 };
  }
  if (beat === "leave") return { x: DOOR.x, y: 0, z: 0.2 };
  return null;
}

function publishProbe() {
  if (typeof window === "undefined") return;
  const win = window as unknown as { __controlsTest?: Record<string, unknown> };
  win.__controlsTest = {
    getYaw: () => (world.driving ? world.carYaw : world.face),
    getSpeed: () => (world.driving ? world.carSpeed : world.speed),
    getPitch: () => world.camPitch,
    getX: () => (world.driving ? world.carX : world.px),
    getZ: () => (world.driving ? world.carZ : world.pz),
    driving: () => world.driving,
    setKeys: (codes: string[]) => {
      const held = new Set(codes);
      keys.w = held.has("KeyW") || held.has("ArrowUp") || held.has("Numpad8");
      keys.a = held.has("KeyA") || held.has("ArrowLeft") || held.has("Numpad4");
      keys.s = held.has("KeyS") || held.has("ArrowDown") || held.has("Numpad2");
      keys.d = held.has("KeyD") || held.has("ArrowRight") || held.has("Numpad6");
      keys.left = held.has("KeyJ") || held.has("KeyQ");
      keys.right = held.has("KeyL");
      keys.up = held.has("KeyI");
      keys.down = held.has("KeyK");
      keys.run = held.has("ShiftLeft") || held.has("ShiftRight");
    },
    setStick: (x: number, y: number) => {
      world.stickX = x;
      world.stickY = y;
    },
    enterCar: () => {
      world.py = 0;
      world.px = fleet[0].x;
      world.pz = fleet[0].z;
      takeCar(0);
    },
    dismiss: () => useHarbor.getState().setBoot(false),
    teleport: (x: number, y: number, z: number) => {
      world.px = x;
      world.py = y;
      world.pz = z;
      world.driving = false;
    },
    interact: () => {
      world.wantInteract = true;
    },
    talkWho: () => useHarbor.getState().talk?.who ?? "",
    boot: () => useHarbor.getState().boot,
    tick: (n: number) => {
      for (let i = 0; i < n; i += 1) step(1 / 60);
    },
    setView: (yaw: number, pitch: number) => {
      world.camYaw = yaw;
      world.camPitch = pitch;
      world.snap = true;
    },
    faceCamera: () => {
      world.face = world.camYaw + Math.PI;
    },
    setPitch: (pitch: number) => {
      world.camPitch = pitch;
    },
    ride: (up: boolean) => beginRide(up),
    state: () => ({
      ride: world.ride,
      indicator: world.indicator,
      py: world.py,
      pz: world.pz,
      door: world.elevDoor,
      lanes: [...world.laneT],
      guy: [world.guyX, world.guyZ, world.guyVisible],
      car: { ...fleet[0] },
      driving: world.driving,
      reach: { ...world.reach },
    }),
  };
}
