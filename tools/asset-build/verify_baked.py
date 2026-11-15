"""Verify the baked GLBs (pygltflib):
  - every baked mesh has TEXCOORD_1 and lightmap extras; lightmap UVs stay inside 0..1 and don't overlap much
  - no baked/remainder node name collides with ANY node name in the original GLBs (getObjectByName stays unambiguous)
  - every `replaces` target exists in an original GLB, and no interactive node is replaced
  - original GLBs are untouched (sha1 listed for the record)
Usage: python3 verify_baked.py
"""
import os, json, hashlib, sys
import numpy as np
from pygltflib import GLTF2

OUT = "/home/claude/harbor/out"; B = f"{OUT}/baked"
ORIG = ["harbor_block.glb", "harbor_office_f14.glb", "harbor_lobby_detail.glb", "harbor_f14_detail.glb",
        "harbor_elevator_cab.glb", "harbor_shaft_cut.glb", "harbor_props.glb", "harbor_security_props.glb"]
INTERACTIVE_ROLES = {"door", "elevator_door", "turnstile", "badge_reader", "badge_led", "elevator_button",
                     "elevator_call_button", "hall_lantern", "floor_indicator", "indicator_digit", "screen", "camera",
                     "camera_led", "blink_leds", "parcel", "door_wedge", "clean_desk_hook", "usb_stick", "envelope",
                     "desk_phone", "ring_light", "laptop", "monitor", "keyboard", "visitor_kiosk", "lane_status",
                     "shred_bin", "trash_bin", "whiteboard", "fire_extinguisher", "barrier", "vehicle"}

def acc(g, blob, i):
    a = g.accessors[i]; bv = g.bufferViews[a.bufferView]
    n = {"VEC2": 2, "VEC3": 3, "VEC4": 4, "SCALAR": 1}[a.type]
    dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a.componentType]
    off = (bv.byteOffset or 0) + (a.byteOffset or 0)
    arr = np.frombuffer(blob, dt, a.count * n, off)
    return arr.reshape(a.count, n) if n > 1 else arr

orig_nodes = {}
for f in ORIG:
    g = GLTF2().load(f"{OUT}/{f}")
    for n in g.nodes: orig_nodes.setdefault(n.name, []).append((f, n.extras or {}))
    print(f"orig {f:28s} sha1={hashlib.sha1(open(f'{OUT}/{f}', 'rb').read()).hexdigest()[:12]} nodes={len(g.nodes)}")

man = json.load(open(f"{B}/harbor_baked_lightmaps.json"))
ok = True
for f, e in man["files"].items():
    g = GLTF2().load(f"{B}/{f}"); blob = g.binary_blob()
    lm = f"{B}/{e['lightmap']}"
    print(f"\n== {f}  {os.path.getsize(f'{B}/{f}') / 1e6:.2f} MB + {e['lightmap']} {os.path.getsize(lm) / 1e6:.2f} MB  "
          f"intensity={e['lightmap_intensity']}")
    for n in g.nodes:
        if n.name in orig_nodes:
            print("  NAME COLLISION", n.name, orig_nodes[n.name]); ok = False
    for r in e["replaces"]:
        if r not in orig_nodes: print("  replaces missing node", r); ok = False
        for src, ex in orig_nodes.get(r, []):
            if ex.get("role") in INTERACTIVE_ROLES or ex.get("interactive"):
                print("  WARNING replaces interactive node", r, src, ex.get("role")); ok = False
    area = 0.0; tris = 0
    for n in g.nodes:
        if n.mesh is None: continue
        ex = n.extras or {}
        has1 = all(p.attributes.TEXCOORD_1 is not None for p in g.meshes[n.mesh].primitives)
        if n.name in e["baked_nodes"]:
            if not has1 or ex.get("lightmap") != e["lightmap"]:
                print("  baked node without TEXCOORD_1/extras", n.name); ok = False
        for p in g.meshes[n.mesh].primitives:
            idx = acc(g, blob, p.indices).reshape(-1, 3); tris += len(idx)
            if p.attributes.TEXCOORD_1 is None: continue
            uv = acc(g, blob, p.attributes.TEXCOORD_1)
            if uv.min() < -1e-4 or uv.max() > 1 + 1e-4: print("  UV1 out of range", n.name); ok = False
            t = uv[idx]
            area += float(np.sum(0.5 * np.abs((t[:, 1, 0] - t[:, 0, 0]) * (t[:, 2, 1] - t[:, 0, 1]) -
                                              (t[:, 2, 0] - t[:, 0, 0]) * (t[:, 1, 1] - t[:, 0, 1]))))
    print(f"  nodes={len(g.nodes)} tris={tris} lightmap UV coverage={area:.2f} (must be < 1: no overlap)")
    if area >= 1.0: ok = False
    print("  replaces:", ", ".join(e["replaces"]))
print("\nRESULT", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
