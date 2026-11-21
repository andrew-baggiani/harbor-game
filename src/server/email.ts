import type { Env } from "@/server/env";

export type SendResult = { sent: boolean; provider: "resend" | "log" };

/** Magic-link email. Resend when RESEND_API_KEY is set; otherwise the link is only logged. */
export async function sendMagicLink(
  env: Env,
  to: string,
  link: string,
  purpose: "signin" | "invite",
  orgName?: string,
  brandName?: string | null,
): Promise<SendResult> {
  // An MSP that set its brand sends invites under its own name; Dry Run Cyber stays as the platform.
  const subject =
    purpose === "invite"
      ? brandName
        ? `${brandName}: your security training is ready`
        : `You're invited to Dry Run Cyber${orgName ? ` by ${orgName}` : ""}`
      : "Your Dry Run Cyber sign-in link";
  const lead =
    purpose === "invite"
      ? brandName
        ? `${brandName} has set up security training for ${orgName ?? "your team"}. You play it as a first-person night shift: real calls, real consequences, about twenty minutes.`
        : `${orgName ?? "Your team"} has set you up with Dry Run Cyber, security awareness training you play as a first-person night shift.`
      : "Here's your link to sign in to Dry Run Cyber.";
  const from = purpose === "invite" && brandName ? `${brandName.replace(/[<>",]/g, "")} via Dry Run Cyber <hello@dryruncyber.com>` : "Dry Run Cyber <hello@dryruncyber.com>";
  const text = `${lead}\n\nOpen this link within 15 minutes:\n${link}\n\nIf you didn't ask for this, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#101319">
<p>${escapeHtml(lead)}</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#8b2cf5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${purpose === "invite" ? "Start your shift" : "Sign in"}</a></p>
<p style="color:#555">The link works once and expires in 15 minutes. If you didn't ask for this, ignore this email.</p></div>`;

  if (!env.RESEND_API_KEY) {
    console.log(`[email] ${purpose} link for ${to}: ${link}`);
    return { sent: false, provider: "log" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    console.error(`[email] resend failed ${res.status}: ${await res.text().catch(() => "")}`);
    return { sent: false, provider: "resend" };
  }
  return { sent: true, provider: "resend" };
}

/** A plain notification or confirmation email. Logged instead of sent when Resend isn't set up. */
export async function sendMail(env: Env, to: string, subject: string, text: string, replyTo?: string): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email] (not sent, no RESEND_API_KEY) to ${to}: ${subject}`);
    return { sent: false, provider: "log" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: "Dry Run Cyber <hello@dryruncyber.com>", to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    console.error(`[email] resend failed ${res.status}`);
    return { sent: false, provider: "resend" };
  }
  return { sent: true, provider: "resend" };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
