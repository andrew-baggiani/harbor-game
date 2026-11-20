import { suspend } from "suspend-react";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

type Cache = Map<string, Promise<GLTF>>;

const CACHE_KEY = "__harborGLTF";

function cache(): Cache {
  const host = globalThis as typeof globalThis & { [CACHE_KEY]?: Cache };
  if (!host[CACHE_KEY]) host[CACHE_KEY] = new Map();
  return host[CACHE_KEY];
}

export function loadGLTF(url: string): Promise<GLTF> {
  const pending = cache().get(url);
  if (pending) return pending;
  // Models are meshopt-compressed with WebP textures (tools: gltf-transform webp + meshopt).
  const next = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  cache().set(url, next);
  // A failed request is dropped from the cache so a remount can retry it.
  next.catch(() => cache().delete(url));
  return next;
}

export function useGLTFOnce(url: string): GLTF {
  return suspend(() => loadGLTF(url), ["harbor-gltf", url]);
}
