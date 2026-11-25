import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Me } from "@/site/portal-api";
import sheet from "../../docs/voice-all.json";

export const Route = createFileRoute("/admin/voices")({
  head: () => ({
    meta: [{ title: "Voices · Dry Run Cyber" }, { name: "robots", content: "noindex" }, { name: "theme-color", content: "#101319" }],
  }),
  component: Voices,
});

type Line = { id: string; text: string; who: string; voice: string };
const LINES = sheet as Line[];

/** Is /voice/v2/<id>.mp3 already deployed? A missing file comes back as a 404 or as the app's HTML. */
async function hasFile(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/voice/v2/${id}.mp3`, { method: "HEAD", cache: "no-store" });
    return res.ok && (res.headers.get("content-type") ?? "").includes("audio");
  } catch {
    return false;
  }
}

/**
 * The owner records every voice line that has no file yet. The ElevenLabs key never leaves the Worker; the
 * finished takes come down as one zip to drop into public/voice/v2.
 */
function Voices() {
  const [me, setMe] = useState<Me | null>(null);
  const [missing, setMissing] = useState<Line[] | null>(null);
  const [done, setDone] = useState<{ id: string; blob: Blob }[]>([]);
  const [failed, setFailed] = useState<{ id: string; why: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [zip, setZip] = useState<string | null>(null);

  useEffect(() => {
    api<Me>("/api/me")
      .then(async (m) => {
        setMe(m);
        if (!m.owner) return;
        const have = await Promise.all(LINES.map((l) => hasFile(l.id)));
        setMissing(LINES.filter((_, i) => !have[i]));
      })
      .catch(() => setMe({ user: null }));
  }, []);

  async function record() {
    if (!missing) return;
    setRunning(true);
    setFailed([]);
    setZip(null);
    const got: { id: string; blob: Blob }[] = [];
    for (const line of missing) {
      try {
        const res = await fetch("/api/voices", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: line.id }),
        });
        if (!res.ok) {
          const why = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? `HTTP ${res.status}`;
          setFailed((f) => [...f, { id: line.id, why }]);
          if (res.status === 501 || res.status === 403) break;
          continue;
        }
        got.push({ id: line.id, blob: await res.blob() });
        setDone([...got]);
      } catch (e) {
        setFailed((f) => [...f, { id: line.id, why: (e as Error).message }]);
      }
    }
    if (got.length) {
      const file = await storeZip(got.map((g) => ({ name: `${g.id}.mp3`, blob: g.blob })));
      const url = URL.createObjectURL(file);
      setZip(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drc-voices-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
    }
    setRunning(false);
  }

  if (!me) return <div className="site min-h-dvh" aria-busy="true" />;
  if (!me.owner)
    return (
      <div className="site flex min-h-dvh items-center justify-center p-6">
        <p className="text-site-mist">
          This page is for Dry Run Cyber staff.{" "}
          <a href="/login?next=/admin/voices" className="underline">
            Sign in
          </a>
        </p>
      </div>
    );

  return (
    <div className="site min-h-dvh">
      <main className="mx-auto max-w-[900px] px-5 py-10">
        <h1 className="display text-[40px]">Voices</h1>
        {missing === null ? (
          <p className="mt-6 text-site-mist">Checking which lines have audio…</p>
        ) : missing.length === 0 ? (
          <p className="mt-6 text-site-mist">Every line in the voice sheet has audio. Nothing to record.</p>
        ) : (
          <>
            <p className="mt-4 text-[15px] text-site-mist">
              {missing.length} of {LINES.length} lines have no audio yet. Recording uses the ElevenLabs key stored on the Worker; the takes come down as one
              zip.
            </p>
            <button
              type="button"
              disabled={running}
              onClick={() => void record()}
              className="mt-6 rounded-full bg-site-violet px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {running ? `Recording ${done.length + failed.length + 1} of ${missing.length}…` : `Record ${missing.length} lines`}
            </button>
            {zip ? (
              <p role="status" className="mt-4 text-[15px]">
                Recorded {done.length}.{" "}
                <a href={zip} download={`drc-voices-${new Date().toISOString().slice(0, 10)}.zip`} className="underline">
                  Download the zip again
                </a>
              </p>
            ) : null}
            {failed.length ? (
              <ul className="mt-4 space-y-1 text-[14px] text-red-300">
                {failed.map((f) => (
                  <li key={f.id}>
                    {f.id}: {f.why}
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-8 divide-y divide-site-rule border-y border-site-rule">
              {missing.map((l) => {
                const take = done.find((d) => d.id === l.id);
                return (
                  <li key={l.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="text-[13px] text-site-dim">
                        {l.id} · {l.voice}
                      </p>
                      <p className="mt-1">{l.text}</p>
                    </div>
                    {take ? <Take blob={take.blob} /> : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function Take({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <audio controls src={url} className="h-9 w-64" /> : null;
}

// A plain zip with no compression (mp3s don't shrink), so no library is needed.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i += 1) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function storeZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  let size = 0;
  const enc = new TextEncoder();
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, data);
    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, data.length, true);
    dir.setUint32(24, data.length, true);
    dir.setUint16(28, name.length, true);
    dir.setUint32(42, offset, true);
    const entry = new Uint8Array(46 + name.length);
    entry.set(new Uint8Array(dir.buffer), 0);
    entry.set(name, 46);
    central.push(entry);
    size += entry.length;
    offset += 30 + name.length + data.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}
