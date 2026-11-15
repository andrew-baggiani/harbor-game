import * as THREE from "three";

const FACADE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 roomShade(vec2 cellId, vec2 wuv, vec3 rd, float depth) {
  vec3 r = rd;
  r.z = max(abs(r.z), 0.12);
  vec2 p = clamp(wuv, 0.02, 0.98);
  float tx = abs(r.x) < 1e-3 ? 80.0 : ((r.x > 0.0 ? (1.0 - p.x) : (0.0 - p.x)) / r.x);
  float ty = abs(r.y) < 1e-3 ? 80.0 : ((r.y > 0.0 ? (1.0 - p.y) : (0.0 - p.y)) / r.y);
  float tz = depth / r.z;
  vec3 hit = vec3(p, 0.0) + r * min(min(tx, ty), tz);

  float seed = hash12(cellId);
  float seed2 = hash12(cellId + vec2(4.2, 1.7));
  vec3 plaster = mix(vec3(0.42, 0.30, 0.22), vec3(0.20, 0.28, 0.38), step(0.58, seed2));
  vec3 col = plaster * 0.72;

  if (tz <= tx && tz <= ty) {
    vec2 q = hit.xy;
    float art = step(0.26, q.x) * step(q.x, 0.74) * step(0.34, q.y) * step(q.y, 0.82);
    vec3 painting = mix(vec3(0.55, 0.18, 0.12), vec3(0.12, 0.32, 0.48), step(0.5, seed));
    col = mix(plaster * 0.8, painting, art);
    float screen = step(0.36, q.x) * step(q.x, 0.64) * step(0.18, q.y) * step(q.y, 0.40);
    col += vec3(0.25, 0.55, 1.0) * screen * step(0.42, seed) * 1.4;
  } else if (ty <= tx) {
    if (r.y > 0.0) {
      float lamp = smoothstep(0.22, 0.0, length(hit.xz - vec2(0.5, depth * 0.42)));
      col = vec3(0.28, 0.25, 0.22) + vec3(1.0, 0.86, 0.62) * lamp * 2.2;
    } else {
      float board = step(0.48, fract(hit.x * 7.0));
      col = mix(vec3(0.13, 0.08, 0.05), vec3(0.20, 0.12, 0.07), board);
      float rug = step(0.28, hit.x) * step(hit.x, 0.72) * step(0.2, hit.z / depth) * step(hit.z / depth, 0.75);
      col = mix(col, vec3(0.28, 0.08, 0.07), rug);
    }
  } else {
    col = plaster * 0.55;
    col += vec3(0.12, 0.09, 0.06) * smoothstep(0.02, 0.0, abs(hit.y - 0.48));
  }

  vec3 lampPos = vec3(0.5, 0.96, depth * 0.38);
  float ld = length(hit - lampPos);
  col += vec3(1.0, 0.78, 0.48) * (0.055 / (0.025 + ld * ld));

  float desk = step(0.30, hit.x) * step(hit.x, 0.70) * step(hit.y, 0.28) * step(0.45, hit.z / depth);
  col *= mix(1.0, 0.32, desk);

  float blinds = step(0.78, hash12(cellId + vec2(8.0, 2.0)));
  col = mix(col, col * vec3(0.22, 0.18, 0.14), blinds * step(0.45, fract(hit.y * 8.0)));

  float occupied = smoothstep(0.18, 0.48, seed);
  col *= mix(0.05, 1.0, occupied);
  return col;
}

