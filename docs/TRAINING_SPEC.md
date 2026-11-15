# Harbor & Co. — Training Design Spec (v1)

**Purpose:** turn Harbor & Co. from a game into a resellable security awareness training (SAT) product. MSPs need it to produce audit evidence for NIST, CIS, HIPAA and CMMC clients, and it has to change behavior, not just get clicked through.
**Audience:** the coding session that builds the game, plus Andrew (product owner).
**Status of regulations checked:** November 2026. Re-verify before any marketing claim.

---

## 0. The one rule for every claim we make

Frameworks don't "certify" training products. Our language is always **"maps to" / "supports"** a control, never "makes you compliant." Compliance comes from the client's whole program: our training records plus their policy, cadence and role assignments. Getting this wrong in sales copy is a liability for the MSP reselling us.

Specifically:
- **DoD Cyber Awareness Challenge (DISA).** Where a contract or command requires that exact course, we don't replace it. We position as "DoD-aligned awareness for the defense industrial base," not a substitute.
- **CUI training under DoDI 5200.48.** When a contract specifies this, it's separate. We can offer a CUI-handling module that supports it, but the contract language decides.

---

## 1. What each framework actually requires from training

| Framework | Requirement (training-relevant) | What our product must provide |
|---|---|---|
| **NIST SP 800-53 r5** | **AT-2** literacy training at onboarding, then at a set frequency and after system changes. **AT-2(1)** practical exercises. **AT-2(2)** insider threat (Low baseline and up). **AT-2(3)** social engineering and mining (Moderate and up). **AT-2(4)** suspicious communications and anomalous behavior. **AT-3** role-based training. **AT-4** training records. **AT-6** training feedback. | Simulation exercises, an insider-threat module, a social-engineering module, role tracks, exportable records. |
| **NIST SP 800-50 r1** (Sept 2024) | The lifecycle program guide behind the AT family. It folds privacy into cybersecurity learning and pushes **measuring impact**, not just completion. | Behavior metrics (reporting rate, time-to-report, repeat errors) alongside completion. |
| **NIST CSF 2.0** | **PR.AT-01** general awareness; **PR.AT-02** specialized roles. | Core shift plus role tracks. |
| **NIST SP 800-171 r2 / CMMC Level 2** | **AT.L2-3.2.1** risk awareness for managers, admins and users. **AT.L2-3.2.2** role-based training for security duties. **AT.L2-3.2.3** recognizing and **reporting** insider-threat indicators. Assessors look for **specific, separately evidenced** insider-threat content and **role-differentiated** assignment. | A dedicated insider-threat beat with its own completion record, role tracks with assignment records, and dated certificates. |
| **CMMC status** | Phase 1 (self-assessments in contracts) has been active since Nov 10, 2025. Phase 2 (C3PAO certification) was due Nov 10, 2026 but **DoD suspended it on July 13, 2026** pending review. Self-assessments still apply. | Sell as "be assessment-ready." Self-assessment evidence is needed today either way. |
| **CIS Controls v8.1, Control 14** | 14.1 program, run at hire and at least annually, content reviewed annually. 14.2 social engineering. 14.3 authentication. 14.4 data handling. 14.5 unintentional data exposure. 14.6 recognizing and reporting incidents. 14.7 reporting missing security updates. 14.8 insecure networks. 14.9 role-specific (IG2). | One scenario beat for **each** of 14.2–14.8 so the coverage matrix has no holes, plus 14.9 role tracks. |
| **HIPAA Security Rule** 45 CFR 164.308(a)(5) | A security awareness and training program for **all workforce, including management**. Implementation specs (currently *addressable*): (A) security reminders, (B) protection from malicious software, (C) log-in monitoring, (D) password management. Keep documentation **6 years**. | Recurring "security reminder" micro-episodes, plus malware, unusual-login and password content, plus 6-year record retention. |
| **HIPAA Privacy Rule** 164.530(b) | Train all workforce on PHI policies, new members within a reasonable time, and after material policy changes. | A PHI-handling track (clinic or healthcare variant), with a policy-change re-assignment trigger. |
| **HIPAA Security Rule update** | The NPRM (Jan 2025) would make training mandatory annually, add documented role-based training, and require training soon after access is granted. **Not final**; OMB now targets July 2027. | Build to it anyway: annual cadence, hire-date tracking, role tracks. When it lands, clients are already covered. |
| **DoD civilians and contractors** | The Cyber Awareness Challenge is annual for civilians and contractors (military moved to every 3 years). DoDM 8140.03 covers *cyber workforce qualification*, which is out of scope for SAT. | Don't claim 8140. Offer an advanced/APT track for CMMC L3-style practical exercises later. |
| **PCI DSS v4.x 12.6** (optional add-on) | Annual training that covers phishing and social engineering, plus acceptable use. Verify the current version's wording before claiming it. | Same core content; a later add-on for retail and payments clients. |

