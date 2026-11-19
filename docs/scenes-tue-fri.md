# Tuesday–Friday scene spec

For Claude. Not code. About twenty minutes a day, three or four beats. The player is still the night clerk. No personal names. Harbor & Co. is the company in the building. Other firms are fictional.

Textures are in `grok-art-tue-fri.zip`. A is the calm state. B is the moment it goes wrong. Mesh names below match those files.

A wrong choice does not end the night. About a minute later the floor shows the result. Times below are from the choice, not from the start of the shift.

## Tuesday · The vendor

Where: floor 14 desks, then the aisle, then the lobby on the way out.

Order: invoice, contractor, transfer site, badge.

### 1. Invoice · floor 14, the player's desk

Prop: `Beat_Tue_Invoice_Screen_A`, swaps to `Beat_Tue_Invoice_Screen_B` if they pay or reply.

Who speaks: the accounts clerk, standing at the desk. Role only.

Line: the vendor's bank changed last night, and the invoice is due before the shift ends.

Right: call the vendor on the number already on file. Screen stays on A. The clerk hears the vendor say the bank did not change.

Wrong, pay or reply:

- 0s. The screen flips to B. The address is one letter off.
- 20s. The clerk says the payment left.
- 50s. A phone on the next desk rings. The real vendor is calling about an unpaid invoice.
- 75s. The clerk, quieter: the money is not coming back tonight.

### 2. Contractor · floor 14 aisle, by a dark laptop

Prop: `Beat_Tue_Badge_A` on a lanyard in his hand. If the player signs him in, the laptop lid shows a session that is not his. No screen file for that. Use the badge mesh.

Who speaks: the contractor.

Line: his login died at noon. He needs one upload. He asks for the player's.

Right: send him to the service desk. He goes. The laptop stays dark.

Wrong, share the login:

- 0s. The laptop wakes under the player's name.
- 25s. He says he will only be a minute, and he does not get up.
- 55s. A folder the player never opened finishes uploading.
- 80s. The session is still his when the player walks away.

Wrong, he only watches:

- 40s. He repeats the folder path back, correctly.
- 70s. Later, at another desk, someone says he asked them for that same path.

### 3. Transfer site · back at the player's desk

Prop: `Beat_Tue_Transfer_Screen_A`. B if they upload or mail it out.

Who speaks: a coworker, from the next chair. Role only.

Line: the company share is down for ten minutes. The client file has to move. They have a free site open.

Right: wait. A stays up. The share comes back. Nothing leaves.

Wrong, upload or personal mail:

- 0s. Screen flips to B. The link has no names.
- 30s. The coworker says it went.
- 70s. A mail notice: the link was opened from outside the company.

### 4. Badge · lobby, on the way to the elevator

Prop: `Beat_Tue_Badge_A` on the bench. `Beat_Tue_Badge_B` only if the player leaves it and comes back, or if they use it.

Who speaks: nobody. The badge is the beat. A lobby guard can answer if spoken to. Role: security.

Right: pick it up and hand it to security. They kill it. A leaves the bench.

Wrong, use it:

- 0s. The gate opens.
- 40s. The guard looks at the log, then at the player.
- 75s. He says the contractor already reported it lost, and the log shows a use after that.

Wrong, leave it:

- 60s. From the elevator glass: a visitor bends down at the bench.
- 85s. The gate opens for someone who did not badge themselves.

## Wednesday · The data

Where: floor 14 desks the whole night. No new floor.

Order: share link, customer list, writing tool.

### 1. Share link · player's desk

Prop: `Beat_Wed_Share_Screen_A`. B if they send the open link or a personal address.

Who speaks: a coworker. Role only.

Line: the client wants the drawings tonight. The window is already on "anyone with the link."

Right: add the client's work addresses. A stays, with the names. Send.

Wrong, open link or personal mail:

- 0s. Screen flips to B.
- 30s. The coworker says the client has it.
- 65s. A second notice: the file was downloaded by an address that was not on the job.

### 2. Customer list · same desk, next

Prop: no new screen. A slide on `Beat_Wed_Share_Screen_A` can be reused, dimmed, with the sheet marked internal. If a mesh is needed: `Beat_Wed_Sheet` as a paper on the desk, not a monitor.

