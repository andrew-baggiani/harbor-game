import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { addLearners, assertOrgAdmin, createMagicLink, createOrg, normEmail, orgDetail, setCampaign, setDisplayName, setLeaderboardEnabled } from "@/server/db";
import { sendMagicLink } from "@/server/email";
import { bad, isLocal, json, readJson } from "@/server/http";

type Body = {
  action?: "create" | "invite" | "remind" | "campaign" | "settings" | "displayName";
  orgId?: string;
  name?: string;
  domain?: string;
  emails?: string;
  dueAt?: string | null;
  leaderboardEnabled?: boolean;
  displayName?: string | null;
};

// GET ?org= → learners, status and score (admins). POST actions below.
export const Route = createFileRoute("/api/org")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const orgId = new URL(request.url).searchParams.get("org");
          if (!orgId) return bad("org required");
          return json(await orgDetail(ctx.db, ctx.access, orgId));
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = (await readJson<Body>(request)) ?? {};
          const { db, access } = ctx;

          if (body.action === "create") {
            const name = body.name?.trim().slice(0, 120);
            if (!name) return bad("Name your organization.");
            return json(await createOrg(db, access, { name, domain: body.domain?.trim() || null }));
          }
          if (!body.orgId) return bad("orgId required");

          if (body.action === "invite") {
            // Accept a pasted list or a CSV: any token that looks like an email.
            const raw = (body.emails ?? "").split(/[\s,;]+/).map((e) => normEmail(e.replace(/^["']|["']$/g, ""))).filter(Boolean) as string[];
            const emails = [...new Set(raw)].slice(0, 500);
            if (!emails.length) return bad("Paste at least one email address.");
            const { added, already } = await addLearners(db, access, body.orgId, emails);
            const origin = new URL(request.url).origin;
            const org = await db.prepare("SELECT name FROM orgs WHERE id = ?").bind(body.orgId).first<{ name: string }>();
            const devLinks: Record<string, string> = {};
            let provider = "log";
            for (const u of added) {
              const token = await createMagicLink(db, u.id, "/play");
              const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
              const sent = await sendMagicLink(ctx.env, u.email, link, "invite", org?.name);
              provider = sent.provider;
              if (sent.provider === "log" && isLocal(request)) devLinks[u.email] = link;
            }
            return json({ invited: added.map((u) => u.email), already, provider, ...(Object.keys(devLinks).length ? { devLinks } : {}) });
          }
          if (body.action === "remind") {
            // Fresh sign-in links for learners already on the team (at most one per person every 15 minutes).
            const org = await assertOrgAdmin(db, access, body.orgId);
            const wanted = new Set((body.emails ?? "").split(/[\s,;]+/).map((e) => normEmail(e)).filter(Boolean) as string[]);
            const { results: team } = await db
              .prepare("SELECT u.id, u.email FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.org_id = ? AND m.role = 'learner'")
              .bind(body.orgId)
              .all<{ id: string; email: string }>();
            const origin = new URL(request.url).origin;
            const reminded: string[] = [];
            const skipped: string[] = [];
            const devLinks: Record<string, string> = {};
            for (const u of team.filter((t) => wanted.has(t.email)).slice(0, 200)) {
              const recent = await db
                .prepare("SELECT COUNT(*) AS n FROM magic_links WHERE user_id = ? AND expires_at > ?")
                .bind(u.id, Date.now())
                .first<{ n: number }>();
              if ((recent?.n ?? 0) > 0) {
                skipped.push(u.email);
                continue;
              }
              const token = await createMagicLink(db, u.id, "/play");
              const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
              const sent = await sendMagicLink(ctx.env, u.email, link, "invite", org.name);
              if (sent.provider === "log" && isLocal(request)) devLinks[u.email] = link;
              reminded.push(u.email);
            }
            return json({ reminded, skipped, ...(Object.keys(devLinks).length ? { devLinks } : {}) });
          }
          if (body.action === "campaign") {
            const dueAt = body.dueAt ? Date.parse(body.dueAt) : null;
            if (body.dueAt && Number.isNaN(dueAt)) return bad("Bad due date");
            return json(await setCampaign(db, access, body.orgId, dueAt));
          }
          if (body.action === "settings") {
            await setLeaderboardEnabled(db, access, body.orgId, !!body.leaderboardEnabled);
            return json({ ok: true });
          }
          if (body.action === "displayName") {
            const name = body.displayName?.trim().slice(0, 40) || null;
            await setDisplayName(db, access, body.orgId, name);
            return json({ ok: true, displayName: name });
          }
          return bad("Unknown action");
        }),
    },
  },
});
