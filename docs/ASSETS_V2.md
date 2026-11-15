# Harbor & Co. asset pack v2: tower detail, physical security, elevator ride

These are new GLBs. They load on top of the v0.1 files, and they don't replace or change any existing GLB.
The units are meters. They're exported Y-up, in the same world space as `harbor_block.glb` (the origin is the sidewalk top in front of the tower doors, the buildings sit toward -Z and the water toward +Z).
**Every file loads at the world origin with no offset.** The one exception is `harbor_elevator_cab.glb` (see section 3).

All the files are in `public/assets/models/`, with a mirror copy in `assets/models/`.

| File | Triangles | Size | Purpose |
|---|---|---|---|
| `harbor_lobby_detail.glb` | 12.0k | 2.5 MB | Lobby security line (speed gates and balustrade), kiosk, CCTV, monitor bank, Stair A alarmed exit, mailroom, directory, seating, art, plants, lobby landing details |
| `harbor_f14_detail.glb` | 14.5k | 2.4 MB | Floor-14 meeting room, locked IT closet, print and shred area, desk clutter with the clean-desk hook, exit door, extinguishers, CCTV, blinds, plants, floor-14 landing details |
| `harbor_elevator_cab.glb` | 5.6k | 0.6 MB | Car A interior with its own doors, buttons, floor indicator and light |
| `harbor_shaft_cut.glb` | 30.9k | 3.4 MB | Replacement shells with an opening behind Elevator A, so the cab is visible (required for the cab) |
| `harbor_security_props.glb` | 0.7k | 0.3 MB | Reusable props: badges, lanyards, A-frame sign, door wedge, lockable pedestal, privacy filter |

Conventions are the same as v0.1:
- Every interactive object is its own named node, with its data in glTF `extras` (`userData` in three.js).
- `collider`: `mesh` means use a mesh BVH, `box` means use the bounds, `none` means no collision.
- `default_visible: false` means the node should be hidden at load. The existing code doesn't do this for the new files, so add a traverse that sets `obj.visible = obj.userData.default_visible !== false`.
- Hinged nodes have their origin on the hinge and **identity rotation**. Open them with `node.rotation.y = degToRad(open_deg) * t`, the same pattern as `Lobby_Door_L/R`.
- Sliding nodes use `node.position[slide_axis] = base + slide_dist * t`. Axes named in the extras are **glTF axes**.
- LED variant sets (`*_LED_Off|Red|Green`, `*_Lit|Unlit`, `*_Status_Off|Green|Red`) sit in the same spot. Show exactly one.

### Code changes Grok must make
1. Add the new files to `FILES` in `scenery.tsx`, run `prepare()` on them, and run `collect()` on the lobby, floor-14, cab and shaft-cut scenes.
2. **Skip invisible nodes in `collect()`**, or re-check `visible` in `hitScenery`. Hidden nodes such as `Parcel_Unattended` carry box colliders.
3. **Swap the shells.** Load `harbor_shaft_cut.glb`, then hide these originals and leave them out of the colliders: `Harbor_Tower` (its child `HARBOR_Sign` goes with it), `Lobby_Interior` (both in `harbor_block.glb`) and `Office_F14_Shell` (in `harbor_office_f14.glb`, with its children `Floor_Name` and `Floor_Number_14`). Their replacements are `*_ShaftCut` and are otherwise identical. Each one has a `replaces` extra naming the original.
4. Treat `role: turnstile` flaps as dynamic. They are `collider: none` on purpose, so a missing hook can never trap the player. Gate the lane in code instead: add a box per lane while it's closed (lane x-ranges are below).
5. On floor 14 the player is clamped to `pz >= -16.2` (sim.ts). That clamp has to relax to about -17.8 while boarding, or the cab can't be entered.

---

## 1. `harbor_lobby_detail.glb` (load at the origin)

