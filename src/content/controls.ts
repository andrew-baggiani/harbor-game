/**
 * Compliance crosswalk: which framework controls each piece of training content supports.
 *
 * Language rule: this content "maps to" / "supports" a control. No training product makes an
 * organization compliant by itself (see docs/TRAINING_SPEC.md, section 0).
 *
 * Covers the reading lessons (curriculum-a/b/c) and the drills. The Monday 3D shift beats carry
 * their own control ids in src/content/scenarios/*.json; `coverage()` accepts those as extra input.
 */

export type Framework = "CIS" | "NIST53" | "NIST171" | "CMMC" | "HIPAA" | "CSF";

export type ControlDef = {
  id: string;
  framework: Framework;
  title: string;
  /** Program-level controls are met by how the program is run (cadence, records, roles), not by a lesson. */
  programLevel?: boolean;
};

export const FRAMEWORK_LABEL: Record<Framework, string> = {
  CIS: "CIS Controls v8.1",
  NIST53: "NIST SP 800-53 Rev. 5",
  NIST171: "NIST SP 800-171 Rev. 2",
  CMMC: "CMMC Level 2",
  HIPAA: "HIPAA (45 CFR 164)",
  CSF: "NIST CSF 2.0",
};

export const CONTROLS: ControlDef[] = [
  // CIS Controls v8.1, Control 14
  { id: "CIS-14.1", framework: "CIS", title: "Establish and maintain a security awareness program", programLevel: true },
  { id: "CIS-14.2", framework: "CIS", title: "Recognize social engineering attacks" },
  { id: "CIS-14.3", framework: "CIS", title: "Authentication best practices" },
  { id: "CIS-14.4", framework: "CIS", title: "Data handling best practices" },
  { id: "CIS-14.5", framework: "CIS", title: "Causes of unintentional data exposure" },
  { id: "CIS-14.6", framework: "CIS", title: "Recognize and report security incidents" },
  { id: "CIS-14.7", framework: "CIS", title: "Identify and report missing security updates" },
  { id: "CIS-14.8", framework: "CIS", title: "Dangers of insecure networks" },
  { id: "CIS-14.9", framework: "CIS", title: "Role-specific awareness and skills training" },
  // NIST SP 800-53 Rev. 5, AT family
  { id: "AT-2", framework: "NIST53", title: "Literacy training and awareness" },
  { id: "AT-2(1)", framework: "NIST53", title: "Practical exercises" },
  { id: "AT-2(2)", framework: "NIST53", title: "Insider threat" },
  { id: "AT-2(3)", framework: "NIST53", title: "Social engineering and mining" },
  { id: "AT-2(4)", framework: "NIST53", title: "Suspicious communications and anomalous system behavior" },
  { id: "AT-3", framework: "NIST53", title: "Role-based training" },
  { id: "AT-4", framework: "NIST53", title: "Training records", programLevel: true },
  // NIST SP 800-171 Rev. 2 (assessed under CMMC Level 2)
  { id: "3.2.1", framework: "NIST171", title: "Security risk awareness for managers, administrators, and users" },
  { id: "3.2.2", framework: "NIST171", title: "Training for assigned security duties" },
  { id: "3.2.3", framework: "NIST171", title: "Recognize and report potential indicators of insider threat" },
  { id: "AT.L2-3.2.1", framework: "CMMC", title: "Role-based risk awareness" },
  { id: "AT.L2-3.2.2", framework: "CMMC", title: "Role-based training" },
  { id: "AT.L2-3.2.3", framework: "CMMC", title: "Insider threat awareness" },
  // HIPAA Security Rule 164.308(a)(5) and Privacy Rule 164.530(b)
  { id: "164.308(a)(5)(i)", framework: "HIPAA", title: "Security awareness and training program (all workforce)", programLevel: true },
  { id: "164.308(a)(5)(ii)(A)", framework: "HIPAA", title: "Security reminders" },
  { id: "164.308(a)(5)(ii)(B)", framework: "HIPAA", title: "Protection from malicious software" },
  { id: "164.308(a)(5)(ii)(C)", framework: "HIPAA", title: "Log-in monitoring" },
  { id: "164.308(a)(5)(ii)(D)", framework: "HIPAA", title: "Password management" },
  { id: "164.530(b)", framework: "HIPAA", title: "Privacy training on PHI policies and procedures" },
  // NIST CSF 2.0
  { id: "PR.AT-01", framework: "CSF", title: "Personnel have general awareness and skills" },
  { id: "PR.AT-02", framework: "CSF", title: "Specialized roles have role-appropriate awareness and skills" },
];