---

## 2. The evidence problem we're solving

The research is blunt. A UC San Diego Health randomized trial with 19,500+ employees over 8 months found:
- no correlation between how recently someone took annual training and whether they clicked phishing;
- embedded "you clicked" training cut failure by only about 1.7%;
- most people spent a minute or less on embedded training pages.

**Interactive training did modestly better.** That's our opening. The design rules that follow from it:

1. **Decision-first, not slides.** Every lesson is a choice under realistic pressure (the courier, the urgent boss, the "IT" caller). No content screens without a decision attached.
2. **Teachable moment at the consequence.** After a bad choice, play the consequence (door held, then 40 seconds later a laptop is missing), then a 20–30 second debrief: what the tell was, what the right move is, and who to report to. Never shame.
3. **Short and spaced.** Core shift ≤ 15 minutes. Then monthly 2–3 minute "night radio" micro-episodes (this doubles as the HIPAA security reminders requirement). Re-test weak skills at increasing intervals.
4. **Reward reporting, not just avoiding.** Score "reported it the right way" higher than "ignored it." Reporting rate and time-to-report are the headline metrics for 800-50 r1.
5. **Variants, not answer keys.** Randomize sender names, amounts, wording and which tell is present (wrong domain vs. urgency vs. callback number). The DoD Cyber Awareness Challenge had its answers leaked publicly in 2026. Ours should be impossible to look up.
6. **Use the client's real names.** The tenant sets the company name, the IT help desk number on the badge, the reporting channel and policy names. Learners practice the exact behavior their auditor will ask about.

---

## 3. Curriculum architecture: "The Workweek"

Monday stays the free-standing **Core Shift** (general awareness for all staff). Other days become modules a tenant assigns by role or framework. Same block, same characters, new situations.

### Monday: Core Shift (everyone; the annual requirement)
| # | Beat (existing) | Skill | Maps to |
|---|---|---|---|
| 1 | Courier tailgating at the tower door | Physical social engineering; don't hold the door; a badge is personal | CIS 14.2 · AT-2(3) · 800-171 3.2.1 |
| 2 | "Elena Voss" gift-card email, lookalike domain | Phishing/BEC tells; use **Report phishing**, don't reply | CIS 14.2, 14.6 · AT-2(3), AT-2(4) · HIPAA (A) reminders |
| 3 | "Harbor IT" asks for the 6-digit code | Vishing, MFA codes are never shared; callback using the badge number | CIS 14.3 · HIPAA (C)/(D) · AT-2(3) |
| 4 | "Salary review" USB at the break counter | Baiting, removable media, malware; bag it for IT | CIS 14.2 · HIPAA (B) malicious software · 800-171 3.2.1 |
| 5 | Maya's wire release, "Elena said so," form down | Payment fraud; verify using a number already on file, or refuse | CIS 14.2 · AT-2(3) |

**Add to Monday to close the coverage gaps** (each 60–90 seconds, slotted between existing beats):
| # | New beat | Skill | Maps to |
|---|---|---|---|
| 6 | Laptop shows "updates failed 23 days" and the AV icon is off | Notice and report missing updates; don't ignore it | **CIS 14.7** |
| 7 | Phone alert: "New sign-in from another state" on your account | Recognize unusual log-ins and report immediately | **HIPAA (C) log-in monitoring** · CIS 14.6 |
| 8 | Auto-complete sends the shipping manifest to the wrong "Mark" | Unintentional exposure: misdelivery, public share links, pasting data into public AI tools | **CIS 14.5** · 14.4 |
| 9 | Clean-desk end of shift: printouts, unlocked screen, sticky-note password | Data handling and disposal, screen lock, password manager | **CIS 14.4**, 14.3 · HIPAA (D) |
| 10 | End-of-shift **debrief and knowledge check** (8–10 randomized questions, 80% to pass, retry allowed) | Confirms learning; produces the dated certificate | AT-4 records · CMMC evidence |