Who speaks: the coworker again, or a meeting reminder on the phone. Role: coworker.

Line: drop the full customer list into a slide. The meeting is not about those customers. The sheet says internal.

Right: ask the owner. The player does not paste. The owner is not in the room. That is still the right end.

Wrong, paste the list:

- 20s. The slide shows rows of names.
- 50s. The deck sends itself to a partner thread the player did not open.
- 80s. The coworker reads one name back. They should not have it.

Wrong, paste only the count:

- 40s. The count is on the slide.
- 75s. Someone who was not in the meeting quotes the number.

### 3. Writing tool · same desk

Prop: `Beat_Wed_Ai_Screen_A`. B if they paste, even with the name removed.

Who speaks: nobody. The screen asks.

Line on the glass: it will clean up the paragraph. The account number is in the paragraph. The corner says personal account.

Right: close it and rewrite in company mail. A stays empty.

Wrong, paste:

- 0s. Screen flips to B. The complaint is in the box.
- 35s. The tool offers the cleaned line, account number still in it.
- 70s. The player can still see it in the tool's history after they close the tab.

## Thursday · On the road

Where: a cafe, then a home kitchen. The lost laptop happens at the cafe, not on a street the build does not have. The call can happen at the cafe table.

Order: wifi, lost laptop, the call, the kitchen.

### 1. Wifi · cafe

Prop: `Beat_Thu_Wifi_Phone_A` in the player's hand. B if they join the open twin.

Who speaks: nobody. The phone is the beat.

The list shows Harbor Work, Harbor Guest, and Harbor_Guest. A is joined to Harbor Work. B is joined to Harbor_Guest.

Right: company hotspot, or Harbor Work. Mail waits. A stays.

Wrong, join the twin, even for one reply:

- 0s. Phone flips to B. Mail starts.
- 30s. The page they open is the company mail, and it looks normal.
- 70s. After they leave the cafe seat, the phone still shows that mailbox as signed in.

### 2. Lost laptop · same cafe, the chair

Prop: `Beat_Thu_Find_Phone_A`. The bag was on the chair. It is not there now. B if they wait or only try a lock.

Who speaks: nobody, until they call. Then the help desk, role only, on the phone.

Right: call and say it is missing. A, then the "mark missing" state. Help desk says the session is being killed.

Wrong, wait, or lock it quietly:

- 0s. Phone flips to B. Offline. Last seen here. Not reported.
- 40s. The lock spinner fails.
- 75s. The phone: the machine checked in once from a network that is not the cafe, and no one was told.

### 3. The call · cafe table, or the kitchen if the cafe beat already ended

Prop: `Beat_Thu_Call_Phone_A` if they are calling the number on file. `Beat_Thu_Call_Phone_B` for the incoming voice.

Who speaks: a voice with no face. Role: someone pretending to be the finance lead. Not named.

Line: release a payment before the bank closes. Do not call back. They are walking into a meeting.

Right: hang up. Call the number the company has. The phone shows A. The real lead is in the meeting and did not call.

Wrong, pay, or text the same number:

- 0s. Phone stays on B.
- 25s. They confirm. Of course they do.
- 55s. A mail on the laptop, if it is still here: payment sent.
- 85s. The real lead, on the known number if the player finally calls, says they were in the meeting the whole time.

### 4. Kitchen · home

Prop: the work laptop, open, unlocked, on the table. No new screen. If a mesh is needed: `Beat_Thu_Home_Laptop`.

Who speaks: someone in the house. Role only. Not named.

Line: they only need a minute.

Right: lock it and take it. The lid shuts. The beat ends.

Wrong, let them, or watch from the door:

- 20s. The screen is a work folder, then a personal upload.
- 50s. A stick goes into the side while the player is on the parcel.
- 80s. The history shows a file leaving to a place that is not the company share.

## Friday · The incident

Where: floor 14 aisle, then the player's desk.

Order: the copy, the thread, the note.

### 1. The copy · aisle

Prop: a laptop that is not the player's, lid closing. Mesh: `Beat_Fri_Aisle_Laptop`. No texture from this pack.

