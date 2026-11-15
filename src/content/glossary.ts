export type Term = { term: string; body: string };

export const GLOSSARY: Term[] = [
  {
    term: "Phishing",
    body: "A message, page, or call built to make you hand over a secret, money, data, or access. The costume changes. The ask is the point.",
  },
  {
    term: "Spear phishing",
    body: "Phishing aimed at a specific person or role, using real names, projects, and vendors. Research is not authentication.",
  },
  {
    term: "Business email compromise",
    body: "Fraud that impersonates an executive, vendor, or colleague to redirect a payment or a data transfer. Often there is no malware at all.",
  },
  {
    term: "Pretexting",
    body: "A story that makes an unusual request feel due. Urgency, authority, and a few true details are the usual materials.",
  },
  {
    term: "Vishing and smishing",
    body: "Phishing by voice, and phishing by text message. Caller ID and a short code are not proof of who is on the other end.",
  },
  {
    term: "Lookalike domain",
    body: "A site name that resembles a real one: an extra word, a misspelling, a hyphen, or a letter from another alphabet.",
  },
  {
    term: "Homoglyph",
    body: "A character that looks like another. A Cyrillic o in harborandco.com is a different name, even when the shape matches.",
  },
  {
    term: "Display name vs address",
    body: "The friendly name on an email is typed by the sender. The address, and then the real link target, are what you can check.",
  },
  {
    term: "Mismatch link",
    body: "Visible text that says one URL while the actual target is another. The blue words are not the destination.",
  },
  {
    term: "Out of band",
    body: "Confirming a request on a second channel you chose, using a number or path you already had. The message that created the urgency does not get to supply the proof.",
  },
  {
    term: "Dual control",
    body: "A payment or access change that needs a second person, on the normal path. Skipping it because someone senior is in a hurry is the fraud.",
  },
  {
    term: "Multi-factor authentication",
    body: "A second check beyond the password: a code, a push, a device, or a passkey. It helps. It is not permission to read a code aloud to a caller.",
  },
  {
    term: "MFA fatigue",
    body: "Repeated push approvals until someone taps yes to make them stop. The tapping is the attack. Deny unexpected prompts and report them.",
  },
  {
    term: "Phishing-resistant MFA",
    body: "Passkeys and hardware security keys that bind the login to the real site name. A fake page cannot replay them the way it can replay a typed code.",
  },
  {
    term: "Credential stuffing",
    body: "Trying passwords stolen from one site on many others. Reuse is what makes a distant breach into your mailbox.",
  },
  {
    term: "Double extortion",
    body: "Ransomware that both locks systems and steals copies, then threatens to publish. Paying is not your decision to make at your desk.",
  },
  {
    term: "Shadow IT",
    body: "Tools the company did not approve, adopted because the official path felt slow. Customer data does not get to take the shortcut.",
  },
  {
    term: "Prompt injection",
    body: "Hidden instructions inside a document or page that try to make an AI tool ignore its rules or exfiltrate what you pasted. Treat outputs and uploads as untrusted.",
  },
  {
    term: "Tailgating",
    body: "Following a badged person through a door. Manners are not a control. Visitors go to reception.",
  },
  {
    term: "Juice jacking",
    body: "A public charging port that can do more than charge. Use your own brick, or a cable that only carries power.",
  },
];
