import tueInvoice from "@/content/drafts/tue-01-invoice.json";
import tueAccess from "@/content/drafts/tue-02-contractor-access.json";
import tueShadow from "@/content/drafts/tue-03-shadow-it.json";
import tueBadge from "@/content/drafts/tue-04-lost-badge.json";
import wedLink from "@/content/drafts/wed-01-share-link.json";
import wedClass from "@/content/drafts/wed-02-classification.json";
import wedAi from "@/content/drafts/wed-03-ai-paste.json";
import thuWifi from "@/content/drafts/thu-01-wifi.json";
import thuLaptop from "@/content/drafts/thu-02-lost-laptop.json";
import thuVoice from "@/content/drafts/thu-03-deepfake.json";
import thuHome from "@/content/drafts/thu-04-home.json";
import friInsider from "@/content/drafts/fri-01-insider.json";
import friReport from "@/content/drafts/fri-02-reporting.json";
import friHour from "@/content/drafts/fri-03-first-hour.json";
import kcTue from "@/content/drafts/kc-tuesday.json";
import kcWed from "@/content/drafts/kc-wednesday.json";
import kcThu from "@/content/drafts/kc-thursday.json";
import kcFri from "@/content/drafts/kc-friday.json";
import kcTue2 from "@/content/week/kc/kc-tuesday.json";
import kcWed2 from "@/content/week/kc/kc-wednesday.json";
import kcThu2 from "@/content/week/kc/kc-thursday.json";
import kcFri2 from "@/content/week/kc/kc-friday.json";
import type { CheckItem } from "@/game/scenarios";
import type { ShiftDef, WeekScenario } from "@/content/week/types";

const T = "tue-fri/";
/** Drafts were written as 1.0.0-draft. Wired into the game they ship as 1.0.0. */
const live = (raw: unknown): WeekScenario => ({ ...(raw as WeekScenario), version: "1.0.0" });

export const TUESDAY: ShiftDef = {
  id: "tuesday",
  kind: "day",
  day: "Tuesday",
  title: "The vendor",
  topics: "Invoice and payment fraud · third-party access · shadow IT · contractor badges",
  intro: "Floor fourteen again. Tonight it's people outside the company asking for a little help.",
  beats: [
    {
      scenario: live(tueInvoice),
      set: "floor",
      spot: "desk",
      cast: "desk-coworker",
      prop: { kind: "screen", a: T + "tue-invoice-email-a.webp", b: T + "tue-invoice-email-b.webp" },
      objective: "Accounts is waiting at your desk with an invoice.",
      timeline: {
        "tue-invoice-pay": [
          { at: 0, who: "Screen", text: "The sender address is one letter off.", flip: true },
          { at: 20, who: "Accounts", text: "The payment left." },
          { at: 50, who: "Next desk", text: "The real vendor is on the phone. Their invoice is unpaid." },
          { at: 75, who: "Accounts", text: "That money isn't coming back tonight." },
        ],
        "tue-invoice-wait": [{ at: 45, who: "Accounts", text: "Someone else just got the same email. They paid it." }],
      },
    },
    {
      scenario: live(tueAccess),
      set: "floor",
      spot: "aisle",
      cast: "contractor",
      prop: { kind: "badge", a: T + "tue-contractor-badge-a.webp" },
      objective: "A contractor in the aisle is waving you over.",
      timeline: {
        "tue-access-share": [
          { at: 0, who: "Laptop", text: "The laptop wakes up under your name." },
          { at: 25, who: "Contractor", text: "Just a minute. I'll be quick." },
          { at: 55, who: "Laptop", text: "A folder you never opened finishes uploading." },
          { at: 80, who: "Laptop", text: "The session is still yours. He's still in it." },
        ],
        "tue-access-watch": [
          { at: 40, who: "Contractor", text: "He reads the folder path back to you. Correctly." },
          { at: 70, who: "Other desk", text: "He asked me for that same path." },
        ],
      },
    },
    {
      scenario: live(tueShadow),
      set: "floor",
      spot: "desk",
      cast: "desk-coworker",
      prop: { kind: "screen", a: T + "tue-transfer-site-a.webp", b: T + "tue-transfer-site-b.webp" },
      objective: "Back at your desk. Your coworker has a free transfer site open.",
      timeline: {
        "tue-shadow-send": [
          { at: 0, who: "Screen", text: "The link has no names on it.", flip: true },
          { at: 30, who: "Coworker", text: "It went." },
          { at: 70, who: "Mail", text: "Your link was opened from outside the company." },
        ],
        "tue-shadow-zip": [
          { at: 0, who: "Screen", text: "Zipped, password in the same email.", flip: true },
          { at: 60, who: "Mail", text: "The zip was opened. Both parts were in one message." },
        ],
      },
    },
    {
      scenario: live(tueBadge),
      set: "lobby",
      spot: "bench",
      cast: "night-desk",
      prop: { kind: "badge", a: T + "tue-contractor-badge-a.webp", b: T + "tue-contractor-badge-b.webp" },
      objective: "Lobby. There's a badge on the sofa by the windows.",
      timeline: {
        "tue-badge-use": [
          { at: 0, who: "Gate", text: "The gate opens.", flip: true },
          { at: 40, who: "Security", text: "The guard looks at the log. Then at you." },
          { at: 75, who: "Security", text: "That badge was reported lost an hour ago. The log shows a use after that." },
        ],
        "tue-badge-leave": [
          { at: 60, who: "Lobby", text: "Through the glass: a visitor bends down at the bench." },
          { at: 85, who: "Gate", text: "The gate opens for someone who didn't badge themselves." },
        ],
      },
    },
  ],
  check: [...kcTue, ...kcTue2] as CheckItem[],
};

