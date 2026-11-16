// Harbor & Co. baked lighting helper (three.js r150+, tested on r187).
// Copy to src/game/baked.ts. See docs/BAKED_LIGHTING.md.
// Baked meshes keep their PBR material (tiled textures, normal + roughness maps) and get the Cycles lightmap on uv1.
// The lightmap replaces ALL diffuse lighting on those meshes (dynamic lights' diffuse, hemisphere/ambient, IBL diffuse),
// so nothing is lit twice. Dynamic lights still add specular highlights; the env map still adds reflections.
import * as THREE from "three";

export type BakedOptions = { exposure?: number; specular?: number; iblDiffuse?: number; directDiffuse?: number; metalnessCap?: number };

const lightmapCache = new Map<string, Promise<THREE.Texture>>();

/** Load (once) a lightmap atlas. Resolves when the image is decoded, so the first frame is already lit. */
export function loadLightmap(url: string): Promise<THREE.Texture> {
  if (!lightmapCache.has(url)) {
    lightmapCache.set(url, new THREE.TextureLoader().loadAsync(url).then((tex) => {
      tex.flipY = false;                        // glTF UV convention
      tex.channel = 1;                          // TEXCOORD_1 -> geometry.attributes.uv1
      tex.colorSpace = THREE.SRGBColorSpace;    // the atlas is sRGB-encoded
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      return tex;
    }));
  }
  return lightmapCache.get(url)!;
}

const MAPS_CHUNK = THREE.ShaderChunk.lights_fragment_maps.replace(
  "iblIrradiance += getIBLIrradiance( geometryNormal );",
  "iblIrradiance += getIBLIrradiance( geometryNormal ) * HARBOR_BAKED_IBL_DIFFUSE;",
);

function bakedMaterial(src: THREE.Material, lightMap: THREE.Texture, intensity: number, opts: BakedOptions): THREE.Material {
  const std = src as THREE.MeshPhysicalMaterial;
  const isGlass = (std.transmission ?? 0) > 0 || (src.transparent && src.opacity < 0.99);
  if (isGlass || !std.isMeshStandardMaterial) return src;
  const m = std.clone();
  m.lightMap = lightMap;
  m.lightMapIntensity = intensity * (opts.exposure ?? 1);
  // Metals have no diffuse term, so a lightmap can't light them. Cycles' brushed steel mostly reflects the lit
  // room around it; capping metalness lets the baked room light show up on it (the bake treats every surface as diffuse).
  m.metalness = Math.min(m.metalness, opts.metalnessCap ?? 0.5);
  m.envMapIntensity = (std.envMapIntensity ?? 1) * (opts.specular ?? 1);
  const ibl = (opts.iblDiffuse ?? 0).toFixed(3);
  const direct = (opts.directDiffuse ?? 0).toFixed(3);
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <lights_fragment_maps>",
      `#define HARBOR_BAKED_IBL_DIFFUSE ${ibl}
      reflectedLight.directDiffuse *= ${direct};   // dynamic lights: keep their specular only
      irradiance *= ${direct};                     // ambient + hemisphere + light probes
      ${MAPS_CHUNK}`,
    );
  };
  m.customProgramCacheKey = () => `harbor-baked-${ibl}-${direct}`;
  m.userData.harborBaked = true;
  return m;
}

/**
 * Attach the lightmaps of a loaded *_baked.glb scene. Everything it needs is in the node extras
 * (userData.lightmap = file name next to the GLB, userData.lightmap_intensity).
 * opts: { exposure = 1, specular = 1, iblDiffuse = 0, directDiffuse = 0, metalnessCap = 0.5 }
 */
export async function applyBakedLighting(root: THREE.Object3D, baseUrl: string, opts: BakedOptions = {}) {
  const jobs: [THREE.Mesh, string, number][] = [];
  root.traverse((child) => {
    const obj = child as THREE.Mesh;
    if (!obj.isMesh || !obj.geometry.attributes.uv1) return;
    let node: THREE.Object3D | null = obj;                                    // multi-material nodes load as a Group of Meshes
    while (node && node.userData.lightmap === undefined && node !== root) node = node.parent;
    if (!node || !node.userData.lightmap) return;
    jobs.push([obj, node.userData.lightmap, Number(node.userData.lightmap_intensity)]);
  });
  const cache = new Map<THREE.Material, THREE.Material>();
  for (const [mesh, file, intensity] of jobs) {
    const lightMap = await loadLightmap(baseUrl + file);
    const swap = (mat: THREE.Material) => {
      if (!cache.has(mat)) cache.set(mat, bakedMaterial(mat, lightMap, intensity, opts));
      return cache.get(mat)!;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    mesh.receiveShadow = false;   // shadows are baked; dynamic diffuse is suppressed on these meshes anyway
  }
}

/** Names of the original nodes a baked scene replaces (from userData.replaces on its nodes). */
export function replacedNames(root: THREE.Object3D): string[] {
  const out = new Set<string>();
  root.traverse((o) => { if (o.userData.replaces && o.parent === root) out.add(String(o.userData.replaces)); });
  return [...out];
}

/** Hide every original node the baked scene replaces, searching all given scenes. */
export function hideReplaced(bakedRoot: THREE.Object3D, scenes: THREE.Object3D[]) {
  for (const name of replacedNames(bakedRoot)) {
    for (const scene of scenes) {
      const node = scene.getObjectByName(name);
      if (node && !node.userData.harborBaked) node.visible = false;
    }
  }
}
