import { createFileRoute } from "@tanstack/react-router";
import { context, guard } from "@/server/auth";
import { isOwner } from "@/server/billing";
import { bad, readJson } from "@/server/http";
import sheet from "../../../docs/voice-all.json";

type Line = { id: string; text: string; voice_id: string };
const LINES = new Map((sheet as Line[]).map((l) => [l.id, l]));

// POST (owner) { id }: records one line from docs/voice-all.json with ElevenLabs and returns the mp3.
// The key stays in the Worker (secret ELEVENLABS_API_KEY); only lines already in the sheet can be recorded,
// with their own text and voice, so this can't be used to synthesize anything else.
export const Route = createFileRoute("/api/voices")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await context(request);
          if (ctx instanceof Response) return ctx;
          if (!isOwner(ctx.env, ctx.access)) return bad("Not allowed.", 403);
          const key = ctx.env.ELEVENLABS_API_KEY;
          if (!key) return bad("No ElevenLabs key on the Worker. Add the secret ELEVENLABS_API_KEY in Cloudflare.", 501);
          const body = await readJson<{ id?: string }>(request);
          const line = LINES.get(String(body?.id ?? ""));
          if (!line) return bad("That line isn't in the voice sheet.", 404);
          const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${line.voice_id}?output_format=mp3_44100_128`, {
            method: "POST",
            headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
            body: JSON.stringify({ text: line.text, model_id: "eleven_v3" }),
          }).catch(() => null);
          if (!res) return bad("Couldn't reach ElevenLabs. Try again in a minute.", 502);
          if (!res.ok) {
            const why = (await res.text().catch(() => "")).slice(0, 300);
            return bad(`ElevenLabs said ${res.status}${why ? `: ${why}` : ""}`, 502);
          }
          return new Response(res.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
        }),
    },
  },
});