export const WEDNESDAY: ShiftDef = {
  id: "wednesday",
  kind: "day",
  day: "Wednesday",
  title: "The data",
  topics: "Customer and patient data · classification · sharing links · AI tools and confidential data",
  intro: "No new floor tonight. Everything happens at your desk, which is the point.",
  beats: [
    {
      scenario: live(wedLink),
      set: "floor",
      spot: "desk",
      cast: "desk-coworker",
      prop: { kind: "screen", a: T + "wed-share-dialog-a.webp", b: T + "wed-share-dialog-b.webp" },
      objective: "The client wants the drawings tonight. Your desk.",
      timeline: {
        "wed-link-anyone": [
          { at: 0, who: "Screen", text: "Anyone with the link.", flip: true },
          { at: 30, who: "Coworker", text: "Client has it." },
          { at: 65, who: "Mail", text: "The file was downloaded by an address that isn't on the job." },
        ],
        "wed-link-personal": [
          { at: 0, who: "Screen", text: "Sent to a personal address.", flip: true },
          { at: 65, who: "Mail", text: "A forward from that address went to people you don't know." },
        ],
      },
    },
    {
      scenario: live(wedClass),
      set: "floor",
      spot: "paper",
      cast: "desk-coworker",
      prop: { kind: "paper", a: "week/wed-sheet-a.webp", b: "week/wed-sheet-b.webp", text: "INTERNAL · Customer list" },
      objective: "Same desk. A slide needs the customer list, apparently.",
      timeline: {
        "wed-class-all": [
          { at: 20, who: "Slide", text: "The slide is rows of names.", flip: true },
          { at: 50, who: "Mail", text: "The deck went to a partner thread you never opened." },
          { at: 80, who: "Coworker", text: "They just read one name back. They shouldn't have it." },
        ],
        "wed-class-count": [
          { at: 40, who: "Slide", text: "The count is on the slide." },
          { at: 75, who: "Hallway", text: "Someone who wasn't in the meeting quotes the number." },
        ],
      },
    },
    {
      scenario: live(wedAi),
      set: "floor",
      spot: "desk",
      prop: { kind: "screen", a: T + "wed-ai-writer-a.webp", b: T + "wed-ai-writer-b.webp" },
      objective: "A complaint to answer. A writing tool is open in a tab.",
      timeline: {
        "wed-ai-paste": [
          { at: 0, who: "Screen", text: "The complaint is in the box. Account number and all.", flip: true },
          { at: 35, who: "Tool", text: "Here's a cleaner version. The account number is still in it." },
          { at: 70, who: "Tool", text: "You closed the tab. It's still in the tool's history." },
        ],
        "wed-ai-strip": [
          { at: 0, who: "Screen", text: "Name gone. The rest is in a personal account.", flip: true },
          { at: 60, who: "Tool", text: "The paragraph still describes one customer exactly." },
        ],
      },
    },
  ],
  check: [...kcWed, ...kcWed2] as CheckItem[],
};