The secure line is at **glTF z = -12.0** (Blender y = 12). South of it, toward the entrance, is public. North of it, at the elevators, is badge-only.
A glass balustrade (`Gate_Balustrade_West` and `Gate_Balustrade_East`, `role: security_barrier`, box collider) runs wall to wall. The only openings are the four gate lanes, plus the Stair A door.
The route from the entrance doors through lane 2 or lane 3 to Elevator A is clear. Nothing sits between x -1.6 and x 2.7 from the doors to the elevators except the gates.

**Speed gates** (`SpeedGate_Bank`, mesh collider, 5 cabinets). The gate cabinets span z -11.3 to -12.7.

| Lane | x range | Nodes |
|---|---|---|
| L1 | -1.7 .. -0.8 | `Turnstile_L1_Flap_W` (open_deg +90), `Turnstile_L1_Flap_E` (open_deg -90) |
| L2 | -0.6 .. 0.3 | `Turnstile_L2_Flap_W/E` |
| L3 | 0.5 .. 1.4 (lined up with Elevator A) | `Turnstile_L3_Flap_W/E` |
| L4 (accessible, 1.1 m) | 1.6 .. 2.7 | `Turnstile_L4_ADA_Gate` (`ada: true`, open_deg +90) |

- Flaps carry `role: turnstile`, `lane`, `part`, `hinge_axis: "y"`, `open_deg`, `closed_deg: 0`, `default_state: "closed"` and `blocks_when_closed: true`. All the flaps swing toward the elevators.
- Each lane has a reader, `Turnstile_L{n}_Reader` (`role: badge_reader`, `lane`, `interactive`), on top of the cabinet at its right-hand entry end. Its children are `Turnstile_L{n}_Reader_LED_Off/Red/Green` and a `_Face` plate.
- Each lane has a status light, `Turnstile_L{n}_Status` (`role: lane_status`), on the entry end. Its children are `_Off`, `_Green` (an arrow, the default) and `_Red` (an X).
- Suggested logic: when the player taps within 0.8 m of a reader, set that reader's LED to green, open both flaps over 0.4 s, hold for about 2.5 s, then close.
  - If an NPC follows the player through during the open window, that's **tailgating**. Flash the LED and status red and raise the beat.
  - A badge with no access (the visitor or contractor badge) gives a red LED and a red status, and the flaps stay closed.

**Signs and reception**
- `Sign_OneBadgeOnePerson_Lobby` (`hook: tailgating`) stands at the approach to the gates.
- `Visitor_Kiosk` (`role: visitor_kiosk`, `hook: visitor_sign_in`) has a child, `Visitor_Kiosk_Screen` (emissive sign-in form).
- `Visitor_Log_Clipboard` sits on the reception ledge.
- `Security_Monitor_Bank` (`role: security_monitors`) is behind reception. Its child `Security_Monitor_Bank_Screens` shows 4 CCTV feeds.
- `Mailroom_Shelf` (parcels, MAILROOM sign) is against the west wall.
- `Parcel_Unattended` (`hook: unattended_package`, `default_visible: false`, pickup) is an optional "parcel for Finance" left by the reception desk.
- `Directory_Sign` is the backlit building directory. Floor 14 is Harbor & Co. Operations.

**CCTV.** These are ceiling domes, all `role: camera` with `covers` and `fov_deg`, and each has a child `_LED` (red recording light):
- `CCTV_Lobby_Entrance`
- `CCTV_Lobby_Gates`
- `CCTV_Lobby_Elevators`
- `CCTV_Lobby_Reception`
- `CCTV_Lobby_StairDoor`

