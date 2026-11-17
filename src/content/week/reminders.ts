import type { WeekScenario } from "@/content/week/types";

/**
 * Monthly security reminders: one short card and one question a month.
 * Maps to HIPAA 164.308(a)(5)(ii)(A) (security reminders) and keeps the habit warm between shifts.
 */
export type Reminder = {
  month: number;
  title: string;
  lines: string[];
  question: string;
  right: string;
  wrong: [string, string];
  why: string;
};

export const REMINDERS: Reminder[] = [
  { month: 1, title: "New year, same passwords?", lines: ["Breaches from last year are still being tried this year.", "If any password is shared between two sites, change one of them today.", "A password manager makes unique passwords effortless."], question: "Two sites share a password. One is breached. What's at risk?", right: "Both accounts.", wrong: ["Only the breached one.", "Neither, if MFA is on one."], why: "Attackers replay leaked passwords everywhere." },
  { month: 2, title: "Tax season scams start now", lines: ["Fake W-2 and payroll requests show up every tax season.", "Nobody legitimate asks for employee tax forms by email.", "Route any such request to your manager by phone."], question: "An exec emails asking for all W-2s as a PDF.", right: "Verify by phone before sending anything.", wrong: ["Send it, they're an exec.", "Send it password-protected."], why: "The IRS warns about this one every tax season." },
  { month: 3, title: "Report the weird stuff", lines: ["Most incidents are caught by someone saying 'that's odd'.", "Reporting a false alarm costs nothing.", "Use the report button or the security channel, every time."], question: "You clicked a link and something felt off. Now what?", right: "Report it right away.", wrong: ["Wait to see if anything happens.", "Clear your browser history."], why: "Minutes matter more than blame." },
  { month: 4, title: "MFA prompts you didn't start", lines: ["A prompt you didn't ask for means someone has your password.", "Deny it, change your password, and tell security.", "Never approve to make the buzzing stop."], question: "Your phone shows a sign-in prompt. You aren't signing in.", right: "Deny it, change your password, and report it.", wrong: ["Approve it once.", "Deny it and carry on."], why: "Denying is the start. Someone has your password, and security needs to know." },
  { month: 5, title: "Lock it when you leave it", lines: ["Windows key + L. Control + Command + Q on a Mac.", "Every time you stand up. Coffee counts.", "An unlocked screen is your login with someone else's hands."], question: "Stepping away for two minutes.", right: "Lock the screen.", wrong: ["Close the lid halfway.", "Leave it, it's two minutes."], why: "Two minutes is enough to send an email as you." },
  { month: 6, title: "Summer travel, public Wi-Fi", lines: ["Airports and hotels are full of lookalike networks.", "Use your phone's hotspot or the company VPN for work.", "Turn off auto-join for open networks."], question: "Two networks: Hotel_Guest and Hotel-Guest. Which?", right: "Neither for work. Use your hotspot.", wrong: ["The one with the strongest signal.", "Whichever needs no password."], why: "Anyone can name a network anything." },
  { month: 7, title: "Payment changes get a phone call", lines: ["A vendor \"changing bank details\" by email is a common and expensive scam.", "Call the number already on file, never the one in the email.", "Same rule for payroll deposit changes."], question: "A vendor emails new bank details.", right: "Call the number already on file.", wrong: ["Reply to confirm.", "Call the number in their signature."], why: "The email and its signature can both be fake." },
  { month: 8, title: "Personal AI tools and work data", lines: ["Free AI tools may keep what you paste.", "Customer, patient and financial data stays in approved tools only.", "If you're not sure a tool is approved, ask before pasting."], question: "You want help rewording a customer complaint.", right: "Use the company-approved tool.", wrong: ["Remove the names, then paste it into any tool.", "Paste it, then delete the chat."], why: "Without the name it can still describe one customer, and deleting the chat doesn't delete what the tool kept." },
  { month: 9, title: "Updates are security", lines: ["Most attacks use bugs that already have a fix.", "Restart when your device asks. Tonight, not next week.", "Tell IT if a device stops getting updates."], question: "Your laptop has asked to restart for updates for a week.", right: "Save work and restart today.", wrong: ["Postpone until it forces you.", "Turn off update notices."], why: "The fix only works once it's installed." },
  { month: 10, title: "Cybersecurity awareness month", lines: ["Three habits worth checking this month: unique passwords, MFA, and reporting fast.", "Check yours this week.", "Share one with someone at home."], question: "Which habit makes a stolen password not enough on its own?", right: "MFA on every account that offers it.", wrong: ["Changing passwords monthly.", "Antivirus."], why: "With MFA on, a stolen password alone doesn't open the account." },
  { month: 11, title: "Holiday shipping texts", lines: ["Fake delivery texts peak in November and December.", "Check the order in the store's own app, never the text's link.", "Report and delete."], question: "A text says your parcel needs a $1.99 fee.", right: "Check the store's app and ignore the link.", wrong: ["Pay, it's tiny.", "Reply STOP."], why: "The fee is bait for your card number." },
  { month: 12, title: "Gift cards are a red flag", lines: ["Nobody legitimate pays in gift cards.", "'The boss needs gift cards' is a scam every December.", "Verify on a known number. Every time."], question: "The owner texts for gift card codes for client gifts.", right: "Call the owner on a number you already have.", wrong: ["Buy them, you'll be reimbursed.", "Text back to check it's them."], why: "Gift card codes are untraceable cash." },
];

export const REMINDER_CONTROLS = { HIPAA: ["164.308(a)(5)(ii)(A)"], "CIS_v8.1": ["14.2"], "CSF_2.0": ["PR.AT-01"] };

export function reminderFor(month: number): Reminder {
  return REMINDERS.find((r) => r.month === month) ?? REMINDERS[0];
}

/** Each month's reminder as a scenario, so the server can score and record its one answer. */
export const reminderScenarios: WeekScenario[] = REMINDERS.map((r) => {
  const id = `REM-${String(r.month).padStart(2, "0")}`;
  const mk = (suffix: string, label: string, ok: boolean) => ({
    id: `${id.toLowerCase()}-${suffix}`,
    label,
    outcome: suffix,
    score: ok ? 100 : 0,
    verb: "decided" as const,
    flag: suffix,
    ok,
    debrief: r.why,
    bark: label,
    report: ok ? `Answered the ${r.title.toLowerCase()} reminder correctly.` : `Missed the ${r.title.toLowerCase()} reminder.`,
  });
  return {
    id,
    version: "1.0.0",
    day: "reminder",
    location: "reminder",
    trigger: "reminder",
    roles: ["all"],
    skill: "reminder",
    controls: REMINDER_CONTROLS,
    variants: [{ caller: "", pressure: "", tell: "" }],
    prompt: { who: "Monthly reminder", role: r.title, text: r.question },
    choices: [mk("a", r.right, true), mk("b", r.wrong[0], false), mk("c", r.wrong[1], false)],
    beat: id,
    next: "",
    flagKey: id,
    tenant_tokens: [],
    knowledge_check_pool: "",
  };
});