export const THURSDAY: ShiftDef = {
  id: "thursday",
  kind: "day",
  day: "Thursday",
  title: "On the road",
  topics: "Public Wi-Fi · lost device · travel · deepfake voice and video · working from home",
  intro: "No tower tonight. A cafe, then home. The work came with you.",
  beats: [
    {
      scenario: live(thuWifi),
      set: "cafe",
      spot: "table",
      prop: { kind: "phone", a: T + "thu-wifi-list-a.webp", b: T + "thu-wifi-list-b.webp" },
      objective: "Find a table. Mail is waiting.",
      timeline: {
        "thu-wifi-join": [
          { at: 0, who: "Phone", text: "Joined Harbor_Guest. Mail starts loading.", flip: true },
          { at: 30, who: "Phone", text: "The company mail page looks completely normal." },
          { at: 70, who: "Phone", text: "You left the cafe. That mailbox is still signed in somewhere else." },
        ],
        "thu-wifi-once": [
          { at: 0, who: "Phone", text: "Just one reply on the open twin.", flip: true },
          { at: 70, who: "Phone", text: "One reply was enough. The sign-in was copied." },
        ],
      },
    },
    {
      scenario: live(thuLaptop),
      set: "cafe",
      spot: "chair",
      prop: { kind: "phone", a: T + "thu-find-device-a.webp", b: T + "thu-find-device-b.webp" },
      objective: "Your bag was on that chair.",
      timeline: {
        "thu-laptop-wait": [
          { at: 0, who: "Phone", text: "Offline. Last seen here. Not reported.", flip: true },
          { at: 40, who: "Phone", text: "Still nothing." },
          { at: 75, who: "Phone", text: "It checked in once from a network that isn't this cafe. Nobody was told." },
        ],
        "thu-laptop-lock": [
          { at: 0, who: "Phone", text: "Lock requested.", flip: true },
          { at: 40, who: "Phone", text: "The lock spinner fails. It's offline." },
          { at: 75, who: "Phone", text: "Your sign-ins on it are still live. Nobody killed them." },
        ],
      },
    },
    {
      scenario: live(thuVoice),
      set: "cafe",
      spot: "table",
      voiceOnly: true,
      cast: "caller",
      prop: { kind: "phone", a: T + "thu-incoming-call-a.webp", b: T + "thu-incoming-call-b.webp" },
      objective: "Your phone is ringing. It says Finance lead.",
      timeline: {
        "thu-voice-send": [
          { at: 0, who: "Phone", text: "Still on the call.", flip: true },
          { at: 25, who: "Voice", text: "Perfect. Thank you." },
          { at: 55, who: "Mail", text: "Payment sent." },
          { at: 85, who: "Finance lead", text: "On the known number: I've been in the meeting the whole time." },
        ],
        "thu-voice-text": [
          { at: 0, who: "Phone", text: "You texted the same number.", flip: true },
          { at: 25, who: "Text", text: "Yes it's me. Please hurry." },
          { at: 85, who: "Finance lead", text: "On the known number: that wasn't me." },
        ],
      },
    },
    {
      scenario: live(thuHome),
      set: "home",
      spot: "table",
      cast: "at-home",
      prop: { kind: "laptop", a: "week/thu-home-laptop-a.webp", b: "week/thu-home-laptop-b.webp", text: "Unlocked · Harbor" },
      objective: "Home. The work laptop is open on the kitchen table.",
      timeline: {
        "thu-home-let": [
          { at: 20, who: "Laptop", text: "A work folder. Then a personal upload.", flip: true },
          { at: 50, who: "Laptop", text: "A stick goes in the side while you get the parcel." },
          { at: 80, who: "Laptop", text: "History shows a file leaving to somewhere that isn't the company share." },
        ],
        "thu-home-watch": [{ at: 50, who: "Laptop", text: "You looked away for one minute. The browser history has two new sites." }],
      },
    },
  ],
  check: [...kcThu, ...kcThu2] as CheckItem[],
};