**Stair A.** `Stair_Core` (mesh collider) is the enclosure in the NE corner, x 8.6 to 10.65, z -14.4 to -17.65.
- `Stair_Door`: `role: door`, hinge at (8.66, 0, -15.1), `open_deg: -90` (swings into the stair), `propped_deg: -22`, `alarmed: true`, `locked: false`, `hook: propped_stair_door`. The ALARMED EXIT sign (`Stair_Door_Sign`) and the push bar move with it.
- `Stair_Door_Reader`, with LED children `_LED_Off/Red/Green`, is the re-entry reader on the lobby side.
- `Stair_Door_Alarm` has `_LED_Off` and `_LED_Red`.
- `Stair_Door_Wedge` (`default_visible: false`) is already positioned under the latch edge for `propped_deg`.
- The propped-door beat: set the door to `propped_deg`, show the wedge, set the alarm LED to red. The player should remove the wedge, close the door and report it.

**Lobby landing (Elevator A)**
- `Elevator_Lobby_A_CallButton` (`role: elevator_call_button`, `direction: up`) has children `_Lit` and `_Unlit`. It sits over the old always-on amber LED, so `_Unlit` really does read as off.
- `Elevator_Lobby_A_Lantern` (`role: hall_lantern`) has children `_Up_Lit/_Up_Unlit/_Down_Lit/_Down_Unlit`.
- `Elevator_Lobby_A_Indicator` has children `_L` (the default) and `_14`, as digits over the existing landing screen.

**Decor** (static): `Lobby_Seating`, `Lobby_Plants`, `Lobby_Art(_Panels)`, the pendants (`Reception_`, `Gate_` and `Seating_Pendant_Light`, emissive only) and `Elevator_Wall_Lettering`.

## 2. `harbor_f14_detail.glb` (load at the origin; floor at y = 50.6)

Nothing from `harbor_office_f14.glb` is duplicated or moved.

**Meeting room** (x -10 to -6.4, z -12.4 to -16.6)
- Glass walls: `MeetingRoom_Glass_South` and `MeetingRoom_Glass_East` (mesh colliders).
- `MeetingRoom_Door`: glass door, hinge at (-6.4, 50.6, -12.55), `open_deg: 90`, swings into the room.
- `MeetingRoom_Furniture`.
- `MeetingRoom_TV_Screen` (`hook: screen_visible_through_glass`) shows a CONFIDENTIAL deck.
- `MeetingRoom_Whiteboard` (`hook: sensitive_info_on_whiteboard`): Guest Wi-Fi password and "vendor bank change" notes.

**IT / server closet** (x -3.6 to -0.9, z -14.35 to -16.6)
- `ServerCloset_Walls`.
- `ServerCloset_Door`: `role: door`, **`locked: true`**, `requires_badge`, hinge at (-2.75, 50.6, -14.35), `open_deg: -90` (swings out), `ajar_deg: -12`, `hook: unlocked_server_closet`. The AUTHORIZED PERSONNEL ONLY sign is a child of the door.
- `ServerCloset_Reader`, with `_LED_Off/Red/Green`.
- `ServerRacks` holds 2 racks.
- Rack LEDs (`role: blink_leds`):
  - `ServerRack_LEDs_A`: `blink_hz` 2.0.
  - `ServerRack_LEDs_B`: `blink_hz` 1.3. Toggle A and B out of phase.
  - `ServerRack_LED_Fault`: red, hidden.
- The unlocked-closet beat: set `locked=false` and the rotation to `ajar_deg`. The correct action is to close it and report it, not to walk in.

**Print and copy** (next to the existing printer)
- `PrintArea`.
- `Shred_Bin_Secure`: `role: shred_bin`, `locked: true`, `hook: secure_disposal`.
- `Recycle_Bin_Paper`: `role: trash_bin`, `kind: paper_recycling`. Its label says it is not for confidential paper.
- `Trash_Bin`: `kind: general`.
- `Printer_Output_Sheets`: `role: clean_desk_hook`, `hook: unclaimed_printout`, pickup. It's the wire form left on the printer.
- `Printer_Release_Reader`: secure print release, with LEDs.
- The disposal beat: the printout or the wire form goes in `Shred_Bin_Secure`. Putting it in the recycling or the general bin is the wrong answer.

