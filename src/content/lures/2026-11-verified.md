# Lure pack, checked

Window: 18 Sep 2026 through 17 Nov 2026. Items 1 and 2 were already checked by Claude. Items 3 through 10 were checked against the pages below on 17 Nov 2026.

Nothing was dropped. Three samples had been written past what the source actually said. Those samples are rewritten here, and the item is marked VERIFIED only after the rewrite. The pack is 10 of 10.

Domains in the samples are fictional. Source links are defanged. No wallet, no portal address, no payload.

## 1. Mail held during an outage

VERIFIED, previously. Microsoft Security Blog, 16 Nov 2026. Activity 13 Nov 2026. Subject pattern "Outage" plus a token. Display names like a short prefix plus "Service Health." Body: messages held in the outage will be deleted in 24 hours unless the reader restores them.

hxxps://www.microsoft[.]com/en-us/security/blog/2026/11/16/high-volume-phishing-campaign-uses-microsoft-365-outage-lures-target-multiple-industry-sectors-2/

In the game: `MON-02-phishing-v3.json`. No vendor name on the glass.

## 2. Payroll list that is not a list

VERIFIED, previously. Same Microsoft quarterly post, activity 21 Sep 2026, published 5 Nov 2026. A payroll-date subject, the reader addressed by name, a disguised archive.

## 3. Purchase order, please confirm

VERIFIED. Same post. On 21 Sep 2026 the purchase-order version used a reply-style subject, a short hello, and an attachment that looked like an order and was a disguised archive. The reported samples were in Spanish. The English sample is a reskin, not a quote.

Tell that matches the source: the file is not the document it pretends to be. Confirm with the buyer you already know, not by opening it.

Beat: TUE-01.

Sample:

> Subject: Re: the quote
> From: Sales <sales@cinderwharff.example>
> Morning. The order is attached. Please confirm you received it today.

## 4. Change where the pay goes

VERIFIED. Same post. In the subset of attacks that asked for money, payroll update requests were the most common lure: 6 percent in July and August, 7 percent in September. About 126,000 to 130,000 a month. That figure is theirs, from the 5 Nov 2026 post. Do not repeat it without the link.

hxxps://www.microsoft[.]com/en-us/security/blog/2026/11/05/email-threat-landscape-q3-2026-trends-and-insights/

Tell: pay details do not move because a mail said so. Payroll already has a form.

Beat: MON-05. In the game: `MON-05-wire-v3.json`.

Sample:

> Can you switch my pay to the new account before Friday's run? I'm locked out of the form. Don't call. I'm on the floor.

## 5. A trusted name asks you to start the payment

VERIFIED. Same post. Microsoft's definition, quoted in substance: a text-based attack on people at work that impersonates a trusted party so the reader will start a payment or send documents.

Tell: the name is cheap. The payment still needs the number the company already has.

Beat: MON-05 or TUE-01.

Sample:

> Need the Calder payment out before the bank closes. The form is down. You can release it. Don't loop anyone in.

## 6. Sign this, review this invoice, take this survey

VERIFIED, sample corrected.

The post says requests to sign a document, review an invoice, or answer a survey are ordinary, and attackers spoof the sender domain of the real service. Not only a lookalike. They claim the service's own domain.

The earlier tell ("hover, it might be a lookalike") was weaker than the source. Replaced.

Tell: the mail can wear the service's real domain. Open the ledger you already use and see if the same invoice is there. Do not start from the button.

Beat: MON-02. In the game, combined with item 7: `MON-02-phishing-v4.json`.

Sample:

> From: Billing <billing@keel-ledger.example>
> The September invoice is waiting. Review it in the next hour or the shipment holds.

## 7. A puzzle, then the login

VERIFIED. Same post. CAPTCHA-gated phishing started to recover in the quarter while QR lures fell. By September the post reports 3.1 million such attacks, nearly twice July's low, still under the March peak. Their number. Cite the post if you repeat it.

Tell: a human-check in a mail is the front door of the phish. The company login is a bookmark.

Beat: MON-02. Same file as item 6.

Sample:

> Confirm you are human, then sign in. The invoice will not wait.

## 8. A call in the work chat

VERIFIED, sample corrected.

Same post. About 141,000 malicious call attempts in that work chat during the quarter. Their number. Peak in July, down 31 percent by September, September still 38 percent above the first-half monthly average. Calls sat in weekday hours, when a live answer was more likely. The post says the attempts included unanswered, rejected, and short calls, and should not be read as successful compromises.

What they did: live chat, voice, screen sharing, and remote-support tools, aimed at remote access and credential theft. Display names moved from an obvious help-desk title (17 percent of the July sample, 2 percent in September) toward an ordinary personal name (46 percent to 88 percent). A personal name can still claim to be the help desk. The address underneath may still look like a service account.

The earlier sample had them demand a six-digit code and announce themselves as the service desk. The post does not say they asked for a code. That line is gone.

Tell: a personal name, on a weekday, who needs on your machine. The visible name is the weak part. Hang up. Use the number posted in the office.

Beat: MON-03 for the live call. Not the six-digit script. That one is a different, older beat.

Sample:

> It's me. I need to see your screen for a minute. Accept the support prompt. I'm between meetings.

## 9. A stolen login, then a lock note

VERIFIED, sample corrected.

CISA, 20 Oct 2026, #StopRansomware: SafePay. Initial access includes phishing and the use of phished account profiles to get onto the network through VPN. A note is left on the desktop or in a root directory. It says the system is locked and tells the reader to reach them on a chat portal, using a victim id as the login.

hxxps://www.cisa[.]gov/news-events/cybersecurity-advisories/aa26-293a

The earlier sample invented a wallet and a line about paying. The advisory's note is a chat portal and a victim id. No wallet in this version. No portal address. No provider name.

Tell: the note wants you in their chat. That is not the incident process. Unplug. Call the number the company posted. Do not pay. Do not wipe.

Beat: MON-07 for the login. FRI-03 for the note.

Sample, the note only:

> Your system is locked.
> Come to the chat. Your id is on this page.
> Do not pay it. Unplug, and call the incident number.

## 10. A text, and a voice, that look legitimate

VERIFIED. The primary page is CISA, 16 Oct 2026, not the trade-press link used last time. CISA and the FBI warned election and campaign staff. Actors may phish and smish to steal logins or to get someone to open a link or an attachment. The campaigns closely resemble real messages, and may include email, text, audio, and video.

hxxps://www.cisa[.]gov/resources-tools/resources/cyber-threat-actors-use-variety-techniques-target-election-and-campaign-officials

The finance text below is a reskin for the game. It is not what the PSA said to election staff. The move is the same: a message and a voice that agree with each other, and a request not to use the known number.

Beat: THU-03. MON-02 if it arrives as mail.

Sample:

> This is finance. Confirm a payment by voice in the next ten minutes. Join from this text. Don't use the office line. We are not at our desks.

## What changed since the last file

Items 6, 8, and 9 had samples that went past the source. The samples above replace them. No item was removed, so no eleventh lure was added.

## Game files in this zip

| File | Pattern | Base controls |
|---|---|---|
| scenarios/MON-02-phishing-v3.json | Held messages after an outage | same as mon-02-phishing.json |
| scenarios/MON-02-phishing-v4.json | Invoice review, human-check, then a sign-in | same as mon-02-phishing.json |
| scenarios/MON-05-wire-v3.json | Pay account changed in mail | same as mon-05-wire.json |
