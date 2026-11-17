// Small client for the portal API routes.
export type Membership = {
  role: "partner_admin" | "org_admin" | "learner";
  orgId: string | null;
  orgName: string | null;
  partnerId: string | null;
  partnerName: string | null;
  displayName: string | null;
};
export type Me = { user: { id: string; email: string } | null; learnerOrg?: string | null; memberships?: Membership[] };
export type Learner = {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  monday: "Not started" | "In progress" | "Complete";
  score: number;
  lastActive: number | null;
};
export type OrgDetail = {
  org: { id: string; name: string; domain: string | null; partnerId: string | null; leaderboardEnabled: boolean };
  learners: Learner[];
  campaign: { id: string; name: string; shifts: string[]; dueAt: number | null } | null;
};
export type PartnerOrg = { id: string; name: string; domain: string | null; learners: number; completed: number; completion: number };
export type LeaderRow = { rank?: number; name: string; score: number; complete: boolean; you: boolean };
export type Board = { enabled: boolean; isAdmin: boolean; rows: LeaderRow[] };

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
