import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { preloadGLTF, useGLTFOnce } from "@/game/models";
import { MeshBVH } from "three-mesh-bvh";
import * as THREE from "three";
import { variantOf } from "@/game/scenarios";
import { setWorldHit, setWorldLive } from "@/game/layout";
import { useHarbor, world } from "@/game/state";

export const MODEL_BASE = "/assets/models/";

// Kick off every model download at once; the component then suspends on each in turn.
preloadGLTF([
  `${MODEL_BASE}harbor_block.glb`,
  `${MODEL_BASE}harbor_office_f14.glb`,
  `${MODEL_BASE}harbor_props.glb`,
  `${MODEL_BASE}vehicle_Company_Sedan_Navy.glb`,
  `${MODEL_BASE}harbor_lobby_detail.glb`,
  `${MODEL_BASE}harbor_f14_detail.glb`,
  `${MODEL_BASE}harbor_elevator_cab.glb`,
  `${MODEL_BASE}harbor_shaft_cut.glb`,
  `${MODEL_BASE}harbor_security_props.glb`,
  `${MODEL_BASE}harbor_monday_beats.glb`,
]);
export const MODEL_FALLBACK = "https://raw.githubusercontent.com/andrew-baggiani/harbor-game/main/assets/models/";
export const GLTF_LIGHT_SCALE = 0.000055;
const SIMPLE_GLASS = true;

type Entry = {
  object: THREE.Object3D;
  kind: "box" | "mesh";
  mesh?: THREE.Mesh;
  tree?: MeshBVH;
  dynamic: boolean;
  box: THREE.Box3;
};

const colliders: Entry[] = [];
let ready = false;

export function sceneryReady() {
  return ready;
}

const _center = new THREE.Vector3();
const _local = new THREE.Vector3();
const _sphere = new THREE.Sphere();
const _inv = new THREE.Matrix4();

function hitScenery(x: number, z: number, y: number, radius: number) {
  if (!ready) return false;
  const samples = [y + 0.45, y + 1.05];
  for (const entry of colliders) {
    if (entry.kind === "box") {
      const box = entry.dynamic ? entry.box.setFromObject(entry.object) : entry.box;
      for (const sy of samples) {
        _center.set(x, sy, z);
        if (box.distanceToPoint(_center) < radius) return true;
      }
    } else if (entry.tree && entry.mesh) {
      const mesh = entry.mesh;
      mesh.updateWorldMatrix(true, false);
      _inv.copy(mesh.matrixWorld).invert();
      const scale = mesh.matrixWorld.getMaxScaleOnAxis() || 1;
      for (const sy of samples) {
        _local.set(x, sy, z).applyMatrix4(_inv);
        _sphere.center.copy(_local);
        _sphere.radius = radius / scale;
        if (entry.tree.intersectsSphere(_sphere)) return true;
      }
    }
  }
  return false;
}

setWorldHit(hitScenery);

function prepare(root: THREE.Object3D) {
  root.traverse((obj) => {
    const data = obj.userData as Record<string, unknown>;
    const light = obj as THREE.Light;
    if (light.isLight && data.harborLit !== 2) {
      if (!data.harborScaled) {
        light.intensity *= GLTF_LIGHT_SCALE;
        light.castShadow = false;
        const point = light as THREE.PointLight;
        const spot = light as THREE.SpotLight;
        if (point.isPointLight || spot.isSpotLight) {
          if (!point.distance) point.distance = 32;
          point.decay = 2;
        }
        data.harborScaled = true;
      }
      const point = light as THREE.PointLight;
      const spot = light as THREE.SpotLight;
      const lamp = obj.name;
      if (lamp.startsWith("Street_Sodium") || lamp.startsWith("Quay_Mast")) {
        light.color.set("#ff9d45");
        light.intensity = lamp.startsWith("Quay_Mast") ? 180 : 120;
        if (spot.isSpotLight) {
          spot.distance = 28;
          spot.angle = Math.max(spot.angle, 1.05);
          spot.penumbra = 0.65;
          spot.decay = 2;
        }
      } else if (lamp.startsWith("Lobby_Light") || lamp.startsWith("F14_")) {
        light.color.set("#e7eef8");
        light.intensity = 12;
        if (point.isPointLight) point.distance = 16;
      } else if (lamp.startsWith("Ship_Deck")) {
        light.color.set("#d5e4f2");
        light.intensity = 36;
        if (point.isPointLight) point.distance = 24;
      }
      data.harborLit = 2;
    }
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const physical = material as THREE.MeshPhysicalMaterial;
      if (SIMPLE_GLASS && physical.transmission > 0) {
        physical.transmission = 0;
        physical.transparent = true;
        physical.opacity = 0.25;
        physical.roughness = Math.min(physical.roughness, 0.12);
        physical.metalness = Math.min(physical.metalness, 0.08);
        physical.depthWrite = false;
      }
    }
  });
}

