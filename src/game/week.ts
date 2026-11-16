// Shared by the title screen and the public site; keep free of game imports.

export type Shift = { day: string; title: string; topics: string; status: "open" | "soon" };

/** The week: one shift a day, each a ~20-minute night mapped to a block of required training. */
export const WEEK: Shift[] = [
  { day: "Monday", title: "First night", topics: "Tailgating · phishing · phone scams · MFA push · USB drops · updates · wire fraud · misdirected email · clean desk", status: "open" },
  { day: "Tuesday", title: "The vendor", topics: "Invoice and payment fraud · third-party access · shadow IT · contractor badges", status: "soon" },
  { day: "Wednesday", title: "The data", topics: "Customer and patient data · classification · sharing links · AI tools and confidential data", status: "soon" },
  { day: "Thursday", title: "On the road", topics: "Public Wi-Fi · lost device · travel · deepfake voice and video · working from home", status: "soon" },
  { day: "Friday", title: "The incident", topics: "Insider risk · spotting and reporting an incident · the first hour · what not to delete", status: "soon" },
];
