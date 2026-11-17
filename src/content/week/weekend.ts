import { beat, q } from "@/content/week/make";
import type { ShiftDef } from "@/content/week/types";

const PERSONAL = {
  "CIS_v8.1": ["14.2", "14.3"],
  "NIST_800-53r5": ["AT-2", "AT-2(3)"],
  "NIST_800-171r2": ["3.2.1"],
  CMMC_L2: ["AT.L2-3.2.1"],
  HIPAA: ["164.308(a)(5)(ii)(D)"],
  "CSF_2.0": ["PR.AT-01"],
};

/**
 * Saturday: home, off the clock. Attackers don't keep office hours, and personal accounts are
 * how they get into work ones. Short, four beats, one room.
 */
export const SATURDAY: ShiftDef = {
  id: "saturday",
  kind: "weekend",
  day: "Saturday",
  title: "Off the clock",
  topics: "Delivery texts · reused passwords · posting your badge · the home router",
  intro: "Saturday. No shift. Your phone doesn't know that.",
  beats: [
    beat({
      id: "SAT-01-delivery",
      day: "saturday",
      skill: "smishing",
      controls: PERSONAL,
      who: "Text message",
      role: "Unknown number",
      text: "Your parcel is held. Pay a $1.99 redelivery fee within 2 hours or it goes back. A short link follows. You are expecting a parcel.",
      set: "home",
      spot: "counter",
      prop: { kind: "phone", text: "Parcel held · pay $1.99 · tap link", textB: "Card details · enter number" },
      objective: "Your phone buzzed on the counter.",
      choices: [
        {
          id: "sat-delivery-pay",
          label: "Tap the link and pay the fee",
          score: 0,
          debrief: "Real couriers don't text a short link for a tiny fee. The fee is the bait; the card number is the catch.",
          report: "A card number went into a fake courier page.",
          fallout: [
            { at: 0, who: "Phone", text: "The page asks for the full card number. You give it.", flip: true },
            { at: 40, who: "Bank", text: "A $480 charge. Then another." },
          ],
        },
        {
          id: "sat-delivery-app",
          label: "Ignore the link. Check the order in the store's own app",
          score: 100,
          debrief: "The app shows the parcel arriving Monday. No fee. You delete the text and report it as junk.",
          report: "The delivery text was checked in the store's own app and reported as junk.",
        },
        {
          id: "sat-delivery-reply",
          label: "Reply STOP so they quit texting",
          score: 40,
          debrief: "You didn't pay, but replying told them a person reads this number. Report as junk, don't reply.",
          report: "The text was answered, which confirms the number is live.",
          fallout: [{ at: 50, who: "Phone", text: "Three more texts from three new numbers." }],
        },
      ],
    }),
    beat({
      id: "SAT-02-reuse",
      day: "saturday",
      skill: "authentication",
      controls: PERSONAL,
      who: "Email",
      role: "A streaming service",
      text: "Your account was in a data breach. Reset your password. It's the same password you use for work, plus a different number on the end.",
      set: "home",
      spot: "table",
      prop: { kind: "laptop", text: "Your password was exposed in a breach" },
      objective: "The laptop on the table has a breach notice open.",
      choices: [
        {
          id: "sat-reuse-bump",
          label: "Reset it to the same password with a new number",
          score: 0,
          debrief: "Attackers try the leaked password with every ending. That's the first thing they guess.",
          report: "A breached password was reused with a small change.",
          fallout: [{ at: 50, who: "Phone", text: "A work sign-in prompt you didn't start. From another state." }],
        },
        {
          id: "sat-reuse-manager",
          label: "New unique password from a password manager, change work too, turn on MFA",
          score: 100,
          debrief: "Unique per site, saved in a manager, MFA on. The leaked one is now worth nothing anywhere.",
          report: "Every account sharing the breached password got a new unique one, and MFA was turned on.",
        },
        {
          id: "sat-reuse-later",
          label: "Change only the streaming password",
          score: 40,
          debrief: "The streaming account is fine now. The work account still has the leaked password's twin.",
          report: "The breached site was fixed but the work password that shared it was not.",
          fallout: [{ at: 70, who: "Phone", text: "Monday morning: your work account is locked after failed sign-ins overnight." }],
        },
      ],
    }),
    beat({
      id: "SAT-03-post",
      day: "saturday",
      skill: "oversharing",
      controls: { ...PERSONAL, "CIS_v8.1": ["14.2", "14.5"] },
      who: "Your phone",
      role: "A photo you're about to post",
      text: "First week done. You took a photo at your desk. Your badge is on the lanyard in the shot, and the whiteboard behind you has the guest Wi-Fi password.",
      set: "home",
      spot: "couch",
      prop: { kind: "phone", text: "New post · First week done!", textB: "Posted · 212 views" },
      objective: "On the couch. You're about to post a photo.",
      choices: [
        {
          id: "sat-post-share",
          label: "Post it as is",
          score: 0,
          debrief: "A clear badge photo is enough to print a copy. The whiteboard did the rest.",
          report: "A photo with a readable badge and a network password was posted publicly.",
          fallout: [
            { at: 0, who: "Phone", text: "Posted.", flip: true },
            { at: 60, who: "Phone", text: "A stranger comments: nice badge design. Saved it." },
          ],
        },
        {
          id: "sat-post-crop",
          label: "Crop out the badge and the whiteboard, then post",
          score: 100,
          debrief: "Celebrate the week, keep the badge and the board out of frame. Easy habit.",
          report: "The badge and whiteboard were cropped out before posting.",
        },
        {
          id: "sat-post-friends",
          label: "Post it, but friends only",
          score: 40,
          debrief: "Friends-only still gets screenshotted and shared. What's in the frame is the problem.",
          report: "A photo with the badge in it went to a limited audience.",
          fallout: [{ at: 70, who: "Phone", text: "A friend of a friend reshared it. Now it's public." }],
        },
      ],
    }),
    beat({
      id: "SAT-04-router",
      day: "saturday",
      skill: "home-network",
      controls: { ...PERSONAL, "CIS_v8.1": ["14.8"] },
      who: "Router sticker",
      role: "The box by the TV",
      text: "You work from home some days. The router still has the admin password from the sticker on the bottom, and its app says an update is waiting.",
      set: "home",
      spot: "shelf",
      prop: { kind: "paper", text: "admin / admin1234", textB: "Firmware 2019" },
      objective: "The router by the TV is blinking.",
      choices: [
        {
          id: "sat-router-leave",
          label: "It works, leave it",
          score: 0,
          debrief: "Default passwords are published per model. An old router is a door into the laptop you work on.",
          report: "The home router kept its default password and old firmware.",
          fallout: [{ at: 60, who: "Router app", text: "A device you don't own joined your network." }],
        },
        {
          id: "sat-router-fix",
          label: "Install the update, change the admin password, check the Wi-Fi uses WPA2 or better",
          score: 100,
          debrief: "Ten minutes. Updated, new admin password, strong Wi-Fi. Work traffic now crosses a network you control.",
          report: "The home router was updated and its default password changed.",
        },
        {
          id: "sat-router-wifi",
          label: "Change only the Wi-Fi password",
          score: 40,
          debrief: "Better Wi-Fi, but the admin login and old firmware are still open doors.",
          report: "The Wi-Fi password changed but the router admin password and firmware did not.",
        },
      ],
    }),
  ],
  check: [
    q("kc-sat-1", "smishing", "A text says a parcel is held and asks for a small fee by link. What's the safe move?", "Check the order in the store's own app or site.", "Pay quickly, it's only a small fee.", "Reply to ask which parcel."),
    q("kc-sat-2", "authentication", "A site you use was breached. Your work password is similar. What do you change?", "Every account that shares or resembles it, with unique passwords and MFA.", "Only the breached site.", "Nothing, if the site already reset it."),
    q("kc-sat-3", "oversharing", "What makes a desk photo risky to post?", "A readable badge, screens, or passwords in the frame.", "Posting it on a weekday.", "Posting it without a filter."),
    q("kc-sat-4", "home-network", "You work from home. Which matters most on your router?", "Updated firmware and a changed admin password.", "A short, easy Wi-Fi name.", "Restarting it once a year."),
    q("kc-sat-5", "smishing", "Why reply STOP to a scam text is a bad idea:", "It confirms a real person reads the number.", "It costs money per reply.", "It deletes your messages."),
  ],
};

