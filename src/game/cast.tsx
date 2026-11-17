import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { CastSlot } from "@/content/week/types";
import { useGLTFOnce } from "@/game/models";

/**
 * Real characters (MetaHumans converted by /home/claude/june/build_june.py) by cast slot.
 * A slot without a file keeps its greybox stand-in. Add a line here when the next character lands.
 */
const FILES: Partial<Record<CastSlot, string>> = {
  "night-desk": "/assets/models/cast/june.glb",
};

export function hasCast(slot: CastSlot) {
  return !!FILES[slot];
}

/** A cast member, or the fallback while loading / when the slot has no character yet. */
export function CastActor({ slot, fallback, talking = false }: { slot: CastSlot; fallback: ReactNode; talking?: boolean }) {
  const url = FILES[slot];
  if (!url) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <Actor url={url} talking={talking} />
    </Suspense>
  );
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _pq = new THREE.Quaternion();

/** Swing a bone (in world space) so the direction to its child points at `target`. */
function aim(bone: THREE.Bone, child: THREE.Object3D, target: THREE.Vector3) {
  bone.updateWorldMatrix(true, true);
  bone.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const from = _b.sub(_a).normalize();
  _q.setFromUnitVectors(from, target.clone().normalize());
  bone.getWorldQuaternion(_pq);
  const world = _q.multiply(_pq);
  const parentQ = new THREE.Quaternion();
  bone.parent?.getWorldQuaternion(parentQ);
  bone.quaternion.copy(parentQ.invert().multiply(world));
  bone.updateWorldMatrix(false, true);
}

function Actor({ url, talking }: { url: string; talking: boolean }) {
  const gltf = useGLTFOnce(url);
  const root = useMemo(() => clone(gltf.scene), [gltf]);
  const bones = useRef<Record<string, THREE.Bone>>({});
  const rest = useRef<Record<string, THREE.Quaternion>>({});
  const t = useRef(Math.random() * 10);

  useLayoutEffect(() => {
    const found: Record<string, THREE.Bone> = {};
    root.traverse((o) => {
      if ((o as THREE.Bone).isBone) found[o.name] = o as THREE.Bone;
      const mesh = o as THREE.SkinnedMesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.frustumCulled = false; // skinned bounds don't follow the pose
      }
    });
    bones.current = found;
    // MetaHumans export in an A-pose. Drop the arms to the sides with a slight bend.
    for (const side of ["l", "r"] as const) {
      const s = side === "l" ? 1 : -1;
      const upper = found[`upperarm_${side}`];
      const lower = found[`lowerarm_${side}`];
      const hand = found[`hand_${side}`];
      if (upper && lower) aim(upper, lower, new THREE.Vector3(0.12 * s, -1, 0.02));
      if (lower && hand) aim(lower, hand, new THREE.Vector3(0.08 * s, -1, 0.22));
    }
    rest.current = {};
    for (const name of ["spine_03", "spine_05", "neck_01", "head", "FACIAL_C_Jaw", "pelvis"]) {
      if (found[name]) rest.current[name] = found[name].quaternion.clone();
    }
  }, [root]);

  useFrame((_, dt) => {
    t.current += dt;
    const b = bones.current;
    const r = rest.current;
    const time = t.current;
    const set = (name: string, x: number, y: number, z: number) => {
      const bone = b[name];
      const q0 = r[name];
      if (!bone || !q0) return;
      bone.quaternion.copy(q0).multiply(_q.setFromEuler(new THREE.Euler(x, y, z)));
    };
    const breathe = Math.sin(time * 1.6) * 0.012;
    set("spine_03", breathe, 0, 0);
    set("spine_05", breathe * 0.6, Math.sin(time * 0.31) * 0.02, 0);
    set("head", Math.sin(time * 0.53) * 0.025, Math.sin(time * 0.27) * 0.06 + (talking ? Math.sin(time * 2.1) * 0.03 : 0), 0);
    set("pelvis", 0, 0, Math.sin(time * 0.4) * 0.01);
    const jaw = talking ? Math.max(0, Math.sin(time * 11) * Math.sin(time * 3.7)) * 0.12 : 0;
    set("FACIAL_C_Jaw", 0, 0, jaw);
  });

  return <primitive object={root} />;
}
