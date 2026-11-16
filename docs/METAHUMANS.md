# MetaHumans for Monday

Goal: replace the one recolored stand-in body (`public/people/body.glb`, a Ready Player Me avatar on a Mixamo-style skeleton) with real characters. Andrew builds them in Unreal; Claude does the web conversion.

## Who to build

| Character | Seen where | Brief |
|---|---|---|
| The new hire (player) | Third-person, mostly from behind | Neutral, approachable, late 20s. Business casual, lanyard. Build one man and one woman if you can: the player picks. |
| Courier | Tower door | 40s, tired, a little scruffy. Hi-vis vest, cap optional, arms holding a parcel. No badge. |
| June Park | Reception, behind the desk | Woman, 30s–40s, warm, front-desk polish. Blazer or cardigan. |
| Maya Ruiz | Floor 14, finance | Woman, mid-30s, stressed but kind. Office casual. |
| Background staff (2–3) | Lobby, floor 14 | Mixed ages and looks, office clothes. Low priority. |

Voice-only (no model needed): fake "Dan" from IT, the real IT desk, Elena Voss, the outside caller.

## What to hand over (per character)

1. In Unreal, finish the MetaHuman and drop it in a level.
2. Export the **body and face as FBX at LOD 3** (LOD 3 uses hair cards instead of strand hair, and strand hair can't go to the web). Include the skeleton, skin weights and textures.
3. Put each one in its own folder, named after the character, inside `harbor-game\assets\metahumans\` (for example `assets\metahumans\june-park\`). Don't commit that folder; it's large. Just tell Claude it's there.

Animations are not needed from Unreal: Claude retargets the existing idle / walk / jog clips onto each character, so everyone moves the same way the current people do.

## What Claude does with them

- Retarget to the game skeleton, trim to about 30k triangles, shrink textures (2K body, 1K face), bake to one GLB per character (about 4–6 MB each).
- Swap them into `human.tsx` by name, so June is June and the courier is the courier instead of one tinted body.
- Later: mouth movement while they talk (needs the face shapes; LOD 0 only, so a follow-up).

## Watch-outs

- Strand hair and groom won't come through. LOD 3 hair cards look fine at game distance.
- Faces are seen close only in conversations, which are UI panels, so LOD 3 is enough.
- Keep clothing simple: layered cloth sims don't export.
