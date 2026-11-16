import { useEffect, useState } from "react";

export const CONTACT = "mailto:hello@dryruncyber.com?subject=Dry%20Run%20Cyber%20access";

/** Sticky site header shared by the public pages. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled ? "border-b border-site-rule bg-site-ink/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-4 md:px-10 md:py-5">
        <a href="/" aria-label="Dry Run Cyber home" className="shrink-0">
          <img src="/brand/logo-horizontal.svg" alt="Dry Run Cyber" className="h-10 w-auto md:h-12" />
        </a>
        <nav aria-label="Primary" className="flex items-center gap-7 text-[15px] text-site-mist">
          <a href="/#night" className="hidden hover:text-site-paper lg:inline">How it works</a>
          <a href="/#msps" className="hidden hover:text-site-paper md:inline">For MSPs</a>
          <a href="/play" className="hidden hover:text-site-paper sm:inline">Partner login</a>
          <a
            href={CONTACT}
            className="rounded-md border border-site-violet px-4 py-2 font-semibold text-site-paper transition-colors hover:bg-site-violet"
          >
            Request access
          </a>
        </nav>
      </header>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-site-rule">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-4 px-6 py-8 pb-24 text-sm text-site-dim sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-8 md:px-10">
        <img src="/brand/dry-run-cyber-icon-white.svg" alt="" className="h-6 w-6 opacity-60" />
        <span>© {new Date().getFullYear()} Dry Run Cyber</span>
        <a href="mailto:hello@dryruncyber.com" className="hover:text-site-paper">hello@dryruncyber.com</a>
        <span className="flex gap-6">
          <a href="/coverage" className="hover:text-site-paper">Control coverage</a>
          <a href="/play" className="hover:text-site-paper">Partner login</a>
        </span>
      </div>
    </footer>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-site-paper focus:px-3 focus:py-2 focus:text-site-ink"
    >
      Skip to content
    </a>
  );
}
