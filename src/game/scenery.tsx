import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MeshBVH } from "three-mesh-bvh";
import * as THREE from "three";
import { setWorldHit, setWorldLive } from "@/game/layout";
import { useHarbor, world } from "@/game/state";

export const MODEL_BASE = "/assets/models/";
export const MODEL_FALLBACK = "https://raw.githubusercontent.com/andrew-baggiani/harbor-game/main/assets/models/";
export const GLTF_LIGHT_SCALE = 0.000055;
const SIMPLE_GLASS = true;

const FILES = ["harbor_block.glb", "harbor_office_f14.glb", "harbor_props.glb", "vehicle_Company_Sedan_Navy.glb"] as const;

for (const file of FILES) useGLTF.preload(`${MODEL_BASE}${file}`);

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
    if (light.isLight && !data.harborScaled) {
      light.intensity *= GLTF_LIGHT_SCALE;
      light.castShadow = false;
      const point = light as THREE.PointLight;
      if (point.isPointLight || (light as THREE.SpotLight).isSpotLight) {
        if (!point.distance) point.distance = 32;
        point.decay = 2;
      }
      data.harborScaled = true;
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
    const data = obj.userData as { collider?: string; surface?: string; role?: string };
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

function showLed(root: THREE.Object3D, which: "off" | "red" | "green") {
  const off = root.getObjectByName("BadgeReader_LED_Off");
  const red = root.getObjectByName("BadgeReader_LED_Red");
  const green = root.getObjectByName("BadgeReader_LED_Green");
  if (off) off.visible = which === "off";
  if (red) red.visible = which === "red";
  if (green) green.visible = which === "green";
}

export function HarborWorld() {
  const block = useGLTF(`${MODEL_BASE}harbor_block.glb`);
  const office = useGLTF(`${MODEL_BASE}harbor_office_f14.glb`);
  const props = useGLTF(`${MODEL_BASE}harbor_props.glb`);
  const car = useGLTF(`${MODEL_BASE}vehicle_Company_Sedan_Navy.glb`);
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
  const elevatorOpen = useRef({ lobby: 0, floor: 0 });

  const scenes = useMemo(() => {
    for (const gltf of [block, office, props, car]) prepare(gltf.scene);
    const parked = block.scene.getObjectByName("Company_Sedan_Navy");
    if (parked) parked.visible = false;
    props.scene.visible = true;
    props.scene.traverse((obj) => {
      obj.visible = false;
    });
    props.scene.visible = true;
    return { block: block.scene, office: office.scene, props: props.scene, car: car.scene };
  }, [block, office, props, car]);

  useLayoutEffect(() => {
    colliders.length = 0;
    collect(block.scene);
    collect(office.scene);
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
    ]
      .map((name) => block.scene.getObjectByName(name) ?? office.scene.getObjectByName(name))
      .filter((node): node is THREE.Object3D => !!node);
    for (const door of elev.current) {
      door.userData.baseX = door.position.x;
    }
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
  }, [block.scene, office.scene, car.scene]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const left = doors.current.left;
    const right = doors.current.right;
    if (left) {
      const deg = Number(left.userData.open_deg ?? 90);
      left.rotation.y = THREE.MathUtils.degToRad(deg) * world.doorOpen;
    }
    if (right) {
      const deg = Number(right.userData.open_deg ?? -90);
      right.rotation.y = THREE.MathUtils.degToRad(deg) * world.doorOpen;
    }
    showLed(block.scene, world.reader);

    const nearLobby = world.py < 8 && Math.hypot(world.px - 1.5, world.pz + 15.8) < 3.6;
    const nearFloor = world.py > 40 && Math.hypot(world.px - 1.5, world.pz + 15.4) < 3.6;
    const lobbyTarget = world.transition === "up" || nearLobby ? 1 : 0;
    const floorTarget = world.transition === "down" || nearFloor ? 1 : 0;
    elevatorOpen.current.lobby += (lobbyTarget - elevatorOpen.current.lobby) * Math.min(1, dt * 3);
    elevatorOpen.current.floor += (floorTarget - elevatorOpen.current.floor) * Math.min(1, dt * 3);
    for (const door of elev.current) {
      const level = door.userData.level;
      const amount = level === 14 || level === "14" ? elevatorOpen.current.floor : elevatorOpen.current.lobby;
      const base = Number(door.userData.baseX ?? door.position.x);
      const slide = Number(door.userData.slide_dist ?? 0);
      door.position.x = base + slide * amount;
    }

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
