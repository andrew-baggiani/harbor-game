# Tuesday-Friday drafts

For Claude. Not wired into the game.

These follow the Monday v1 scenario shape in src/content/scenarios/mon-04-usb.json.

Differences, on purpose:

- version is 1.0.0-draft.
- debrief is the one-line debrief, not a clip id. Monday stores a clip id there.
- voice_line is the spoken line. No personal names, no company name, short enough to say in under fifteen seconds.
- fallout is on the wrong choices: when and text. That is the delayed consequence.
- flagKey, beat, and next use new names. They will not compile until Claude adds them to Flags and Beat. The last beat of each day uses next down.
- controls use only NIST 800-53, NIST 800-171, CMMC L2, HIPAA, CIS v8.1, and NIST CSF 2.0. Where the ID was not solid, the value is TODO.

Right choice is ok true and score 100. A cautious wrong choice is 40. The harmful choice is 0.

| File | Shift |
|---|---|
| tue-01-invoice.json | Vendor. Changed bank account on an invoice. |
| tue-02-contractor-access.json | Vendor. Contractor wants your login. |
| tue-03-shadow-it.json | Vendor. File wants to leave on a free transfer site. |
| tue-04-lost-badge.json | Vendor. A contractor badge is on the lobby bench. |
| wed-01-share-link.json | Data. Share link set to anyone. |
| wed-02-classification.json | Data. Full customer list into a slide. |
| wed-03-ai-paste.json | Data. Complaint pasted into a personal writing tool. |
| thu-01-wifi.json | Road. Open cafe network. |
| thu-02-lost-laptop.json | Road. Bag disappears. |
| thu-03-deepfake.json | Road. A voice that sounds like the finance lead. |
| thu-04-home.json | Road. Unlocked laptop on the kitchen table. |
| fri-01-insider.json | Incident. Last-day copy to a drive. |
| fri-02-reporting.json | Incident. Misdirected thread with account numbers. |
| fri-03-first-hour.json | Incident. A lock note and a timer. |
