// Building blocks for long-form guides on the public site.
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Check } from "@/portal/ui";

/* ------------------------------------------------------------------ sources (numbered footnotes) */

export type Source = { id: string; title: string; url: string; publisher: string };
const SourcesCtx = createContext<Source[]>([]);
export const SourcesProvider = ({ sources, children }: { sources: Source[]; children: ReactNode }) => (
  <SourcesCtx.Provider value={sources}>{children}</SourcesCtx.Provider>
);

/** Superscript link to a numbered source at the bottom of the page. */
export function Cite({ ids }: { ids: string }) {
  const sources = useContext(SourcesCtx);
  const list = ids.split(",").map((id) => id.trim());
  return (
    <sup className="ml-0.5 whitespace-nowrap text-[0.68em] font-semibold">
      {list.map((id, i) => {
        const n = sources.findIndex((s) => s.id === id) + 1;
        return (
          <a key={id} href={`#src-${id}`} className="text-site-violet-hi no-underline hover:underline" aria-label={`Source ${n}`}>
            {i ? "," : ""}
            {n || "?"}
          </a>
        );
      })}
    </sup>
  );
}

export function SourceList() {
  const sources = useContext(SourcesCtx);
  return (
    <ol className="space-y-2 text-[14.5px] leading-relaxed text-site-mist">
      {sources.map((s, i) => (
        <li key={s.id} id={`src-${s.id}`} className="grid scroll-mt-28 grid-cols-[2rem_1fr]">
          <span className="num text-site-dim">{i + 1}.</span>
          <span>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-site-paper underline decoration-white/20 underline-offset-4 hover:decoration-site-violet-hi">
              {s.title}
            </a>{" "}
            <span className="text-site-dim">· {s.publisher}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ chapter frame */

export function Chapter({ id, n, title, lede, children }: { id: string; n: number; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-white/[0.06] pt-14 first:border-t-0 first:pt-0">
      <p className="num text-sm font-bold text-site-violet-hi">Chapter {n}</p>
      <h2 id={`${id}-h`} className="display mt-2 text-[clamp(1.9rem,3.6vw,2.7rem)] font-extrabold leading-[1.04]" style={{ fontStretch: "118%" }}>
        {title}
      </h2>
      {lede ? <p className="mt-5 text-xl leading-relaxed text-site-paper/90">{lede}</p> : null}
      <div className="prose-guide mt-8">{children}</div>
    </section>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-12 scroll-mt-24 text-[23px] font-bold leading-snug" style={{ fontStretch: "110%" }}>
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ callouts */

const TONE = {
  do: { ring: "ring-site-mint/30", bg: "bg-site-mint/[0.06]", label: "Do this", text: "text-site-mint" },
  gotcha: { ring: "ring-[#ffb547]/30", bg: "bg-[#ffb547]/[0.06]", label: "Gotcha", text: "text-[#ffc56b]" },
  risk: { ring: "ring-site-alarm/30", bg: "bg-site-alarm/[0.06]", label: "Risk", text: "text-site-alarm" },
  note: { ring: "ring-site-violet/35", bg: "bg-site-violet/[0.07]", label: "Note", text: "text-site-violet-hi" },
};
export function Callout({ tone = "note", title, children }: { tone?: keyof typeof TONE; title?: string; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <aside className={`my-7 rounded-2xl px-5 py-4 ring-1 ring-inset ${t.ring} ${t.bg}`}>
      <p className={`text-[14px] font-bold ${t.text}`}>{title ?? t.label}</p>
      <div className="mt-1.5 text-[16.5px] leading-relaxed text-site-paper/90 [&>p+p]:mt-2">{children}</div>
    </aside>
  );
}

/** A click path, rendered as breadcrumbs: Admin center › Settings › Copilot. */
export function Path({ children }: { children: string }) {
  const parts = children.split(" > ");
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 align-baseline text-[0.92em] font-semibold text-site-paper">
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i ? <span className="text-site-dim">›</span> : null}
          {p}
        </span>
      ))}
    </span>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="steps my-6 space-y-3">{children}</ol>;
}
export function Step({ children }: { children: ReactNode }) {
  return <li className="relative pl-11 text-[17px] leading-relaxed">{children}</li>;
}

/* ------------------------------------------------------------------ checklist (remembered in this browser) */

const STORE = "drc-ai-guide-checks";
function readChecks(): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(STORE) ?? "{}");
  } catch {
    return {};
  }
}
export function useChecks() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setChecks(readChecks());
    const on = () => setChecks(readChecks());
    window.addEventListener("drc-checks", on);
    return () => window.removeEventListener("drc-checks", on);
  }, []);
  const toggle = (id: string) => {
    const next = { ...readChecks(), [id]: !readChecks()[id] };
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* private mode: keep it in memory */
    }
    setChecks(next);
    window.dispatchEvent(new Event("drc-checks"));
  };
  return { checks, toggle };
}

export type Task = { id: string; text: ReactNode };
export function Checklist({ title = "Checklist", items }: { title?: string; items: Task[] }) {
  const { checks, toggle } = useChecks();
  const done = items.filter((i) => checks[i.id]).length;
  return (
    <div className="panel my-8 !p-5 sm:!p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-bold">{title}</p>
        <span className="num text-sm text-site-dim">
          {done}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.03]">
              <input type="checkbox" className="peer sr-only" checked={!!checks[i.id]} onChange={() => toggle(i.id)} />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 ring-inset transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-site-violet-hi ${checks[i.id] ? "bg-site-mint text-site-ink ring-site-mint" : "ring-white/25"}`}
              >
                {checks[i.id] ? <Check size={14} /> : null}
              </span>
              <span className={`text-[16px] leading-relaxed ${checks[i.id] ? "text-site-dim line-through decoration-white/20" : "text-site-paper/90"}`}>{i.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ tabs and tables */

export function Tabs({ tabs }: { tabs: { id: string; label: string; body: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const base = useId();
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === h)) setActive(h);
  }, [tabs]);
  return (
    <div className="my-8">
      <div role="tablist" aria-label="Platforms" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${base}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`${base}-${t.id}-panel`}
            onClick={() => setActive(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition ${active === t.id ? "bg-site-violet text-site-paper shadow-[0_8px_24px_-10px_rgba(139,44,245,.8)]" : "text-site-mist hover:bg-white/[0.05] hover:text-site-paper"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${base}-${t.id}-panel`} role="tabpanel" aria-labelledby={`${base}-${t.id}`} hidden={active !== t.id} className="pt-6">
          <span id={t.id} className="block scroll-mt-28" />
          {t.body}
        </div>
      ))}
    </div>
  );
}

export function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-2xl ring-1 ring-inset ring-white/[0.08]">
        <table className="w-full min-w-[620px] text-left text-[15px]">
          <thead className="bg-white/[0.04] text-site-mist">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-4 py-3 font-semibold text-site-paper">
                      {c}
                    </th>
                  ) : (
                    <td key={j} className="px-4 py-3 leading-relaxed text-site-paper/85">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <figcaption className="mt-3 text-sm text-site-dim">{caption}</figcaption> : null}
    </figure>
  );
}

export const Yes = () => <span className="font-semibold text-site-mint">Yes</span>;
export const No = () => <span className="text-site-dim">No</span>;
