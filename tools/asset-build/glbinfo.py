"""Print node names, extras and triangle counts of a GLB (verification helper)."""
import sys, json, os
from pygltflib import GLTF2
p = sys.argv[1]; g = GLTF2().load(p)
def tris(mi):
    t = 0
    for pr in g.meshes[mi].primitives:
        if pr.indices is not None: t += g.accessors[pr.indices].count // 3
        else: t += g.accessors[pr.attributes.POSITION].count // 3
    return t
total = 0
for i, n in enumerate(g.nodes):
    t = tris(n.mesh) if n.mesh is not None else 0
    total += t
    ex = n.extras if n.extras else {}
    if "-q" not in sys.argv or ex:
        print(f"{n.name:44s} tris={t:6d} children={len(n.children or [])} {json.dumps(ex) if ex else ''}")
print("NODES", len(g.nodes), "TRIANGLES", total, "SIZE_MB", round(os.path.getsize(p) / 1e6, 2), "IMAGES", len(g.images or []))