### Tuesday: Insider Threat (required separately for CMMC AT.L2-3.2.3 and NIST AT-2(2))
A coworker on the quay shows **indicators**: copying drawings to a personal drive, asking for access outside their role, after-hours badge use, open resentment after a passed-over promotion. The lesson is **recognize and report through the right channel, don't investigate or confront**. Include an innocent-explanation variant so learners learn that reporting isn't accusing, and cover anti-retaliation. This needs its own completion record.

### Wednesday: Remote and Travel
Coffee-shop Wi-Fi at Quayside Coffee, a fake "Harbor_Guest" hotspot, home router defaults, a lost phone in the company sedan, shoulder-surfing on the ferry. Maps to **CIS 14.8**, 14.3 and 14.6.

### Thursday: Role tracks (assign by role; CIS 14.9 · AT-3 · CMMC 3.2.2 · CSF PR.AT-02)
| Track | Scenario seed |
|---|---|
| **Finance and AP** | Vendor bank-change request, deep-fake voice "CFO," invoice fraud |
| **HR** | W-2/payroll data request, fake applicant résumé with malware |
| **IT and help desk** | Caller resetting an exec's MFA; privileged account hygiene; verification scripts |
| **Executives** | Whaling, travel, being the target of impersonation, approving exceptions |
| **Shop floor / OT (manufacturer)** | USB into a CNC/HMI station, vendor "remote support" session, unknown device on the plant network, CUI drawings at the machine |
| **CUI handlers (defense)** | Marking, storage, sending CUI only through approved channels, spills |
| **Clinical / PHI (healthcare variant)** | Minimum necessary, curious-coworker record snooping, PHI in texts, faxing to the wrong number |

### Friday: Incident Night (practical exercise; AT-2(1); CMMC L3-style "practical exercises" later)
A ransomware note appears on a floor-14 screen. Learners must disconnect, not power off; report fast; preserve evidence; and not pay or negotiate. A team mode for managers covers who to call and in what order, using the tenant's own IR contacts.

### Monthly "Night Radio" (HIPAA security reminders, CIS 14.1 reinforcement)
Two-to-three-minute audio and visual micro-scenarios that rotate current threats (AI voice clones, QR-code phishing, MFA fatigue). Each counts toward ongoing-reminder evidence.

---

## 4. Compliance evidence engine (this is what MSPs pay for)

### Records (AT-4, HIPAA 6-year retention, CMMC assessor evidence)
For every learner and module, store:
`tenant_id, user_id, email, role(s), module_id, module_version, content_hash, assigned_at, reason (hire | annual | policy_change | remediation), started_at, completed_at, decisions[], score, passed, attempts, attestation_accepted_at, certificate_id`

- Keep records ≥ **6 years** (HIPAA). Make retention configurable per tenant.
- Records are append-only. Log every edit to an assignment.

### Assignment rules (CIS 14.1, AT-2(a), the proposed HIPAA cadence)
- **New hire:** assign Core Shift and the role track at user creation. Flag anyone not done within the tenant's window (default 30 days).
- **Annual:** re-assign on each anniversary or a tenant-chosen calendar date.
- **Policy change:** a tenant admin clicks "policy changed," which re-assigns the affected modules (HIPAA Privacy material change, AT-2 system changes).
- **Remediation:** repeated wrong choices on one skill trigger a short targeted episode.

### Reports (PDF and CSV, one click)
1. **Framework coverage matrix:** each control (from §1) → module(s) → % of workforce completed → date range.
2. **Learner transcript:** the dated certificate list for one person (what an assessor samples).
3. **Behavior trend:** reporting rate, time-to-report, and repeat-error rate by skill over time (800-50 r1 impact).
4. **Overdue list:** new hires and annual renewals.

### Delivery
- **Standalone multi-tenant portal** for MSPs: an MSP dashboard over client tenants, with users synced from **Microsoft Entra ID** and SSO.
- **LMS export:** **SCORM 1.2 / SCORM 2004** for older client learning systems, and **xAPI / cmi5** statements for modern ones. Emit one xAPI statement per decision (actor, verb `decided`/`reported`/`passed`, object = beat ID, result, context with control IDs).
- **Low-spec mode:** a 2D/“storyboard” fallback that uses the same scenario data for locked-down laptops and phones, plus captions and keyboard-only play (aim for WCAG 2.1 AA). Without this, many clients can't deploy it.
- **Spanish** early on (manufacturing workforce).