export const FRIDAY: ShiftDef = {
  id: "friday",
  kind: "day",
  day: "Friday",
  title: "The incident",
  topics: "Insider risk · spotting and reporting an incident · the first hour · what not to delete",
  intro: "Last night of the week. Something is already wrong when you get in.",
  beats: [
    {
      scenario: live(friInsider),
      set: "floor",
      spot: "aisle",
      cast: "last-day",
      prop: { kind: "laptop", a: "week/fri-aisle-laptop-a.webp", b: "week/fri-aisle-laptop-b.webp", text: "Copying files" },
      objective: "Someone in the aisle is closing a laptop fast.",
      timeline: {
        "fri-insider-ignore": [
          { at: 0, who: "Aisle", text: "The lid is shut.", flip: true },
          { at: 70, who: "Aisle", text: "The drive is in their bag. The share shows the copy finished." },
        ],
        "fri-insider-ask": [
          { at: 30, who: "Coworker", text: "I stopped. Promise." },
          { at: 70, who: "Aisle", text: "The drive is in their bag. The share shows the copy finished." },
        ],
      },
    },
    {
      scenario: live(friReport),
      set: "floor",
      spot: "desk",
      prop: { kind: "screen", a: T + "fri-report-form-a.webp", b: T + "fri-report-form-b.webp" },
      objective: "Your desk. A thread with account numbers landed in your inbox.",
      timeline: {
        "fri-report-delete": [
          { at: 0, who: "Screen", text: "Delete is the bright button.", flip: true },
          { at: 20, who: "Mail", text: "Gone from your inbox." },
          { at: 60, who: "Mail", text: "The outside address is still on the thread. Nothing was pulled back." },
          { at: 85, who: "Queue", text: "Nobody else has it in the queue." },
        ],
        "fri-report-forward": [
          { at: 40, who: "Mail", text: "Your forward sits unread." },
          { at: 80, who: "Mail", text: "Out of office until Monday." },
        ],
      },
    },
    {
      scenario: live(friHour),
      set: "floor",
      spot: "desk",
      prop: { kind: "screen", a: T + "fri-lock-note-a.webp", b: T + "fri-lock-note-b.webp", reveal: true },
      objective: "Open the file share. Something is off.",
      timeline: {
        "fri-hour-pay": [
          { at: 0, who: "Screen", text: "The department card is charged. The note doesn't change.", flip: true },
          { at: 40, who: "Screen", text: "The timer resets. Higher." },
          { at: 80, who: "Screen", text: "Still locked. The note says thank you." },
        ],
        "fri-hour-wipe": [
          { at: 0, who: "Screen", text: "Black.", flip: true },
          { at: 30, who: "Screen", text: "It comes back empty." },
          { at: 70, who: "Incident desk", text: "Other machines are still locked. Yours has nothing left to show how it started." },
        ],
      },
    },
  ],
  check: [...kcFri, ...kcFri2] as CheckItem[],
};
