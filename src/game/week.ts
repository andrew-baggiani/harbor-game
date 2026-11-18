// Shared by the title screen and the public site; keep free of game imports.

export type Shift = { day: string; title: string; topics: string; status: "open" | "soon"; href: string };

/** The week: one shift a day, each mapped to a block of required training, plus two short weekend games. */
export const WEEK: Shift[] = [
  { day: "Monday", title: "First night", topics: "Tailgating · phishing · phone scams · MFA push · USB drops · updates · wire fraud · misdirected email · clean desk", status: "open", href: "/play" },
  { day: "Tuesday", title: "The vendor", topics: "Invoice and payment fraud · third-party access · shadow IT · contractor badges", status: "open", href: "/week/tuesday" },
  { day: "Wednesday", title: "The data", topics: "Customer and patient data · classification · sharing links · AI tools and confidential data", status: "open", href: "/week/wednesday" },
  { day: "Thursday", title: "On the road", topics: "Public Wi-Fi · lost device · travel · deepfake voice and video · working from home", status: "open", href: "/week/thursday" },
  { day: "Friday", title: "The incident", topics: "Insider risk · spotting and reporting an incident · the first hour · what not to delete", status: "open", href: "/week/friday" },
  { day: "Saturday", title: "Off the clock", topics: "Delivery texts · reused passwords · posting your badge · the home router", status: "open", href: "/week/saturday" },
  { day: "Sunday", title: "The sort", topics: "Ninety seconds · sixteen messages · safe or not", status: "open", href: "/week/sunday" },
];

/** Role-based tracks, assigned per person in the portal. */
export const TRACK_LIST = [
  { id: "track-admin", day: "Admins", title: "The keys", topics: "MFA storms on admin accounts · vendor admin requests · separate admin accounts · scripts from the internet", href: "/week/track-admin" },
  { id: "track-finance", day: "Finance", title: "The money", topics: "Payroll diversion · gift cards · vendor master changes · approval splitting", href: "/week/track-finance" },
  { id: "track-helpdesk", day: "Help desk", title: "The front line", topics: "Caller identity · MFA re-enrollment · what not to tell a caller", href: "/week/track-helpdesk" },
];
