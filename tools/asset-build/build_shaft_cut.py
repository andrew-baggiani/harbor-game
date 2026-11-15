"""harbor_shaft_cut.glb: drop-in replacements for three existing nodes, rebuilt from the ORIGINAL build
scripts with only one change each: an opening behind Elevator A so the new elevator cab can be seen and
entered when the landing doors open.

  Harbor_Tower      -> Harbor_Tower_ShaftCut      (north stone wall opened at x 0.66..2.34, z 0..2.65,
                                                    plus a small stone hoistway annex behind the tower)
  Lobby_Interior    -> Lobby_Interior_ShaftCut    (granite elevator wall opened at x 0.8..2.2, z 0..2.4)
  Office_F14_Shell  -> Office_F14_Shell_ShaftCut  (north wall opened at x 0.8..2.2, z F..F+2.4)

Everything else in those meshes is byte-for-byte the same generator (same RNG sequence), so the window
pattern etc. match. The game hides the originals by name and shows these instead (see docs/ASSETS_V2.md).
"""
import sys; sys.path.insert(0, '/home/claude/harbor')
import bpy, lib

def run_patched(path, replacements):
    src = open(path).read()
    for a, b in replacements:
        assert src.count(a) == 1, ("patch anchor not found exactly once", a)
        src = src.replace(a, b)
    src = src.replace("from lib import *", "from lib import *\nexport = lambda *a, **k: None")
    argv = sys.argv; sys.argv = [path]
    g = {"__name__": "__patched__", "__file__": path}
    exec(compile(src, path, "exec"), g)
    sys.argv = argv
    return g

def keep_only(names_suffix):
    keep = set()
    for root, suf in names_suffix.items():
        o = bpy.data.objects[root]
        stack = [o]
        while stack:
            c = stack.pop(); keep.add(c); stack.extend(c.children)
    for o in list(bpy.data.objects):
        if o not in keep: bpy.data.objects.remove(o, do_unlink=True)
    for o in list(keep):
        o.name = o.name + "_ShaftCut"
        o["replaces"] = o.name[:-len("_ShaftCut")]
        o["note"] = "v2 replacement with an opening behind Elevator A; hide the original node of the same base name"

# ---------------- block: tower + lobby ----------------
TOWER_WALL = 'tw.box(TX0, TY1 - 0.35, 0, TX1, TY1, LOBBY_H - 0.45, "stone_trim")                        # north wall'
TOWER_CUT = '''for _a, _b, _z0 in ((TX0, 0.66, 0), (2.34, TX1, 0), (0.66, 2.34, 2.65)):
    tw.box(_a, TY1 - 0.35, _z0, _b, TY1, LOBBY_H - 0.45, "stone_trim")                        # north wall (cut for cab A)
tw.box(0.55, TY1, -0.02, 2.45, TY1 + 0.95, LOBBY_H - 0.45, "stone_trim", mats={'front': None})   # hoistway annex'''
LOBBY_WALL = 'lb.box(-4.0, TY1 - 0.55, 0, 4.0, TY1 - 0.35, LOBBY_H - 0.55, "granite_polished")'
LOBBY_CUT = '''for _a, _b, _z0 in ((-4.0, 0.8, 0), (2.2, 4.0, 0), (0.8, 2.2, 2.4)):
    lb.box(_a, TY1 - 0.55, _z0, _b, TY1 - 0.35, LOBBY_H - 0.55, "granite_polished")'''
run_patched("/home/claude/harbor/build_block.py", [(TOWER_WALL, TOWER_CUT), (LOBBY_WALL, LOBBY_CUT)])
keep_only({"Harbor_Tower": 1, "Lobby_Interior": 1})
bpy.context.view_layer.update()
blk = [o for o in bpy.data.objects]
# stash block objects in a collection so the office script's reset() doesn't wipe them: export now to temp
lib.export("/tmp/_shaft_block.glb")

# ---------------- office shell ----------------
OFF_WALL = 'sh.box(OX0, OY1, F, OX1, OY1 + 0.2, CEIL, "plaster_white")'
OFF_CUT = '''for _a, _b, _z0 in ((OX0, 0.8, F), (2.2, OX1, F), (0.8, 2.2, F + 2.4)):
    sh.box(_a, OY1, _z0, _b, OY1 + 0.2, CEIL, "plaster_white")'''
run_patched("/home/claude/harbor/build_office.py", [(OFF_WALL, OFF_CUT)])
keep_only({"Office_F14_Shell": 1})
bpy.ops.import_scene.gltf(filepath="/tmp/_shaft_block.glb")
for o in bpy.data.objects:
    if o.name.endswith(".001"): o.name = o.name[:-4]
tris = lib.stats()
print("OBJECTS", sorted(o.name for o in bpy.data.objects))
print("TRIANGLES", tris)
lib.export(f"{lib.OUT}/harbor_shaft_cut.glb")