/** Shorthand bundles so each content row stays readable. */
const BASE = ["AT-2", "3.2.1", "AT.L2-3.2.1", "PR.AT-01"];
const SE = ["CIS-14.2", "AT-2(3)"];
const SUSPICIOUS = ["AT-2(4)"];
const REPORT = ["CIS-14.6"];
const AUTH = ["CIS-14.3", "164.308(a)(5)(ii)(D)"];
const MALWARE = ["164.308(a)(5)(ii)(B)"];
const DATA = ["CIS-14.4"];
const EXPOSURE = ["CIS-14.5"];
const INSIDER = ["AT-2(2)", "3.2.3", "AT.L2-3.2.3"];
const EXERCISE = ["AT-2(1)"];

/** content id (lesson id, or `drill:<id>`) -> control ids */
export const CONTENT_CONTROLS: Record<string, string[]> = {
  // Module 01: The human layer
  "human-pause": [...BASE, ...REPORT, "CIS-14.2"],
  "human-levers": [...BASE, ...SE],
  "human-pretext": [...BASE, ...SE],
  // Module 02: Phishing and impersonation
  "phish-anatomy": [...BASE, ...SE, ...SUSPICIOUS],
  "phish-hosts": [...BASE, ...SE, ...SUSPICIOUS],
  "phish-channels": [...BASE, ...SE],
  // Module 03: Credentials and access
  "cred-length": [...BASE, ...AUTH],
  "cred-reuse": [...BASE, ...AUTH],
  "cred-mfa": [...BASE, ...AUTH, "164.308(a)(5)(ii)(C)"],
  // Module 04: Malware and the click
  "mal-arrival": [...BASE, ...MALWARE, ...SUSPICIOUS, "CIS-14.2"],
  "mal-ransom": [...BASE, ...MALWARE, ...REPORT],
  "mal-clicked": [...BASE, ...MALWARE, ...REPORT],
  // Module 05: Data, sharing, and AI
  "data-sensitive": [...BASE, ...DATA, "164.530(b)"],
  "data-channel": [...BASE, ...DATA, ...EXPOSURE],
  "data-ai": [...BASE, ...EXPOSURE],
  // Module 06: Devices and networks
  "dev-updates": [...BASE, "CIS-14.7", ...MALWARE],
  "dev-networks": [...BASE, "CIS-14.8"],
  "dev-hardware": [...BASE, ...DATA, ...REPORT, ...MALWARE],
  // Module 07: The workplace
  "work-floor": [...BASE, ...SE, ...DATA],
  "work-remote": [...BASE, "CIS-14.8", ...DATA],
  "work-calls": [...BASE, ...SE],
  // Module 08: Reporting
  "resp-report": [...BASE, ...REPORT, ...SUSPICIOUS],
  "resp-dont": [...BASE, ...REPORT],
  "resp-after": [...BASE, ...REPORT],
  // Module 09: Insider risk (curriculum-c)
  "insider-indicators": [...BASE, ...INSIDER],
  "insider-report": [...BASE, ...INSIDER, ...REPORT],
  "insider-you": [...BASE, ...INSIDER, ...SE],
  // Drills (practical exercises)
  "drill:inbox": [...BASE, ...SE, ...REPORT, ...SUSPICIOUS, ...EXERCISE],
  "drill:links": [...BASE, ...SE, ...SUSPICIOUS, ...EXERCISE],
  "drill:vishing": [...BASE, ...SE, ...AUTH, ...EXERCISE],
  "drill:passphrase": [...BASE, ...AUTH, ...EXERCISE],
  "drill:datadesk": [...BASE, ...DATA, ...EXPOSURE, ...EXERCISE],
  "drill:incident": [...BASE, ...REPORT, ...MALWARE, ...EXERCISE],
  "drill:wire": [...BASE, ...SE, ...EXERCISE],
};

export function controlsFor(contentId: string): ControlDef[] {
  const ids = CONTENT_CONTROLS[contentId] ?? [];
  return CONTROLS.filter((control) => ids.includes(control.id));
}

export type CoverageRow = {
  control: ControlDef;
  /** content ids that support this control */
  content: string[];
  /** true when nothing in the catalog supports it and it is not met by program operation */
  gap: boolean;
};

/**
 * Coverage matrix for the auditor report. Pass the 3D shift scenarios as `extra`
 * (scenario id -> control ids) so they count too.
 */
export function coverage(extra: Record<string, string[]> = {}): CoverageRow[] {
  const all: Record<string, string[]> = { ...CONTENT_CONTROLS, ...extra };
  return CONTROLS.map((control) => {
    const content = Object.keys(all).filter((id) => all[id].includes(control.id));
    return { control, content, gap: content.length === 0 && !control.programLevel };
  });
}

/** Controls nothing maps to. Role tracks and monthly reminders closed the last ones; this should come back empty. */
export function gaps(extra: Record<string, string[]> = {}): ControlDef[] {
  return coverage(extra)
    .filter((row) => row.gap)
    .map((row) => row.control);
}
