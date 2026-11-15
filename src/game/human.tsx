import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { preloadGLTF, useGLTFOnce } from "@/game/models";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { world } from "@/game/state";

preloadGLTF(["/people/body.glb", "/people/idle.glb", "/people/walk.glb", "/people/jog.glb"]);

function plant(clip: THREE.AnimationClip) {
  const next = clip.clone();
  for (const track of next.tracks) {
    if (!track.name.endsWith("Hips.position")) continue;
    const values = track.values;
    const times = track.times;
    const keys = values.length / 3;
    if (times.length !== keys || keys < 2) continue;
    const x0 = values[0];
    const z0 = values[2];
    const z1 = values[values.length - 1];
    const t0 = times[0];
    const span = times[keys - 1] - t0 || 1;
    for (let k = 0; k < keys; k++) {
      const i = k * 3;
      const linearZ = z0 + (z1 - z0) * ((times[k] - t0) / span);
      values[i] -= x0;
      values[i + 2] -= linearZ;
    }
  }
  return next;
}

function paintAvatar(image: CanvasImageSource, tint: string, hair: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, 1024, 1024);
  const frame = ctx.getImageData(0, 0, 1024, 1024);
  const data = frame.data;
  const shirt = hexRgb(tint);
  const hairRgb = hexRgb(hair);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const x = (i / 4) % 1024;
    const y = (i / 4) / 1024;
    const logo = (x > 150 && x < 470 && y > 690 && y < 800) || (x < 530 && y > 660 && y < 900 && r + g + b > 240);
    const hairPix = Math.abs(r - 42) < 18 && Math.abs(g - 29) < 18 && Math.abs(b - 13) < 18;
    const shirtPix = logo || (x < 530 && y > 640 && y < 1010 && Math.abs(r - 33) < 36 && Math.abs(g - 33) < 36 && Math.abs(b - 44) < 40);
    if (hairPix) {
      const shade = 0.78 + ((r + g + b) / 140) * 0.28;
      const strand = 0.94 + Math.sin(x * 0.22 + y * 0.05) * 0.06;
      data[i] = clampByte(hairRgb[0] * shade * strand);
      data[i + 1] = clampByte(hairRgb[1] * shade * strand);
      data[i + 2] = clampByte(hairRgb[2] * shade * strand);
    } else if (logo) {
      data[i] = shirt[0];
      data[i + 1] = shirt[1];
      data[i + 2] = shirt[2];
    } else if (shirtPix) {
      const shade = 0.78 + ((r + g + b) / 170) * 0.28;
      const form = 1.05 - Math.min(1, Math.max(0, (y - 640) / 360)) * 0.16;
      data[i] = clampByte(shirt[0] * shade * form);
      data[i + 1] = clampByte(shirt[1] * shade * form);
      data[i + 2] = clampByte(shirt[2] * shade * form);
    } else if (x > 520 && y > 68 && y < 430) {
      const lum = r * 0.3 + g * 0.5 + b * 0.2;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      let rr = r;
      let gg = g;
      let bb = b;
      if (y < 255 && lum < 48) {
        rr *= 0.72;
        gg *= 0.7;
        bb *= 0.68;
      } else if (y < 255 && chroma > 26 && lum < 185) {
        const mid = (rr + gg + bb) / 3;
        rr = mid + (rr - mid) * 1.28;
        gg = mid + (gg - mid) * 1.22;
        bb = mid + (bb - mid) * 1.12;
      } else if (lum > 168 && chroma < 28) {
        rr = rr * 0.82 + 232 * 0.18;
        gg = gg * 0.82 + 228 * 0.18;
        bb = bb * 0.82 + 222 * 0.18;
      }
      data[i] = clampByte(rr);
      data[i + 1] = clampByte(gg);
      data[i + 2] = clampByte(bb);
    } else if (x < 500 && y < 310 && r > 95 && g > 50 && r - b > 14 && r < 250) {
      const lum = r * 0.3 + g * 0.5 + b * 0.2;
      const curve = lum + (lum - 128) * 0.16;
      const gain = curve / Math.max(20, lum);
      let rr = r * gain;
      let gg = g * gain;
      let bb = b * gain;
      if (lum < 88 && r > b) {
        rr *= 0.9;
        gg *= 0.88;
        bb *= 0.86;
      }
      if (r > 145 && r > g + 12 && r > b + 18 && g < 170) {
        rr = Math.min(255, rr * 1.06);
        bb *= 0.9;
      }
      data[i] = clampByte(rr);
      data[i + 1] = clampByte(gg);
      data[i + 2] = clampByte(bb);
    }
  }
  ctx.putImageData(frame, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.channel = 0;
  texture.needsUpdate = true;
  const rough = roughnessFrom(data);
  return { color: texture, rough };
}

