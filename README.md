# Harbor & Co. — Monday night asset pack (v0.1)

All units are meters. Everything is exported as glTF with Y pointing up. The origin is street level (the sidewalk top) in front of the Harbor Tower doors.
The buildings sit toward glTF -Z and the harbor water toward +Z. The road runs along X. Characters and cars face +Z.

## Files
| File | What |
|---|---|
| assets/models/harbor_block.glb | The quay street, sidewalk, quay apron and wall, and water. 7 brick buildings (3 with shops), a gate house and yard, the Harbor Tower shell and lobby, the ship M/V MERIDIAN, containers, a portal crane, sodium street lamps (KHR lights) and 4 parked cars |
| assets/models/harbor_office_f14.glb | Floor 14, 20 x 16 m. It's positioned in world space (floor at y = 50.6), so it loads in place inside the tower. The tower's floor-14 glass is see-through |
| assets/models/harbor_props.glb | Hand-held props: the player badge (with clip), the courier's blank card, Maya's phone (lit screen), the wire form, the "Salary review" USB stick, an envelope and an evidence bag |
| assets/models/vehicle_*.glb | The company sedan (navy, drivable; its headlight spots are set to 0 W) and 3 traffic cars. The wheels are separate nodes with their origins at the hub centers |

## Interaction nodes (glTF `extras` on each node)
- `Lobby_Door_L` / `Lobby_Door_R`: the origin is at the hinge, with `open_deg` +90 / -90 about Y. Both swing inward.
- `BadgeReader` with children `BadgeReader_LED_Off|Red|Green`: all three LEDs are in the same spot. Show one and hide the others (`default_visible` says which is on at start).
- `Elevator_Lobby_A_Door_L/R` and `Elevator_F14_A_Door_L/R`: these slide along X by `slide_dist`. Elevator B is set dressing only.
- `Reception_Desk` (with the `RECEPTION` plaque).
- `Desk_Player` (desk 14-03).
- `Monitor_Player_Screen`: shows the email with the gift-card request and a "Report phishing" button.
- `Envelope_Mail`: hidden until the mail beat.
- `DeskPhone` + `DeskPhone_RingLight`: the ring light is hidden until the phone rings.
- `Laptop_Open`.
- `USB_SalaryReview`: a pickup.
- `Company_Sedan_Navy`: `Wheel_FL/FR` are tagged `steer: true`.
- The `collider` extra: `mesh` means use a mesh collider, `box` means use the bounds, `none` means no collision.

## Rebuild
From tools/asset-build/. Requires Python 3.11+ with `pip install bpy numpy pillow`.
`python3 tex.py && python3 labels.py && python3 build_block.py && python3 build_office.py && python3 build_props_cars.py`
For Cycles preview renders, add `--render street|door|overview|lobby|quay` (block) or `--render all` (office).

## Not in this pack
The people (the new hire, the courier, June Park, Maya Ruiz and 3 dockworkers) and their idle/walk/jog animation clips.