function collect(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!shown(obj)) return;
    const data = obj.userData as { collider?: string; surface?: string; role?: string; default_visible?: boolean };
    if (data.default_visible === false) return;
    if (data.collider !== "mesh" && data.collider !== "box") return;
    if (data.surface === "asphalt_wet" || data.surface === "concrete" || data.surface === "water") return;
    if (data.role === "glazing" || data.role === "vehicle") return;
    const dynamic = data.role === "door" || data.role === "elevator_door";
    if (data.collider === "box") {
      colliders.push({ object: obj, kind: "box", dynamic, box: new THREE.Box3().setFromObject(obj) });
      return;
    }
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const tree = new MeshBVH(mesh.geometry);
      colliders.push({ object: obj, kind: "mesh", mesh, tree, dynamic: false, box: new THREE.Box3() });
    });
  });
}

function shown(obj: THREE.Object3D) {
  for (let node: THREE.Object3D | null = obj; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

function applyDefaultVisible(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj.userData as { default_visible?: boolean }).default_visible === false) obj.visible = false;
  });
}

function hideNamed(root: THREE.Object3D, name: string) {
  const node = root.getObjectByName(name);
  if (node) node.visible = false;
}

let blinkT = 0;

function showCabReadout(root: THREE.Object3D) {
  const floors = ["L", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"];
  for (const floor of floors) {
    const node = root.getObjectByName(`Elevator_Cab_Indicator_${floor}`);
    if (node) node.visible = floor === world.indicator;
  }
  const up = root.getObjectByName("Elevator_Cab_Indicator_Up");
  const down = root.getObjectByName("Elevator_Cab_Indicator_Down");
  if (up) up.visible = world.arrow === "up";
  if (down) down.visible = world.arrow === "down";
  for (const floor of ["14", "L"] as const) {
    const lit = root.getObjectByName(`Elevator_Cab_Button_${floor}_Lit`);
    const unlit = root.getObjectByName(`Elevator_Cab_Button_${floor}_Unlit`);
    const on = world.cabButton === floor;
    if (lit) lit.visible = on;
    if (unlit) unlit.visible = !on;
  }
}

function findNamed(roots: THREE.Object3D[], name: string) {
  for (const root of roots) {
    const node = root.getObjectByName(name);
    if (node) return node;
  }
  return null;
}

function showLanding(block: THREE.Object3D, office: THREE.Object3D, floor: THREE.Object3D, lobby: THREE.Object3D) {
  const roots = [block, office, floor, lobby];
  const pair = (litName: string, unlitName: string, on: boolean) => {
    const lit = findNamed(roots, litName);
    const unlit = findNamed(roots, unlitName);
    if (lit) lit.visible = on;
    if (unlit) unlit.visible = !on;
  };
  const atLobby = world.cabY < 10;
  pair("Elevator_Lobby_A_CallButton_Lit", "Elevator_Lobby_A_CallButton_Unlit", world.callLit && atLobby);
  pair("Elevator_F14_A_CallButton_Lit", "Elevator_F14_A_CallButton_Unlit", world.callLit && !atLobby);
  const lantern = (prefix: string, active: boolean, idle: "Up" | "Down") => {
    const shown = active && world.arrow === "up" ? `${prefix}_Up_Lit` : active && world.arrow === "down" ? `${prefix}_Down_Lit` : `${prefix}_${idle}_Unlit`;
    for (const name of [`${prefix}_Up_Lit`, `${prefix}_Up_Unlit`, `${prefix}_Down_Lit`, `${prefix}_Down_Unlit`]) {
      const node = findNamed(roots, name);
      if (node) node.visible = name === shown;
    }
  };
  lantern("Elevator_Lobby_A_Lantern", atLobby && world.arrow !== "", "Up");
  lantern("Elevator_F14_A_Lantern", !atLobby && world.arrow !== "", "Down");
  const lobbyL = findNamed(roots, "Elevator_Lobby_A_Indicator_L");
  const lobby14 = findNamed(roots, "Elevator_Lobby_A_Indicator_14");
  if (lobbyL) lobbyL.visible = true;
  if (lobby14) lobby14.visible = false;
  const floorL = findNamed(roots, "Elevator_F14_A_Indicator_L");
  const floor14 = findNamed(roots, "Elevator_F14_A_Indicator_14");
  if (floorL) floorL.visible = false;
  if (floor14) floor14.visible = true;
}

function showNamed(root: THREE.Object3D, name: string, visible: boolean) {
  if (!name) return;
  const node = root.getObjectByName(name);
  if (node) node.visible = visible;
}

function showMondayBeats(root: THREE.Object3D, floor: THREE.Object3D) {
  const updates = variantOf("MON-06-updates");
  const signin = variantOf("MON-07-signin");
  const mail = variantOf("MON-08-misdirect");
  const desk = variantOf("MON-09-cleandesk");
  showNamed(root, "Beat_Updates_Screen_Normal", world.updatesScreen === "normal");
  showNamed(root, updates?.screen_node ?? "", world.updatesScreen === "warn");
  showNamed(root, updates?.screen_node === "Beat_Updates_Screen_Warn_A" ? "Beat_Updates_Screen_Warn_B" : "Beat_Updates_Screen_Warn_A", false);
  showNamed(root, "Beat_Updates_Screen_Ticket", world.updatesScreen === "ticket");
  showNamed(root, "Beat_Signin_Phone_Screen_Dark", world.signinScreen === "dark");
  showNamed(root, signin?.screen_node ?? "", world.signinScreen === "alert");
  showNamed(root, signin?.screen_node === "Beat_Signin_Phone_Screen_Alert_A" ? "Beat_Signin_Phone_Screen_Alert_B" : "Beat_Signin_Phone_Screen_Alert_A", false);
  showNamed(root, "Beat_Signin_Phone_Screen_Secured", world.signinScreen === "secured");
  for (const name of ["Beat_Misdirect_Screen_Compose_A", "Beat_Misdirect_Screen_Compose_B", "Beat_Misdirect_Screen_Sent_A", "Beat_Misdirect_Screen_Sent_B"]) {
    showNamed(root, name, false);
  }
  if (world.misdirectScreen === "compose") showNamed(root, mail?.compose_node ?? "", true);
  if (world.misdirectScreen === "sent") showNamed(root, mail?.sent_node ?? "", true);
  showNamed(root, "Beat_CleanDesk_Printouts_A", world.printouts && desk?.printout_node === "Beat_CleanDesk_Printouts_A");
  showNamed(root, "Beat_CleanDesk_Printouts_B", world.printouts && desk?.printout_node === "Beat_CleanDesk_Printouts_B");
  showNamed(root, "Beat_CleanDesk_Sticky_Player", world.playerSticky);
  showNamed(root, "Beat_CleanDesk_PlayerScreen_Locked", world.lockScreen && desk?.lock_node === "Beat_CleanDesk_PlayerScreen_Locked");
  showNamed(root, "Beat_CleanDesk_Desk07Screen_Locked", world.lockScreen && desk?.lock_node === "Beat_CleanDesk_Desk07Screen_Locked");
  const note = floor.getObjectByName("Sticky_Password_Desk07");
  if (note) note.visible = world.desk07Note && desk?.sticky_node === "Sticky_Password_Desk07";
  const phone = root.getObjectByName("Beat_Signin_Phone");
  if (phone) {
    if (phone.userData.baseY == null) phone.userData.baseY = phone.position.y;
    const base = Number(phone.userData.baseY);
    phone.position.y = world.buzz > 0 ? base + Math.sin(world.buzz * 46) * 0.012 : base;
  }
}

function blinkRacks(root: THREE.Object3D, dt: number) {
  blinkT += dt;
  const a = root.getObjectByName("ServerRack_LEDs_A");
  const b = root.getObjectByName("ServerRack_LEDs_B");
  if (a) a.visible = Math.sin(blinkT * Math.PI * 2 * 2) > 0;
  if (b) b.visible = Math.sin(blinkT * Math.PI * 2 * 1.3 + Math.PI) > 0;
}

function showLed(root: THREE.Object3D, which: "off" | "red" | "green") {
  const off = root.getObjectByName("BadgeReader_LED_Off");
  const red = root.getObjectByName("BadgeReader_LED_Red");
  const green = root.getObjectByName("BadgeReader_LED_Green");
  if (off) off.visible = which === "off";
  if (red) red.visible = which === "red";
  if (green) green.visible = which === "green";
}

export function HarborWorld() {
  const block = useGLTFOnce(`${MODEL_BASE}harbor_block.glb`);
  const office = useGLTFOnce(`${MODEL_BASE}harbor_office_f14.glb`);
  const props = useGLTFOnce(`${MODEL_BASE}harbor_props.glb`);
  const car = useGLTFOnce(`${MODEL_BASE}vehicle_Company_Sedan_Navy.glb`);
  const lobbyDetail = useGLTFOnce(`${MODEL_BASE}harbor_lobby_detail.glb`);
  const floorDetail = useGLTFOnce(`${MODEL_BASE}harbor_f14_detail.glb`);
  const cab = useGLTFOnce(`${MODEL_BASE}harbor_elevator_cab.glb`);
  const shaft = useGLTFOnce(`${MODEL_BASE}harbor_shaft_cut.glb`);
  const security = useGLTFOnce(`${MODEL_BASE}harbor_security_props.glb`);
  const beats = useGLTFOnce(`${MODEL_BASE}harbor_monday_beats.glb`);
  const beat = useHarbor((s) => s.beat);
  const doors = useRef<{ left: THREE.Object3D | null; right: THREE.Object3D | null; openL: number; openR: number }>({
    left: null,
    right: null,
    openL: 0,
    openR: 0,
  });
  const elev = useRef<THREE.Object3D[]>([]);
  const carRoot = useRef<THREE.Object3D | null>(null);
  const wheels = useRef<{ steer: boolean; bone: THREE.Object3D; rest: THREE.Quaternion }[]>([]);
  const spin = useRef(0);
  const flaps = useRef<{ node: THREE.Object3D; lane: number; deg: number }[]>([]);
  const cabRoot = useRef<THREE.Object3D | null>(null);

  const scenes = useMemo(() => {
    const loaded = [block, office, props, car, lobbyDetail, floorDetail, cab, shaft, security, beats];
    for (const gltf of loaded) prepare(gltf.scene);
    for (const gltf of [lobbyDetail, floorDetail, cab, shaft, security, beats]) applyDefaultVisible(gltf.scene);
    beats.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -1;
      }
    });
    const parked = block.scene.getObjectByName("Company_Sedan_Navy");
    if (parked) parked.visible = false;
    hideNamed(block.scene, "Harbor_Tower");
    hideNamed(block.scene, "Lobby_Interior");
    hideNamed(office.scene, "Office_F14_Shell");
    props.scene.visible = true;
    props.scene.traverse((obj) => {
      obj.visible = false;
    });
    props.scene.visible = true;
    security.scene.visible = false;
    cab.scene.visible = false;
    return {
      block: block.scene,
      office: office.scene,
      props: props.scene,
      car: car.scene,
      lobby: lobbyDetail.scene,
      floor: floorDetail.scene,
      cab: cab.scene,
      shaft: shaft.scene,
      security: security.scene,
      beats: beats.scene,
    };
  }, [block, office, props, car, lobbyDetail, floorDetail, cab, shaft, security, beats]);

  useLayoutEffect(() => {
    colliders.length = 0;
    collect(block.scene);
    collect(office.scene);
    collect(lobbyDetail.scene);
    collect(floorDetail.scene);
    cab.scene.visible = true;
    collect(cab.scene);
    cab.scene.visible = false;
    collect(shaft.scene);
    collect(beats.scene);
    ready = true;
    setWorldLive(true);
    const left = block.scene.getObjectByName("Lobby_Door_L");
    const right = block.scene.getObjectByName("Lobby_Door_R");
    doors.current.left = left ?? null;
    doors.current.right = right ?? null;
    elev.current = [
      "Elevator_Lobby_A_Door_L",
      "Elevator_Lobby_A_Door_R",
      "Elevator_F14_A_Door_L",
      "Elevator_F14_A_Door_R",
      "Elevator_Cab_Door_L",
      "Elevator_Cab_Door_R",
    ]
      .map((name) => block.scene.getObjectByName(name) ?? office.scene.getObjectByName(name) ?? cab.scene.getObjectByName(name))
      .filter((node): node is THREE.Object3D => !!node);
    for (const door of elev.current) {
      door.userData.baseX = door.position.x;
      if (door.name.startsWith("Elevator_Cab")) door.userData.cab = true;
    }
    flaps.current = [];
    lobbyDetail.scene.traverse((obj) => {
      const data = obj.userData as { role?: string; lane?: number; open_deg?: number };
      if (data.role !== "turnstile") return;
      flaps.current.push({ node: obj, lane: Number(data.lane ?? 1), deg: Number(data.open_deg ?? 90) });
    });
    cabRoot.current = cab.scene.getObjectByName("Elevator_Cab") ?? cab.scene;
    if (left && !left.userData.restQuat) left.userData.restQuat = left.quaternion.clone();
    if (right && !right.userData.restQuat) right.userData.restQuat = right.quaternion.clone();
    showLed(block.scene, "off");
    const root = car.scene.getObjectByName("Company_Sedan_Navy") ?? car.scene;
    carRoot.current = root;
    wheels.current = [];
    root.traverse((obj) => {
      if (!obj.name.includes("Wheel_")) return;
      const steer = obj.name.endsWith("_FL") || obj.name.endsWith("_FR");
      wheels.current.push({ steer, bone: obj, rest: obj.quaternion.clone() });
    });
    const envelope = office.scene.getObjectByName("Envelope_Mail");
    const ring = office.scene.getObjectByName("DeskPhone_RingLight");
    if (envelope) envelope.visible = false;
    if (ring) ring.visible = false;
    return () => {
      ready = false;
      setWorldLive(false);
      colliders.length = 0;
    };
  }, [block.scene, office.scene, car.scene, lobbyDetail.scene, floorDetail.scene, cab.scene, shaft.scene, beats.scene]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const left = doors.current.left;
    const right = doors.current.right;
    if (left) {
      const rest = left.userData.restQuat as THREE.Quaternion | undefined;
      if (rest) left.quaternion.copy(rest);
      const deg = Number(left.userData.open_deg ?? 90);
      left.rotateY(THREE.MathUtils.degToRad(deg) * world.doorOpen);
    }
    if (right) {
      const rest = right.userData.restQuat as THREE.Quaternion | undefined;
      if (rest) right.quaternion.copy(rest);
      const deg = Number(right.userData.open_deg ?? -90);
      right.rotateY(THREE.MathUtils.degToRad(deg) * world.doorOpen);
    }
    showLed(block.scene, world.reader);

    const at14 = world.cabY > 10;
    for (const door of elev.current) {
      const level = door.userData.level;
      const is14 = level === 14 || level === "14" || door.name.includes("F14");
      const isCab = door.userData.cab === true;
      const open = isCab || (is14 ? at14 : !at14) ? world.elevDoor : 0;
      const base = Number(door.userData.baseX ?? door.position.x);
      const slide = Number(door.userData.slide_dist ?? (door.name.endsWith("_L") ? -0.72 : 0.72));
      door.position.x = base + slide * open;
    }
    for (const flap of flaps.current) {
      const t = world.laneT[flap.lane - 1] ?? 0;
      flap.node.rotation.y = THREE.MathUtils.degToRad(flap.deg) * t;
      const readerOn = t > 0.15 ? "Green" : "Off";
      for (const state of ["Off", "Red", "Green"]) {
        const led = lobbyDetail.scene.getObjectByName(`Turnstile_L${flap.lane}_Reader_LED_${state}`);
        if (led) led.visible = state === readerOn;
      }
    }
    const points: { lane: number; x: number; z: number }[] = [];
    for (let lane = 1; lane <= 4; lane += 1) {
      const reader = lobbyDetail.scene.getObjectByName(`Turnstile_L${lane}_Reader`);
      if (!reader) continue;
      reader.getWorldPosition(_center);
      points.push({ lane, x: _center.x, z: _center.z });
    }
    world.gatePoints = points;

    const cabNode = cabRoot.current;
    if (cabNode) {
      cab.scene.visible = world.cabShown;
      cabNode.position.set(1.5, world.cabY, world.cabZ);
    }
    showCabReadout(cab.scene);
    showLanding(block.scene, office.scene, floorDetail.scene, lobbyDetail.scene);
    blinkRacks(floorDetail.scene, raw);
    showMondayBeats(beats.scene, floorDetail.scene);

    const envelope = office.scene.getObjectByName("Envelope_Mail");
    const ring = office.scene.getObjectByName("DeskPhone_RingLight");
    if (envelope) envelope.visible = beat === "desk";
    if (ring) ring.visible = beat === "phone";

    const card = props.scene.getObjectByName("Courier_BlankCard");
    if (card) {
      card.visible = world.badgeOut > 0 && world.guyVisible;
      card.position.set(world.guyX + 0.22, 1.2, world.guyZ + 0.28);
      card.rotation.set(-0.5, 0.2, 0.4);
    }
    const phone = props.scene.getObjectByName("Maya_Phone");
    const form = props.scene.getObjectByName("Wire_Form");
    const showMaya = beat === "maya";
    if (phone) {
      phone.visible = showMaya;
      phone.position.set(3.15, 51.15, -14.45);
    }
    if (form) {
      form.visible = showMaya;
      form.position.set(3.45, 51.2, -14.55);
    }

    const live = world.driving;
    const root = carRoot.current;
    if (root) {
      root.position.set(world.carX, -0.15, world.carZ);
      root.rotation.order = "YXZ";
      root.rotation.y = Math.PI / 2 - world.carYaw;
      root.rotation.z = live ? world.carRoll : 0;
    }
    spin.current += world.carSpeed * dt * 1.6;
    for (const wheel of wheels.current) {
      wheel.bone.quaternion.copy(wheel.rest);
      if (wheel.steer) wheel.bone.rotateY(world.wheelSteer);
      wheel.bone.rotateX(spin.current);
    }
  });

  return (
    <group>
      <primitive object={scenes.block} />
      <primitive object={scenes.office} />
      <primitive object={scenes.props} />
      <primitive object={scenes.car} />
      <primitive object={scenes.lobby} />
      <primitive object={scenes.floor} />
      <primitive object={scenes.shaft} />
      <primitive object={scenes.cab} />
      <primitive object={scenes.security} />
      <primitive object={scenes.beats} />
      <pointLight position={[0, 6.5, 26]} color="#9eb6cc" intensity={18} distance={42} decay={2} />
      <Ring />
    </group>
  );
}

function Ring() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.visible = !world.driving;
    mesh.current.position.set(world.carX, 0.06, world.carZ);
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.06;
    mesh.current.scale.set(s, s, 1);
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.15, 2.36, 40]} />
      <meshBasicMaterial color="#e7c48a" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