void facadeEval(vec3 wp, vec3 wn) {
  vec3 n = normalize(wn);
  gCol = vec3(0.05, 0.052, 0.058);
  gEmit = vec3(0.0);
  gRough = 0.84;
  gMetal = 0.16;
  if (n.y > 0.72) {
    float grit = hash12(floor(wp.xz * 1.7));
    gCol = vec3(0.028, 0.03, 0.034) + grit * 0.012;
    gRough = 0.93;
    gMetal = 0.06;
    return;
  }
  if (n.y < -0.72) {
    gCol = vec3(0.015, 0.016, 0.018);
    gRough = 0.9;
    gMetal = 0.02;
    return;
  }

  vec2 uv = abs(n.x) > abs(n.z) ? wp.zy : wp.xy;
  float district = hash12(floor(wp.xz / 36.0) + vec2(0.2, 1.7));
  bool brick = district > 0.58 && wp.y < 48.0;
  bool lobby = wp.y < 3.65;

  if (brick && !lobby) {
    vec2 b = uv * vec2(1.35, 2.7);
    if (mod(floor(b.y), 2.0) > 0.5) b.x += 0.5;
    vec2 bf = fract(b);
    float mortar = smoothstep(0.0, 0.07, bf.x) * smoothstep(0.0, 0.09, bf.y);
    float tone = hash12(floor(b));
    vec3 brickCol = mix(vec3(0.22, 0.07, 0.045), vec3(0.38, 0.15, 0.09), tone);
    brickCol = mix(vec3(0.05, 0.03, 0.028), brickCol, mortar);
    gCol = brickCol;
    gRough = mix(0.92, 0.68, mortar);
    gMetal = 0.02;
  } else {
    float grit = hash12(uv * vec2(4.0, 2.0));
    vec3 panel = vec3(0.055, 0.062, 0.074) + grit * 0.016;
    float seam = max(
      smoothstep(0.012, 0.0, abs(fract(uv.x / 2.75) - 0.5) - 0.47),
      smoothstep(0.01, 0.0, abs(fract(uv.y / 3.55) - 0.02))
    );
    gCol = mix(panel, panel * 1.45, seam);
    gRough = 0.48;
    gMetal = 0.42;
  }

  float bay = lobby ? 4.6 : (brick ? 1.9 : 3.35);
  float floorH = lobby ? 3.65 : (brick ? 3.05 : 3.7);
  vec2 cell = vec2(bay, floorH);
  vec2 id = floor(uv / cell);
  vec2 f = fract(uv / cell);
  float h = hash12(id + vec2(2.0, 9.0));

  float mx = lobby ? 0.05 : (brick ? 0.30 : 0.10);
  float my0 = lobby ? 0.04 : (brick ? 0.30 : 0.12);
  float my1 = lobby ? 0.06 : (brick ? 0.18 : 0.10);
  float inX = smoothstep(mx, mx + 0.02, f.x) * (1.0 - smoothstep(1.0 - mx - 0.02, 1.0 - mx, f.x));
  float inY = smoothstep(my0, my0 + 0.02, f.y) * (1.0 - smoothstep(1.0 - my1 - 0.02, 1.0 - my1, f.y));
  float win = inX * inY;
  float mullion = max(smoothstep(0.015, 0.0, abs(f.x - 0.5)), smoothstep(0.012, 0.0, abs(f.y - 0.55)));
  if (!brick) win *= 1.0 - mullion * 0.85;

  vec2 span = vec2(max(1.0 - mx * 2.0, 0.2), max(1.0 - my0 - my1, 0.2));
  vec2 wuv = clamp((f - vec2(mx, my0)) / span, 0.0, 1.0);

  float occ = smoothstep(0.18, 0.5, h);
  float hue = hash12(id + vec2(9.0, 2.2));
  vec3 inside = mix(vec3(0.82, 0.52, 0.26), vec3(0.58, 0.7, 0.82), step(0.8, hue));
  inside *= mix(0.22, 1.0, hash12(id + vec2(3.0, 5.0))) * occ;
  float blind = step(0.84, hash12(id + vec2(8.0, 2.0)));
  inside *= mix(1.0, 0.42, blind * step(0.55, fract(wuv.y * 6.0)));

  float fres = pow(1.0 - clamp(dot(n, normalize(cameraPosition - wp)), 0.0, 1.0), 2.4);
  vec3 glass = mix(vec3(0.012, 0.016, 0.022), vec3(0.07, 0.08, 0.09), fres * 0.28);
  gCol = mix(gCol, glass, win);
  gEmit = inside * win * (lobby ? 0.85 : 0.5);
  if (h > 0.93 && win > 0.35 && !lobby) gEmit = mix(gEmit, vec3(0.85, 0.16, 0.14) * win, 0.65);
  gRough = mix(gRough, mix(0.05, 0.22, fres), win);
  gMetal = mix(gMetal, 0.08, win);

  float sill = smoothstep(0.03, 0.0, abs(f.y - my0)) * (lobby ? 0.0 : 1.0);
  gCol += vec3(0.07, 0.072, 0.08) * sill * (1.0 - win);
  float band = smoothstep(0.04, 0.0, abs(fract(wp.y / floorH) - 0.02));
  gCol = mix(gCol, gCol * 0.45, band * (1.0 - win));
}
`;

let facade: THREE.MeshStandardMaterial | null = null;

export function facadeMaterial() {
  if (facade) return facade;
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.8,
    metalness: 0.2,
    envMapIntensity: 1.15,
  });
  material.customProgramCacheKey = () => "harbor-facade-v7";
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFacadeWorld;\nvarying vec3 vFacadeNormal;")
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vFacadeWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vFacadeNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vFacadeWorld;
        varying vec3 vFacadeNormal;
        vec3 gCol;
        vec3 gEmit;
        float gRough;
        float gMetal;
        ${FACADE}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        facadeEval(vFacadeWorld, vFacadeNormal);
        diffuseColor.rgb = gCol;`,
      )
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = gRough;")
      .replace("#include <metalnessmap_fragment>", "float metalnessFactor = gMetal;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += gEmit;`,
      );
  };
  facade = material;
  return material;
}