Who speaks: a coworker on their last day. Role only.

Line: none, if they get the lid down in time. If the player is early enough to see it: a copy bar, a share they do not work in, a small drive.

Right: tell security what the screen was doing. The player does not have to say why. Security takes the drive. The copy stops.

Wrong, let it go, or only ask them to stop:

- 0s. The lid is shut.
- 30s. They say they stopped.
- 70s. From the end of the aisle, the drive is in their bag, and the share still shows the copy as finished.

### 2. The thread · player's desk

Prop: `Beat_Fri_Report_Screen_A` if they open the report. `Beat_Fri_Report_Screen_B` if they delete or only forward.

Who speaks: nobody. The mail speaks.

The thread has account numbers. One reply is from an address outside the company.

Right: report on the posted channel. A. A short confirmation, then it leaves the player's hands.

Wrong, delete:

- 0s. Screen is B. Delete is the bright button.
- 20s. It leaves the player's inbox.
- 60s. The outside address is still on the thread. Nothing was pulled back.
- 85s. No one else has it in the queue.

Wrong, forward only to a manager:

- 40s. The forward sits unread.
- 80s. The manager's chair is empty. The out-of-office is the only reply.

### 3. The note · same desk, the file share

Prop: `Beat_Fri_Note_Screen_A` is the share, normal. `Beat_Fri_Note_Screen_B` is the note. The beat starts by opening A and finding B.

Who speaks: nobody. If they call, the incident line. Role: incident desk.

The note is from a fictional group, Northglass. The wallet on screen is XXXX. There is no address to pay.

Right: unplug the network cable and call the incident number. The screen can stay on B. The call is the end. They are told not to pay and not to wipe.

Wrong, pay:

- 0s. The department card is charged. The note does not change.
- 40s. The timer resets, higher.
- 80s. The files are still locked. The note thanks them.

Wrong, wipe:

- 0s. The screen goes black.
- 30s. It comes back empty.
- 70s. The incident desk, if they call after, says the other machines are still locked and this one has nothing left to show how it started.

## Mesh list

| Mesh | Texture |
|---|---|
| Beat_Tue_Invoice_Screen_A | screens/tue-invoice-email-a.webp |
| Beat_Tue_Invoice_Screen_B | screens/tue-invoice-email-b.webp |
| Beat_Tue_Transfer_Screen_A | screens/tue-transfer-site-a.webp |
| Beat_Tue_Transfer_Screen_B | screens/tue-transfer-site-b.webp |
| Beat_Tue_Badge_A | props/tue-contractor-badge-a.webp |
| Beat_Tue_Badge_B | props/tue-contractor-badge-b.webp |
| Beat_Wed_Share_Screen_A | screens/wed-share-dialog-a.webp |
| Beat_Wed_Share_Screen_B | screens/wed-share-dialog-b.webp |
| Beat_Wed_Ai_Screen_A | screens/wed-ai-writer-a.webp |
| Beat_Wed_Ai_Screen_B | screens/wed-ai-writer-b.webp |
| Beat_Thu_Wifi_Phone_A | phones/thu-wifi-list-a.webp |
| Beat_Thu_Wifi_Phone_B | phones/thu-wifi-list-b.webp |
| Beat_Thu_Call_Phone_A | phones/thu-incoming-call-a.webp |
| Beat_Thu_Call_Phone_B | phones/thu-incoming-call-b.webp |
| Beat_Thu_Find_Phone_A | phones/thu-find-device-a.webp |
| Beat_Thu_Find_Phone_B | phones/thu-find-device-b.webp |
| Beat_Fri_Report_Screen_A | screens/fri-report-form-a.webp |
| Beat_Fri_Report_Screen_B | screens/fri-report-form-b.webp |
| Beat_Fri_Note_Screen_A | screens/fri-lock-note-a.webp |
| Beat_Fri_Note_Screen_B | screens/fri-lock-note-b.webp |

Prints, not beats: `Frame_F14_Quay` and `Frame_F14_Cranes`, portrait 2:3, files in `prints/`.

Do not rename `Monitor_Player_Screen`. These are new meshes.