function roughnessFrom(src: Uint8ClampedArray) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const out = ctx.createImageData(1024, 1024);
  const dst = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const x = (i / 4) % 1024;
    const y = (i / 4) / 1024;
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    let rough = 190;
    if (x > 520 && y > 68 && y < 255) rough = 48;
    else if (x > 520 && y >= 255 && y < 430) rough = 90;
    else if (r > 95 && g > 50 && r - b > 14 && r < 245 && g > b - 6) rough = 132;
    else if (r < 80 && g < 70 && b < 70) rough = 155;
    else rough = 205;
    dst[i] = rough;
    dst[i + 1] = rough;
    dst[i + 2] = rough;
    dst[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  texture.channel = 0;
  texture.needsUpdate = true;
  return texture;
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function dye(root: THREE.Object3D, map: THREE.Texture, rough: THREE.Texture | null) {
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    mesh.material = new THREE.MeshStandardMaterial({
      map,
      roughness: 1,
      roughnessMap: rough ?? undefined,
      metalness: 0.02,
      envMapIntensity: 0.55,
    });
  });
}

function setEye(eye: THREE.Object3D | null, yaw: number, pitch: number) {
  if (!eye) return;
  const rest = eye.userData.restQuat as THREE.Quaternion | undefined;
  if (!rest) return;
  eye.quaternion.copy(rest);
  eye.rotateY(THREE.MathUtils.clamp(yaw, -0.2, 0.2));
  eye.rotateX(THREE.MathUtils.clamp(pitch, -0.12, 0.12));
}

function badgeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 360;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#f3efe4";
  g.fillRect(0, 0, 256, 360);
  g.fillStyle = "#1e3a6e";
  g.fillRect(0, 0, 256, 72);
  g.fillStyle = "#f4efe6";
  g.font = "700 40px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("HARBOR", 128, 38);
  g.fillStyle = "#1a120e";
  g.font = "600 22px Georgia, serif";
  g.fillText("NIGHT SHIFT", 128, 108);
  g.fillStyle = "#5c5348";
  g.font = "500 18px Georgia, serif";
  g.fillText("NEW HIRE", 128, 142);
  g.fillStyle = "#d9cbb6";
  g.fillRect(78, 176, 100, 118);
  g.fillStyle = "#8a5a32";
  g.beginPath();
  g.arc(128, 214, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1e3a6e";
  g.fillRect(102, 246, 52, 36);
  g.fillStyle = "#c4a574";
  g.fillRect(28, 318, 200, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.channel = 0;
  texture.needsUpdate = true;
  return texture;
}

const WALK_MPS = 1.675;
const JOG_MPS = 3.602;
const _forward = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _worldQ = new THREE.Quaternion();
const _parentQ = new THREE.Quaternion();
const _footQ = new THREE.Quaternion();
const _hip = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _ankle = new THREE.Vector3();
const _target = new THREE.Vector3();
const _kneePos = new THREE.Vector3();
const _footPos = new THREE.Vector3();
const _bend = new THREE.Vector3();
const _savedUpper = new THREE.Quaternion();
const _savedLower = new THREE.Quaternion();
const _savedFoot = new THREE.Quaternion();

function wrapAngle(value: number) {
  let next = value;
  while (next > Math.PI) next -= Math.PI * 2;
  while (next < -Math.PI) next += Math.PI * 2;
  return next;
}

function pointBone(bone: THREE.Object3D, targetWorld: THREE.Vector3, poleWorld: THREE.Vector3) {
  const parent = bone.parent;
  if (!parent) return;
  parent.updateWorldMatrix(true, false);
  _origin.copy(bone.position).applyMatrix4(parent.matrixWorld);
  _dir.copy(targetWorld).sub(_origin);
  const reach = _dir.length();
  if (reach < 1e-4) return;
  _dir.multiplyScalar(1 / reach);
  _pole.copy(poleWorld).sub(_origin);
  _pole.addScaledVector(_dir, -_pole.dot(_dir));
  if (_pole.lengthSq() < 1e-6) _pole.set(0, 1, 0);
  else _pole.normalize();
  _z.copy(_pole);
  _x.crossVectors(_dir, _z);
  if (_x.lengthSq() < 1e-6) return;
  _x.normalize();
  _z.crossVectors(_x, _dir).normalize();
  _y.copy(_dir);
  _basis.makeBasis(_x, _y, _z);
  _worldQ.setFromRotationMatrix(_basis);
  parent.getWorldQuaternion(_parentQ);
  bone.quaternion.copy(_parentQ.invert()).multiply(_worldQ);
  bone.updateMatrix();
  bone.matrixWorld.multiplyMatrices(parent.matrixWorld, bone.matrix);
}

function plantFoot(upper: THREE.Object3D, lower: THREE.Object3D, foot: THREE.Object3D, lock: { x: number; y: number; z: number }) {
  upper.updateWorldMatrix(true, true);
  _hip.setFromMatrixPosition(upper.matrixWorld);
  _knee.setFromMatrixPosition(lower.matrixWorld);
  _ankle.setFromMatrixPosition(foot.matrixWorld);
  const thigh = _hip.distanceTo(_knee);
  const shin = _knee.distanceTo(_ankle);
  if (thigh < 0.05 || shin < 0.05) return;
  foot.getWorldQuaternion(_footQ);
  _target.set(lock.x, lock.y, lock.z);
  const reach = thigh + shin - 0.001;
  const minReach = Math.abs(thigh - shin) + 0.001;
  const dist = Math.min(Math.max(_target.distanceTo(_hip), minReach), reach);
  _dir.copy(_target).sub(_hip).normalize();
  _target.copy(_hip).addScaledVector(_dir, dist);
  const cosHip = THREE.MathUtils.clamp((thigh * thigh + dist * dist - shin * shin) / (2 * thigh * dist), -1, 1);
  const hipAngle = Math.acos(cosHip);
  const root = upper.parent ?? upper;
  _forward.set(0, -0.2, 1).transformDirection(root.matrixWorld);
  _bend.copy(_forward);
  _bend.addScaledVector(_dir, -_bend.dot(_dir));
  if (_bend.lengthSq() < 1e-6) _bend.set(0, 1, 0);
  else _bend.normalize();
  _kneePos.copy(_hip).addScaledVector(_dir, Math.cos(hipAngle) * thigh).addScaledVector(_bend, Math.sin(hipAngle) * thigh);
  _pole.copy(_hip).add(_forward);
  const savedUpper = _savedUpper.copy(upper.quaternion);
  const savedLower = _savedLower.copy(lower.quaternion);
  const savedFoot = _savedFoot.copy(foot.quaternion);
  pointBone(upper, _kneePos, _pole);
  pointBone(lower, _target, _pole);
  lower.getWorldQuaternion(_parentQ);
  foot.quaternion.copy(_parentQ.invert()).multiply(_footQ);
  if (!Number.isFinite(upper.quaternion.x) || !Number.isFinite(lower.quaternion.x) || !Number.isFinite(foot.quaternion.x)) {
    upper.quaternion.copy(savedUpper);
    lower.quaternion.copy(savedLower);
    foot.quaternion.copy(savedFoot);
  }
}

export function Human({
  gait = "idle",
  tint = "#243044",
  hair = "#3a2418",
  scale = 1,
  phase = 0,
  speed: pace = 1.15,
}: {
  gait?: "hero" | "idle" | "walk";
  tint?: string;
  hair?: string;
  scale?: number;
  phase?: number;
  speed?: number;
}) {
  const body = useGLTFOnce("/people/body.glb");
  const idleGltf = useGLTFOnce("/people/idle.glb");
  const walkGltf = useGLTFOnce("/people/walk.glb");
  const jogGltf = useGLTFOnce("/people/jog.glb");
  const map = useTexture("/people/body.png");
  const model = useMemo(() => {
    const next = cloneSkinned(body.scene);
    const painted = paintAvatar(map.image as CanvasImageSource, tint, hair);
    dye(next, painted?.color ?? map, painted?.rough ?? null);
    return next;
  }, [body.scene, tint, hair, map]);
  const clips = useMemo(
    () => ({
      idle: plant(idleGltf.animations[0]),
      walk: plant(walkGltf.animations[0]),
      jog: plant(jogGltf.animations[0]),
    }),
    [idleGltf.animations, walkGltf.animations, jogGltf.animations],
  );
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const idle = mixer.clipAction(clips.idle);
    const walk = mixer.clipAction(clips.walk);
    const jog = mixer.clipAction(clips.jog);
    idle.play();
    walk.play();
    jog.play();
    idle.setEffectiveWeight(1);
    walk.setEffectiveWeight(0);
    jog.setEffectiveWeight(0);
    idle.time = phase;
    walk.time = phase * 0.37;
    jog.time = phase * 0.13;
    return { idle, walk, jog };
  }, [mixer, clips, phase]);
  const current = useRef({ idle: 1, walk: 0, jog: 0, yaw: 0, pitch: 0, rate: 0, face: 0 });
  const locks = useRef({
    left: { on: false, x: 0, y: 0, z: 0 },
    right: { on: false, x: 0, y: 0, z: 0 },
  });
  const bones = useRef<{
    hips: THREE.Object3D | null;
    spine: THREE.Object3D | null;
    spine2: THREE.Object3D | null;
    neck: THREE.Object3D | null;
    head: THREE.Object3D | null;
    leftEye: THREE.Object3D | null;
    rightEye: THREE.Object3D | null;
    leftUp: THREE.Object3D | null;
    leftLeg: THREE.Object3D | null;
    leftFoot: THREE.Object3D | null;
    rightUp: THREE.Object3D | null;
    rightLeg: THREE.Object3D | null;
    rightFoot: THREE.Object3D | null;
  }>({
    hips: null,
    spine: null,
    spine2: null,
    neck: null,
    head: null,
    leftEye: null,
    rightEye: null,
    leftUp: null,
    leftLeg: null,
    leftFoot: null,
    rightUp: null,
    rightLeg: null,
    rightFoot: null,
  });

  useLayoutEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      if (mesh.isSkinnedMesh) mesh.skeleton.pose();
    });
    const get = (name: string) => model.getObjectByName(name) ?? null;
    bones.current.hips = get("Hips");
    bones.current.spine = get("Spine");
    bones.current.spine2 = get("Spine2");
    bones.current.neck = get("Neck");
    bones.current.head = get("Head");
    bones.current.leftEye = get("LeftEye");
    bones.current.rightEye = get("RightEye");
    bones.current.leftUp = get("LeftUpLeg");
    bones.current.leftLeg = get("LeftLeg");
    bones.current.leftFoot = get("LeftFoot");
    bones.current.rightUp = get("RightUpLeg");
    bones.current.rightLeg = get("RightLeg");
    bones.current.rightFoot = get("RightFoot");
    const pin = (bone: THREE.Object3D | null) => {
      if (bone) bone.userData.restQuat = bone.quaternion.clone();
    };
    pin(bones.current.leftEye);
    pin(bones.current.rightEye);
    const spine = bones.current.spine2;
    if (gait === "hero" && spine && !spine.getObjectByName("harbor-badge")) {
      const badge = new THREE.Group();
      badge.name = "harbor-badge";
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.142, 0.006),
        new THREE.MeshStandardMaterial({ map: badgeTexture() ?? undefined, color: "#f4efe6", roughness: 0.58, metalness: 0 }),
      );
      card.position.set(0, -0.08, -0.2);
      card.castShadow = true;
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.18, 0.006),
        new THREE.MeshStandardMaterial({ color: "#16120e", roughness: 0.62 }),
      );
      strap.position.set(0, 0.02, -0.15);
      badge.add(strap, card);
      spine.add(badge);
    }
  }, [model, gait]);

  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05);
    const speed = gait === "hero" ? (world.moving && !world.driving ? world.speed : 0) : gait === "walk" ? pace : 0;
    const fade = 1 - Math.exp(-7 * dt);
    let idleT = 1;
    let walkT = 0;
    let jogT = 0;
    if (speed > 0.08) {
      const intoWalk = Math.min(1, (speed - 0.08) / 0.55);
      idleT = 1 - intoWalk;
      walkT = intoWalk;
      if (speed > 2.4) {
        const intoJog = Math.min(1, (speed - 2.4) / 1.7);
        jogT = walkT * intoJog;
        walkT *= 1 - intoJog;
      }
    }
    const blend = current.current;
    blend.idle += (idleT - blend.idle) * fade;
    blend.walk += (walkT - blend.walk) * fade;
    blend.jog += (jogT - blend.jog) * fade;
    const sum = blend.idle + blend.walk + blend.jog || 1;
    actions.idle.setEffectiveWeight(blend.idle / sum);
    actions.walk.setEffectiveWeight(blend.walk / sum);
    actions.jog.setEffectiveWeight(blend.jog / sum);
    actions.walk.setEffectiveTimeScale(THREE.MathUtils.clamp(Math.max(speed, 0.35) / WALK_MPS, 0.4, 2.05));
    actions.jog.setEffectiveTimeScale(THREE.MathUtils.clamp(Math.max(speed, 0.8) / JOG_MPS, 0.5, 2.15));
    mixer.update(dt);

    const posed = bones.current;
    let faceDelta = wrapAngle(world.face - blend.face);
    if (gait !== "hero") faceDelta = 0;
    blend.face = world.face;
    blend.rate += (faceDelta / Math.max(dt, 0.001) - blend.rate) * (1 - Math.exp(-6 * dt));
    if (posed.hips && speed < 0.25) {
      const sway = Math.sin(clock.elapsedTime * 0.85 + phase);
      posed.hips.rotateZ(sway * 0.035);
      posed.hips.rotateX(Math.sin(clock.elapsedTime * 1.35 + phase) * 0.012);
    }
    if (posed.spine) {
      const lean = Math.min(0.16, Math.max(0, speed - 1.15) * 0.03);
      posed.spine.rotateX(lean);
      posed.spine.rotateZ(THREE.MathUtils.clamp(-blend.rate * 0.055, -0.2, 0.2));
      posed.spine.rotateY(THREE.MathUtils.clamp(-blend.rate * 0.03, -0.14, 0.14));
    }
    if (posed.spine2) {
      const breath = speed < 0.3 ? 0.018 : 0.006;
      posed.spine2.rotateX(Math.sin(clock.elapsedTime * (speed > 2.8 ? 3.4 : 1.55) + phase) * breath);
    }
    let aimYaw = Math.sin(clock.elapsedTime * 0.32 + phase) * 0.2;
    let aimPitch = Math.sin(clock.elapsedTime * 0.21 + phase * 2) * 0.04;
    if (gait === "hero") {
      aimYaw = wrapAngle(world.camYaw - world.face);
      aimPitch = (0.1 - world.camPitch) * 0.38;
    }
    blend.yaw += (THREE.MathUtils.clamp(aimYaw, -0.5, 0.5) - blend.yaw) * (1 - Math.exp(-5 * dt));
    blend.pitch += (THREE.MathUtils.clamp(aimPitch, -0.22, 0.26) - blend.pitch) * (1 - Math.exp(-5 * dt));
    if (posed.neck) {
      posed.neck.rotateY(blend.yaw * 0.2);
      posed.neck.rotateX(blend.pitch * 0.16);
    }
    if (posed.head) {
      posed.head.rotateY(blend.yaw * 0.28);
      posed.head.rotateX(blend.pitch * 0.24);
    }
    const glanceY = Math.sin(clock.elapsedTime * 1.6 + phase) * 0.02;
    const glanceX = Math.sin(clock.elapsedTime * 1.05 + phase * 1.7) * 0.012;
    setEye(posed.leftEye, blend.yaw * 0.22 + glanceY, blend.pitch * 0.16 + glanceX);
    setEye(posed.rightEye, blend.yaw * 0.22 + glanceY, blend.pitch * 0.16 + glanceX);

    if (gait === "hero" && posed.leftUp && posed.leftLeg && posed.leftFoot && posed.rightUp && posed.rightLeg && posed.rightFoot) {
      model.updateWorldMatrix(true, true);
      const ground = world.py;
      const hold = (foot: THREE.Object3D, upper: THREE.Object3D, lower: THREE.Object3D, lock: { on: boolean; x: number; y: number; z: number }) => {
        foot.getWorldPosition(_footPos);
        if (speed < 0.25 || Math.abs(blend.rate) > 1.35) {
          lock.on = false;
          return;
        }
        if (!lock.on && _footPos.y < ground + 0.068) {
          lock.on = true;
          lock.x = _footPos.x;
          lock.y = ground + 0.042;
          lock.z = _footPos.z;
        } else if (lock.on && _footPos.y > ground + 0.11) {
          lock.on = false;
        }
        if (lock.on) plantFoot(upper, lower, foot, lock);
      };
      hold(posed.leftFoot, posed.leftUp, posed.leftLeg, locks.current.left);
      hold(posed.rightFoot, posed.rightUp, posed.rightLeg, locks.current.right);
    } else {
      locks.current.left.on = false;
      locks.current.right.on = false;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.02]} scale={[1, 0.62, 1]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <primitive object={model} scale={scale} />
    </group>
  );
}
