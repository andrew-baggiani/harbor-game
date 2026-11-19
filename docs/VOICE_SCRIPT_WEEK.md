# Week voice script (Tuesday to Saturday, role tracks)

Generated from the game's own lines (`src/content/week/voices.ts`), so the audio always matches the captions. Files go in `public/voice/v2/<id>.mp3`; until a file exists the game falls back to the browser voice, same as Monday.

Model: eleven_v4. Monday voices are reused where the cast sheet says to. The four fake callers and the real finance lead and incident desk all have different voices, per Grok's cast additions.

| id | Voice | Line |
|---|---|---|
| `wk-TUE-01-invoice` | Tasha (Monday's Maya) | A vendor email says their bank account changed last night. The invoice is due today. The address is one letter off the vendor you pay every month. |
| `wk-tue-invoice-pay-1` | Tasha (Monday's Maya) | The payment left. |
| `wk-tue-invoice-pay-2` | Will, coworker | The real vendor is on the phone. Their invoice is unpaid. |
| `wk-tue-invoice-pay-3` | Tasha (Monday's Maya) | That money isn't coming back tonight. |
| `wk-tue-invoice-wait-0` | Tasha (Monday's Maya) | Someone else just got the same email. They paid it. |
| `wk-TUE-02-contractor` | Chris, down-to-earth | He says his login expired at noon and the job has to go out tonight. He asks to borrow yours, just to upload one folder. |
| `wk-tue-access-share-1` | Chris, down-to-earth | Just a minute. I'll be quick. |
| `wk-tue-access-watch-0` | Chris, down-to-earth | He reads the folder path back to you. Correctly. |
| `wk-tue-access-watch-1` | Will, coworker | He asked me for that same path. |
| `wk-TUE-03-shadow` | Tasha (Monday's Maya) | A coworker sends a link to a free transfer site. The company share is down, they say, and the client file has to move in the next ten minutes. |
| `wk-tue-shadow-send-1` | Tasha (Monday's Maya) | It went. |
| `wk-TUE-04-badge` | Diane (June Park) | A contractor badge is on the bench by the gates. The photo is face down. The gates are in their night schedule. |
| `wk-tue-badge-use-1` | Diane (June Park) | The guard looks at the log. Then at you. |
| `wk-tue-badge-use-2` | Diane (June Park) | That badge was reported lost an hour ago. The log shows a use after that. |
| `wk-WED-01-link` | Tasha (Monday's Maya) | A client needs the drawings tonight. The share window is set to anyone with the link. The send button is already highlighted. |
| `wk-wed-link-anyone-1` | Tasha (Monday's Maya) | Client has it. |
| `wk-WED-02-classify` | Tasha (Monday's Maya) | Someone asks you to drop the full customer list into a slide for a meeting that is not about those customers. The sheet is marked internal. |
| `wk-wed-class-all-2` | Tasha (Monday's Maya) | They just read one name back. They shouldn't have it. |
| `wk-WED-03-ai` | Benjamin (Monday narrator) | A personal writing tool is open. The box says it will clean up your paragraph. The paragraph is a customer complaint, with the account number in it. |
| `wk-THU-01-wifi` | Benjamin (Monday narrator) | The cafe network has no password. Mail is already trying to sync. A window offers to join. |
| `wk-THU-02-laptop` | Benjamin (Monday narrator) | You set the bag down for a minute. When you turn around it is gone. The laptop was asleep, not shut down. |
| `wk-THU-03-voice` | Eric, the fake finance lead | The voice is right. The hurry is right. They want a payment released before the bank closes, and they tell you not to call back because they are walking into a board meeting. |
| `wk-thu-voice-send-1` | Eric, the fake finance lead | Perfect. Thank you. |
| `wk-thu-voice-send-3` | Roger, the real finance lead | On the known number: I've been in the meeting the whole time. |
| `wk-thu-voice-text-2` | Roger, the real finance lead | On the known number: that wasn't me. |
| `wk-THU-04-home` | Hope, natural | You step out to take a parcel. The work laptop is unlocked. Someone in the house sits down and says they only need it for a minute. |
| `wk-FRI-01-insider` | Erick, young and relaxed | It is their last day. The screen is a file share they do not work in. A copy is running to a small drive, and they close the laptop when you walk up. |
| `wk-fri-insider-ask-0` | Erick, young and relaxed | I stopped. Promise. |
| `wk-FRI-02-report` | Benjamin (Monday narrator) | You are copied on a thread that is not yours. It has customer account numbers, and one reply is from an address outside the company. |
| `wk-FRI-03-hour` | Benjamin (Monday narrator) | The file share opens onto a note. It says the files are locked, and a payment before midnight will unlock them. A timer is running. |
| `wk-fri-hour-wipe-2` | Sami, real incident desk | Other machines are still locked. Yours has nothing left to show how it started. |
| `wk-SAT-01-delivery` | Benjamin (Monday narrator) | Your parcel is held. Pay a $1.99 redelivery fee within 2 hours or it goes back. A short link follows. You are expecting a parcel. |
| `wk-SAT-02-reuse` | Benjamin (Monday narrator) | Your account was in a data breach. Reset your password. It's the same password you use for work, plus a different number on the end. |
| `wk-SAT-03-post` | Benjamin (Monday narrator) | First week done. You took a photo at your desk. Your badge is on the lanyard in the shot, and the whiteboard behind you has the guest Wi-Fi password. |
| `wk-SAT-04-router` | Benjamin (Monday narrator) | You work from home some days. The router still has the admin password from the sticker on the bottom, and its app says an update is waiting. |
| `wk-ADM-01-pushstorm` | Benjamin (Monday narrator) | Eleven sign-in prompts in four minutes for your global admin account. You aren't signing in. The twelfth says: approve to stop these notifications. |
| `wk-ADM-02-vendor` | Boyd, tired peer | To finish setup tonight we need Global Administrator on your tenant. Just for an hour, then remove it. Our engineer is waiting on a call. |
| `wk-ADM-03-daily` | Benjamin (Monday narrator) | You're signed in with your admin account to fix a mailbox. A coworker messages a link to the lunch order form. Your admin session is the only one open. |
| `wk-ADM-04-script` | Benjamin (Monday narrator) | Same error you have. 'Run this one-liner as admin, fixed it for me.' It downloads and runs a script from a site you don't know. |
| `wk-FIN-01-payroll` | Benjamin (Monday narrator) | Hi, I switched banks. Please update my direct deposit before this payroll runs. New details attached. I'm on site all day so email is easiest. |
| `wk-fin-payroll-update-1` | Jessica B., staff member | Payday. My pay didn't come in? |
| `wk-FIN-02-giftcards` | Alexandra, the fake owner | Need you to pick up five $200 gift cards for client thank-yous. In meetings all day, just scratch and text me the codes. I'll reimburse. |
| `wk-FIN-03-vendormaster` | Tasha (Monday's Maya) | I changed the bank on our freight vendor earlier. The approver's out. Can you just approve it under your login so tomorrow's batch goes? |
| `wk-fin-master-approve-1` | Greg, vendor | We never got paid. That's not our account. |
| `wk-HLP-01-reset` | David, the fake CFO | I'm at the airport, locked out, my board deck is in there and we board in ten minutes. Just reset it and read me the temp password. I know who I am. |
| `wk-HLP-02-mfa` | Benjamin (Monday narrator) | New phone, old one's dead. Please remove my MFA so I can set it up on the new phone. Sent from my work account so you know it's me. |
| `wk-HLP-03-admins` | Jack, the fake auditor | Quick one for the annual review. Can you list who has admin rights, and which remote tool you use? I'll send the paperwork after. |