---

## 5. Build it as data, not code

Every beat lives in a JSON scenario file. Adding a new framework, role or variant should not need engine changes.

```json
{
  "id": "MON-03-vishing-mfa",
  "version": "1.2.0",
  "day": "monday",
  "location": "Desk_Player",
  "trigger": "DeskPhone_RingLight",
  "roles": ["all"],
  "controls": {
    "CIS_v8.1": ["14.3"],
    "NIST_800-53r5": ["AT-2(3)"],
    "NIST_800-171r2": ["3.2.1"],
    "CMMC_L2": ["AT.L2-3.2.1"],
    "HIPAA": ["164.308(a)(5)(ii)(C)", "164.308(a)(5)(ii)(D)"],
    "CSF_2.0": ["PR.AT-01"]
  },
  "variants": [
    {"caller": "Harbor IT", "pressure": "urgent_lockout", "tell": "asks_for_code"},
    {"caller": "Microsoft Support", "pressure": "security_alert", "tell": "unknown_callback_number"}
  ],
  "choices": [
    {"id": "read_code", "outcome": "account_takeover", "score": 0, "debrief": "debrief/MON-03-a"},
    {"id": "hang_up_ignore", "outcome": "safe_unreported", "score": 60, "debrief": "debrief/MON-03-b"},
    {"id": "hang_up_call_badge_number", "outcome": "safe_reported", "score": 100, "debrief": "debrief/MON-03-c"}
  ],
  "tenant_tokens": ["{{COMPANY}}", "{{HELPDESK_PHONE}}", "{{REPORT_CHANNEL}}"],
  "knowledge_check_pool": "kc/authentication"
}
```

---

## 6. Build order for the coding session

1. **Scenario engine:** load beats from JSON, branch on choices, play consequences, show debriefs. Move the 5 existing Monday beats into JSON first, with no behavior change.
2. **Scoring v2:** reported beats ignored beats; per-skill sub-scores; end-of-shift knowledge check (randomized pool, 80% pass).
3. **Records and xAPI:** emit statements and store the record fields from §4. Even a local JSON export proves the shape.
4. **Monday gap beats 6–9** (CIS 14.4, 14.5, 14.7, HIPAA log-in monitoring).
5. **Tuesday Insider Threat:** the CMMC must-have, with a separate completion record.
6. **Tenant config:** company name, help-desk number on the badge, report channel, policy names.
7. **Coverage matrix and certificate PDF.**
8. **SCORM/cmi5 export** and the low-spec 2D mode.
9. Role tracks and the remaining days.

---

## 7. Sources
- NIST SP 800-50 r1, *Building a Cybersecurity and Privacy Learning Program* (Sept 2024): https://csrc.nist.gov/pubs/sp/800/50/r1/final
- NIST SP 800-53 r5, AT family (via FedRAMP / OSA references): https://opensecurityarchitecture.org/controls/at-02
- CIS Controls v8.1, Control 14 safeguards: https://github.com/CISecurity/ControlsAssessmentSpecification/blob/master/control-14/index.rst
- CMMC Assessment Guide L2 v2.13 (AT.L2-3.2.1–3.2.3): https://dodcio.defense.gov/Portals/0/Documents/CMMC/AssessmentGuideL2.pdf
- CMMC Phase 2 suspension (July 13, 2026): https://www.govconinabox.com/cmmc/what-is-cmmc
- HIPAA 164.308(a)(5) and the NPRM status: https://coggno.com/blog/hipaa-security-rule-2025-nprm-update-training-requirements/ · https://www.fiercehealthcare.com/health-tech/feds-push-back-hipaa-security-rule-overhaul-july-2027
- HHS OCR, October 2026 Cybersecurity Newsletter: https://www.hhs.gov/hipaa/for-professionals/security/guidance/cybersecurity-newsletter-october-2026/index.html
- DoD Cyber Awareness Challenge 2026 and the cadence change: https://dl.dod.cyber.mil/wp-content/uploads/8140/pdf/(U)%202025-12-01_8140ReadinessBulletin.pdf · https://secureframe.com/hub/cui/dod-mandatory-cui-training
- UC San Diego Health phishing-training trial (IEEE S&P 2025): https://sysnet.ucsd.edu/~voelker/pubs/phishtrain-oakland25.pdf