**Desks**
- `Desk_Clutter` adds mugs, trays, headsets, papers and pedestals to Desk_01..08. It has a child with locked screens on desks 01, 04 and 06, and plain sticky notes.
- **`Sticky_Password_Desk07`**: `role: clean_desk_hook`, `hook: password_sticky_note`, pickup. It sits on the monitor bezel of Desk_07, which faces the elevator.
- `Monitor_Desk07_Screen` (`hook: unlocked_unattended_screen`) shows the unlocked `Vendor_payments_Q4.xlsx`.
- `Desk_Player_Mug`.

**Walls and ceiling**
- `Coat_Hooks`.
- `Emergency_Exit_Door`: `role: door`, `kind: emergency_exit`, `alarmed`, hinge at (-9.975, 50.6, -4.4), `open_deg: -90`. There's no stair behind the wall, so keep it closed or swing it into the office.
- `Emergency_Exit_Frame`, with EXIT, evacuation plan and FIRE EXTINGUISHER signs.
- `Fire_Extinguisher_West` and `Fire_Extinguisher_North`.
- CCTV: `CCTV_F14_Elevator`, `CCTV_F14_ServerCloset`, `CCTV_F14_PrintArea`.
- `Window_Blinds` (no collider).
- `F14_Plants`.

**Floor-14 landing**
- `Elevator_F14_A_CallButton` (`direction: down`, `_Lit/_Unlit`).
- `Elevator_F14_A_Lantern` (`_Up/_Down` × `_Lit/_Unlit`).
- `Elevator_F14_A_Indicator` (`_L`, `_14`; the default is 14).

## 3. `harbor_elevator_cab.glb` (needs placement)

**The origin is the centre of the door threshold, on the landing-door plane.** The cab extends behind the origin, toward glTF -Z. Inside it is 1.6 m wide × 1.26 m deep × 2.6 m tall.
Place it with **translation only, no rotation**:

| Landing | glTF position of the `Elevator_Cab` root |
|---|---|
| Lobby | `(1.5, 0.0, -17.36)` |
| Floor 14 | `(1.5, 50.6, -16.51)` |

