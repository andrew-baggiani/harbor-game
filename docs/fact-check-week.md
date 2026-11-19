# Fact check

Read from the open week pull request, not from the cloudflare branch. The week files are not on cloudflare yet.

Sources are defanged. No numbers I could not point at.

## The three questions

### ADM-01. Deny, reset the password, revoke sessions, raise an incident.

Partly.

Deny first is right. Approving is the compromise. Reset and revoke both belong. A new password does not replace an explicit revoke. Microsoft tells admins to revoke the user's sessions when access has to die, and to reset the password when the account may be in someone else's hands.

hxxps://learn.microsoft[.]com/en-us/entra/identity/users/users-revoke-access

What the button skips, and a lead will ask:

The incident starts when you deny, not after the cleanup. Otherwise the night shift "fixes it" and nobody else hears.

Look at the registered sign-in methods in the same pass. The attacker may already have added a phone. A new password does not remove that.

So the order is not wrong. It is incomplete. Suggested label: "Deny. Reset the password and revoke sessions from a trusted device. Check the sign-in methods. Raise the incident now."

The 40-point choice, deny and go back to work, is the right score. Denying is not the end.

### ADM-02. A time-limited scoped role, not Global Admin.

Fine.

The correct choice asks which permissions the setup needs, then grants only those, time-limited, with an approval on record. That is least privilege. An hour of Global Admin with a reminder to remove it is correctly scored at nothing. An hour is enough to add a door that survives the removal, and reminders get missed. The game already says that.

A product like a privileged-access timer is a fair way to build "time-limited and approved." The button does not need the product's name.

hxxps://learn.microsoft[.]com/en-us/entra/id-governance/privileged-identity-management/pim-configure

Least privilege itself is NIST 800-53 AC-6. You do not have to hang that id on a training beat. The training ids you used are enough.

### HLP-02. Live video with an ID, or the manager confirms.

Partly.

The bar has to be a live check, and the game is right that a chat from the user's own account is not that check. If the attacker is in the account, the chat is theirs.

Prefer, in this order: call back on the directory number, or have the manager confirm. A video of an ID card is a weaker extra. The wrong person can hold up a card, and the desk should not keep the image. Do not score it as equal to the callback.

NIST SP 800-63B treats possession of an authenticator as something you prove, not something a message claims. The chat is the claim.

hxxps://pages.nist[.]gov/800-63-3/sp800-63b.html

The 40-point choice, a temporary pass back into the same chat, is the right score.

## Controls

The role block on every track beat is AT-3, 3.2.2, AT.L2-3.2.2, CIS 14.9, and PR.AT-02. Fine. Those are the role-training requirements this shift is there to meet. They describe the lesson, not a switch in the server room.

CIS 14, from the v8.1 text, so the extras can be checked against it:

- 14.2 social engineering
- 14.3 authentication
- 14.5 unintentional exposure
- 14.6 reporting an incident
- 14.8 insecure networks
- 14.9 role-specific training

HIPAA 164.308(a)(5)(ii), the four that get mis-filed:

- (A) security reminders
- (B) protection from malicious software
- (C) log-in monitoring
- (D) password management

| Beat | Extra id | Verdict |
|---|---|---|
| ADM-01 | CIS 14.3, AT-2(4) | Fine. Authentication, and strange behavior. |
| ADM-01 | HIPAA (C) log-in monitoring | Change. This beat is not about reading logs. Drop it, or point it at a beat where someone actually checks a log. |
| ADM-02 | AT-2(3), CIS 14.2 | Fine. The vendor request is social engineering. |
| ADM-03 | CIS 14.3 | Fine enough. It is about how an admin sign-in is used. |
| ADM-03 | HIPAA (D) password management | Weak. Separate accounts are not a password procedure. Drop it. |
| ADM-04 | HIPAA (B), AT-2(4) | Fine. An unknown script is untrusted software, and a strange message. |
| FIN-01, FIN-02 | CIS 14.2, AT-2(3) | Fine. |
| FIN-03 | AT-2(2), 3.2.3, AT.L2-3.2.3 | Partial. Those are insider-threat training. One wrong path is a coworker asking you to bypass a limit. The main path is a vendor fraud the coworker believed. Add CIS 14.2. Do not let the insider ids be the only story. |
| HLP-01 | CIS 14.2, 14.3, HIPAA (D) | Fine. A reset procedure and a social script. |
| HLP-02 | CIS 14.3 | Fine. |
| HLP-02 | HIPAA (C) log-in monitoring | Change. Same problem as ADM-01. This is an identity check, not log review. |
| HLP-03 | CIS 14.2, AT-2(3) | Fine. |

Saturday, in weekend.ts, puts HIPAA (D) on all four beats. It fits the password beat only. The parcel text is 14.2, which is already there. The photo is closer to 14.5, which that beat already adds. The router is 14.8, which that beat already adds. Take (D) off the three that are not about passwords.

Tuesday through Friday drafts: the awareness ids match the beats. No id in those files is on the wrong subject the way (C) is here.

## Reminders

The monthly card mapped to HIPAA (A), CIS 14.2, and PR.AT-01 is fine. (A) is the security-reminder spec. That part is right.

Four lines a lead can challenge:

Month 2 says the tax-form request is the most common February scam. That ranking is not sourced. The pattern is real. The IRS and its partners warn on it every tax season. Drop "most common," or cite them.

hxxps://www.irs[.]gov/identity-theft-fraud-scams/irs-security-summit-partners-warn-of-w-2-scam

Month 4 says deny the prompt and change the password. Right direction. It does not say to report it, and "ignore it" is scored the same as approving. On the admin track, denying and stopping is 40, not 0. Align them. Ignoring is incomplete. Approving is the failure.

Month 7 says a vendor bank change is the costliest scam in business. No source, so cut "costliest." The instruction underneath is right: call the number already on file, not the one in the mail.

Month 8 marks "remove all details first" as a fully correct path. Wednesday does not. A complaint with the name removed can still describe one customer, and the tool can keep it. Make the approved tool the only full-credit answer.

Month 10 asks which habit "stops the most" takeovers. That is a ranking with no source. Ask instead which one stops a stolen password from being enough. No percentage needed.

Everything else in the twelve cards matches the week's own lessons. I did not find an invented incident.
