import type { ReactNode } from "react";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";

/** Shared layout for the Terms and Privacy pages. */
export function LegalPage({ title, lead, updated, children }: { title: string; lead: ReactNode; updated: string; children: ReactNode }) {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto max-w-[760px] px-6 pb-28 pt-10 md:px-10 lg:pt-16">
        <h1 className="display text-[40px] sm:text-[56px]">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-site-mist">{lead}</p>
        <p className="mt-3 text-sm text-site-dim">Last updated {updated}</p>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold" style={{ fontStretch: "112%" }}>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-site-mist [&_b]:font-semibold [&_b]:text-site-paper [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol_li]:pl-1 [&_ul>li]:relative [&_ul>li]:pl-5 [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.7em] [&_ul>li]:before:h-1.5 [&_ul>li]:before:w-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-site-violet-hi [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

export function Grid({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] border-collapse text-left text-[15.5px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-white/15 py-2.5 pr-4 text-[13px] font-semibold text-site-dim">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className={`border-b border-white/[0.07] py-3 pr-4 align-top ${i === 0 ? "text-site-paper" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const mail = (
  <a href="mailto:hello@dryruncyber.com" className="text-site-paper underline decoration-white/25 underline-offset-4">
    hello@dryruncyber.com
  </a>
);