function canvasTex(width: number, height: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("canvas");
  paint(g, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

let sidewalk: THREE.MeshStandardMaterial | null = null;

export function sidewalkMaterial() {
  if (sidewalk) return sidewalk;
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.25,
  });
  material.customProgramCacheKey = () => "sidewalk-slabs-v1";
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSideW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvSideW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vSideW;
        float sh12(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float row = floor(vSideW.z / 1.42);
        float slab = mix(1.05, 2.15, sh12(vec2(row, 2.2)));
        float shift = sh12(vec2(row, 8.4)) * slab;
        float along = (vSideW.x + shift) / slab;
        vec2 f = vec2(fract(along), fract(vSideW.z / 1.42));
        float seam = smoothstep(0.0, 0.028, f.x) * smoothstep(0.0, 0.028, 1.0 - f.x);
        seam *= smoothstep(0.0, 0.034, f.y) * smoothstep(0.0, 0.034, 1.0 - f.y);
        float tone = sh12(vec2(floor(along), row));
        vec3 concrete = mix(vec3(0.16, 0.155, 0.145), vec3(0.24, 0.23, 0.21), tone);
        concrete += (sh12(vSideW.xz * 22.0) - 0.5) * 0.045;
        float damp = smoothstep(0.62, 0.9, sh12(floor(vSideW.xz * 0.17) + vec2(row * 0.01, 1.7)));
        concrete *= mix(1.0, 0.58, damp);
        float curb = smoothstep(0.35, 0.0, abs(vSideW.z + 6.15)) + smoothstep(0.28, 0.0, abs(vSideW.z + 16.55));
        concrete = mix(concrete, vec3(0.1, 0.1, 0.105), curb * 0.65);
        diffuseColor.rgb = mix(concrete * 0.32, concrete, seam);`,
      );
  };
  sidewalk = material;
  return sidewalk;
}

let markings: THREE.CanvasTexture | null = null;

export function laneMarkings() {
  if (markings) return markings;
  markings = canvasTex(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "rgba(214, 206, 170, 0.92)";
    g.fillRect(0, 18, w, 10);
    g.fillRect(0, h - 28, w, 10);
    g.fillStyle = "rgba(232, 196, 96, 0.95)";
    for (let x = 0; x < w; x += 150) g.fillRect(x, h / 2 - 6, 78, 12);
  });
  markings.wrapS = THREE.ClampToEdgeWrapping;
  markings.wrapT = THREE.ClampToEdgeWrapping;
  return markings;
}