(These values are also in the root's extras as `place_lobby` and `place_f14`.)

The node tree:
- `Elevator_Cab` is an empty root. Its children:
- `Elevator_Cab_Shell`: mesh collider.
- `Elevator_Cab_Door_L` and `_R`: `role: elevator_door`, `part: cab`, `slide_axis: "x"`, `slide_dist` -0.72 and +0.72. When open, they slide into the landing-wall pocket.
- `Elevator_Cab_Button_14` and `Elevator_Cab_Button_L`: `role: elevator_button`, `floor`, `interactive`. Their children are `_Lit` and `_Unlit`. They're on the right-hand wall as you walk in, at about 1.1–1.4 m.
- `Elevator_Cab_Indicator`: its children are `Elevator_Cab_Indicator_L`, `_02` … `_14` and `_Up` / `_Down`. Show one floor at a time.
- `Elevator_Cab_Light`: a KHR point light, which `prepare()` scales like the others.

The landing doors (`Elevator_Lobby_A_Door_L/R` and `Elevator_F14_A_Door_L/R`) are 0.1 m in front of the cab doors. Animate both pairs together.

### Suggested on/off sequence
1. **Call.** The player presses E near the landing. Set `*_CallButton_Lit` on. Place the cab at that landing and show it. Set the landing indicator to that floor and light the lantern arrow. Open the landing doors and cab doors together (about 1.2 s).
2. **Board.** Once the player is inside (local z < -0.4 from the threshold), light the target button and turn the call button off. After 1 s, close both pairs of doors.
3. **Ride** (about 4–6 s).
   - Keep the camera in the cab. Step `Elevator_Cab_Indicator_*` from L through 2…13 to 14 (or the reverse), about 0.3 s per floor, with the `_Up` or `_Down` arrow showing. Add a soft hum and a slight camera bob.
   - Halfway through, fade to black, then move the player **and** the cab root by the delta between the two placements. The delta is (0, +50.6, +0.85) going up. Fade back in.
   - Teleporting the player by the same delta keeps their position inside the cab.
4. **Arrive.** Chime. Light the destination lantern. Open the doors. Set the destination button to unlit. The player walks out, the doors close after 3 s, and the cab is hidden.

## 4. `harbor_security_props.glb`

Each prop is one root node. Its origin is the prop's pivot: the card centre for badges, the clip for lanyards, the base centre for everything else. They're laid out in a row along +X for preview only, so set the positions in code.

| Prop | Extras and nodes |
|---|---|
| `Visitor_Badge` | `escort_required`, `hook: visitor_without_escort` |
| `Contractor_Badge_Temp` | `access_rights: none`, `hook: contractor_tailgating` |
| `Lanyard_Visitor_Red`, `Lanyard_Staff_Navy` | Lanyards |
| `Sign_OneBadgeOnePerson_AFrame` | `hook: tailgating`. Printed on both faces |
| `Door_Wedge` | `hook: propped_door` |
| `Drawer_Pedestal_Lockable` | `locked`. Drawers `Drawer_Pedestal_Drawer_1..3` have `slide_axis: z`, `slide_dist: 0.35`. `Drawer_Pedestal_Lock`, with a hidden `Drawer_Pedestal_Lock_Key` (`hook: key_left_in_lock`) |
| `Monitor_Privacy_Filter` | Child `_Screen`, and a toggleable `Monitor_Privacy_Filter_Panel` |

## 5. Physical-security training hooks these assets enable

| Beat | Nodes | Good outcome |
|---|---|---|
| Tailgating at the gates | `Turnstile_L*`, `Turnstile_L4_ADA_Gate`, `Sign_OneBadgeOnePerson_*`, `CCTV_Lobby_Gates` | Badge in yourself. Don't hold the flap or the wide gate open for the courier. |
| Propped stair door | `Stair_Door` (`propped_deg`), `Stair_Door_Wedge`, `Stair_Door_Alarm_LED_Red`, `CCTV_Lobby_StairDoor` | Remove the wedge, close the door, report it to security. |
| Unlocked or ajar server closet | `ServerCloset_Door` (`locked=false`, `ajar_deg`), `ServerCloset_Reader` | Don't enter. Close it and report it to IT (ext 4100). |
| Visitor without an escort | `Visitor_Badge`, `Contractor_Badge_Temp`, `Visitor_Kiosk`, `Visitor_Log_Clipboard` | Someone with a red badge north of the gates or on 14 with no host: politely redirect them to reception. |
| Password sticky note | `Sticky_Password_Desk07` and `Monitor_Desk07_Screen` | Remove the note (or report it) and lock the unattended screen. |
| Shred bin vs the regular bin | `Shred_Bin_Secure` vs `Recycle_Bin_Paper` / `Trash_Bin`, and `Printer_Output_Sheets` | Confidential paper goes in the locked shred console. |
| Extras | `MeetingRoom_Whiteboard`, `MeetingRoom_TV_Screen`, `Parcel_Unattended`, `Printer_Release_Reader`, `Drawer_Pedestal_Lock_Key`, `Monitor_Privacy_Filter_Panel`, `Security_Monitor_Bank` | Clear the whiteboard, report the unknown parcel, use secure print, take the key, use privacy screens. |

## Rebuild
The scripts are in `tools/asset-build/`, next to the v0.1 scripts. Their paths are hard-coded to `/home/claude/harbor`, so edit those for local use. Run them in this order:

```
python3 tex.py && python3 labels.py && python3 labels_v2.py
python3 build_block.py && python3 build_office.py
python3 build_shaft_cut.py && python3 build_elevator.py && python3 build_lobby_detail.py && python3 build_f14_detail.py && python3 build_security_props.py
python3 glbinfo.py out/harbor_lobby_detail.glb -q      # prints node names, extras and triangle counts
```

Add `--render` (plus view names) to any `build_*` script for Cycles previews.