/** Sunday: a ninety-second sort of real-looking messages across the whole week. No 3D, no fallout. */
export type SortItem = { id: string; from: string; subject: string; body: string; risky: boolean; why: string };

export const SUNDAY_SORT: SortItem[] = [
  { id: "s1", from: "IT Service Desk <it-help@harbor-co-support.com>", subject: "Mailbox full: verify now", body: "Your mailbox will be closed in 2 hours. Sign in to keep it.", risky: true, why: "Lookalike domain and a deadline. The real desk is harborandco.com." },
  { id: "s2", from: "Payroll <payroll@harborandco.com>", subject: "Pay stubs posted", body: "This week's stubs are in the HR portal as usual. No action needed.", risky: false, why: "Right domain, no link, no ask." },
  { id: "s3", from: "CEO (personal)", subject: "Quick favor", body: "In a meeting. Can you grab four gift cards and text me the codes?", risky: true, why: "Gift cards plus can't-talk is the classic. Verify on a known number." },
  { id: "s4", from: "Vendor billing", subject: "Updated remittance details", body: "We changed banks. Please use the attached account for all future invoices.", risky: true, why: "Bank changes get verified on the number already on file." },
  { id: "s5", from: "Facilities <facilities@harborandco.com>", subject: "Elevator B maintenance Saturday", body: "Elevator B is down 8am to noon. Use A.", risky: false, why: "Internal, informational, nothing to click or send." },
  { id: "s6", from: "Shared with you", subject: "Q4 bonus list.xlsx", body: "Someone shared a file. Sign in with your work account to view.", risky: true, why: "Unexpected share with bait title asking for a sign-in." },
  { id: "s7", from: "+1 (555) 014-2290", subject: "Text", body: "Your code is 449201. Don't share it with anyone.", risky: true, why: "A code you didn't ask for means someone is trying your account. Report it." },
  { id: "s8", from: "Team calendar", subject: "Friday standup moved to 9:30", body: "Same room. Same link.", risky: false, why: "Routine internal update." },
  { id: "s9", from: "Delivery service", subject: "Text", body: "Parcel held. Pay $1.99 redelivery: short link", risky: true, why: "Tiny fee, short link, urgency." },
  { id: "s10", from: "Security <security@harborandco.com>", subject: "Thanks for reporting", body: "We got your report about the badge on the bench. It's been disabled.", risky: false, why: "A reply to something you did. Real channel." },
  { id: "s11", from: "Microsoft 365", subject: "Unusual sign-in activity", body: "Review recent activity: link to m1crosoft-secure-login.net", risky: true, why: "The link domain is not Microsoft's." },
  { id: "s12", from: "Coworker", subject: "Can you approve this MFA prompt?", body: "I'm locked out, just hit approve when it pops up on your phone.", risky: true, why: "Never approve a prompt for someone else." },
  { id: "s13", from: "HR <hr@harborandco.com>", subject: "Benefits window opens Monday", body: "Enrollment opens in the HR portal Monday. Bookmark it, don't click mail links.", risky: false, why: "Internal, and tells you to use the bookmark." },
  { id: "s14", from: "AI writing assistant", subject: "Pro trial", body: "Paste any document and we'll polish it free. Works with customer files!", risky: true, why: "Customer data doesn't go into personal AI tools." },
  { id: "s15", from: "Help desk <helpdesk@harborandco.com>", subject: "Your ticket #4471 is resolved", body: "The printer on 14 is fixed. Reply if it's not.", risky: false, why: "Matches a ticket you opened, real domain." },
  { id: "s16", from: "Finance lead", subject: "Voicemail transcript", body: "Release the wire before 5. Don't call back, I'm boarding.", risky: true, why: "Don't-call-back is the tell. Call the number you have." },
];
