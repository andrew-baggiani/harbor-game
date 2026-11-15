import { suspend } from "suspend-react";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  const next = new GLTFLoader().loadAsync(url);
  cache().set(url, next);
  // A failed request is dropped from the cache so a remount can retry it.
  next.catch(() => cache().delete(url));
  return next;
}

export function useGLTFOnce(url: string): GLTF {
  return suspend(() => loadGLTF(url), ["harbor-gltf", url]);
}

/** Start downloads in parallel before any component suspends on them. */
export function preloadGLTF(urls: readonly string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) void loadGLTF(url).catch(() => undefined);
}
