import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { applyBakedLighting } from "@/game/baked";
import { useGLTFOnce } from "@/game/models";
import { MODEL_BASE } from "@/game/scenery";

/**
 * A modeled, Cycles-baked room that isn't part of the tower (the cafe, the home). Built by
 * /home/claude/harbor/build_rooms.py with the same lightmap format as Monday's floors.
 */
type Hit = { mesh: THREE.Mesh; tree: MeshBVH };
const hits: Hit[] = [];
const _inv = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

/** Walls come from the room's bounds (the shell is skipped: its floor would block every step). */
let bounds = { x0: -100, x1: 100, z0: -100, z1: 100 };
export function setRoomBounds(b: typeof bounds) {
  bounds = b;
}

/** Same test as the tower: two spheres at knee and chest height against the room's meshes. */
export function roomBlocked(x: number, z: number, y: number, radius: number) {
  if (x < bounds.x0 + radius || x > bounds.x1 - radius || z < bounds.z0 + radius || z > bounds.z1 - radius) return true;
  for (const { mesh, tree } of hits) {
    _inv.copy(mesh.matrixWorld).invert();
    const scale = mesh.matrixWorld.getMaxScaleOnAxis() || 1;
    for (const sy of [y + 0.45, y + 1.05]) {
      _sphere.center.set(x, sy, z).applyMatrix4(_inv);
      _sphere.radius = radius / scale;
      if (tree.intersectsSphere(_sphere)) return true;
    }
  }
  return false;
}

export function BakedRoom({ file }: { file: string }) {
  const gltf = useGLTFOnce(`${MODEL_BASE}${file}`);
  const scene = useMemo(() => {
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const view = /View/.test(`${mesh.name} ${mesh.parent?.name ?? ""}`);
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const p = m as THREE.MeshPhysicalMaterial;
        if (view) {
          // The street through the glass is a lit picture: keep it dim so it reads as night, not a lightbox.
          p.emissiveIntensity = 0.32;
          p.color.setScalar(0.25);
        }
        if (p.transmission > 0) {
          p.transmission = 0;
          p.transparent = true;
          p.opacity = 0.18;
          p.depthWrite = false;
        }
      }
    });
    void applyBakedLighting(gltf.scene, MODEL_BASE);
    return gltf.scene;
  }, [gltf]);

  useLayoutEffect(() => {
    hits.length = 0;
    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const names = `${mesh.name} ${mesh.parent?.name ?? ""}`;
      if (!mesh.isMesh || /Glass|Downlights|Pendants|Shell/.test(names)) return;
      hits.push({ mesh, tree: new MeshBVH(mesh.geometry) });
    });
    return () => {
      hits.length = 0;
    };
  }, [scene]);

  return <primitive object={scene} />;
}
