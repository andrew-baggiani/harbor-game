import { NoWidows } from "@/site/NoWidows";
import { useEffect, useState } from "react";

export const CONTACT = "mailto:hello@dryruncyber.com?subject=Dry%20Run%20Cyber%20access";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "For MSPs" },
  { href: "/ai-security", label: "AI security guide" },
];

/** Sticky site header shared by the public pages. Phones get a menu button for the links that don't fit. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);
  return (
    <div
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled || menu
          ? "border-b border-white/[0.06] bg-site-ink/90 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <header className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-6 py-3.5 md:px-10 md:py-5">
        <a href="/" aria-label="Dry Run Cyber home" className="shrink-0">
          <img
            src="/brand/logo-horizontal.svg"
            alt="Dry Run Cyber"
            className="h-8 w-auto sm:h-10 md:h-12"
          />
        </a>
        <nav
          aria-label="Primary"
          className="flex items-center gap-3 whitespace-nowrap text-[15px] text-site-mist sm:gap-7"
        >
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`hidden hover:text-site-paper ${i === 0 ? "lg:inline" : "md:inline"}`}
            >
              {l.label}
            </a>
          ))}
          <a href="/login" className="hidden hover:text-site-paper sm:inline">
            Sign in
          </a>
          <a
            href="/pricing#waitlist"
            className="hud rounded-xl border border-site-violet/70 px-3 py-1.5 text-[15px] text-site-paper transition hover:border-site-violet-hi hover:bg-site-violet/15 sm:px-4 sm:py-2"
          >
            Join the waitlist
          </a>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="site-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            className="-mr-1.5 grid h-10 w-10 place-items-center rounded-lg text-site-paper hover:bg-white/[0.06] md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </nav>
      </header>
      {menu && (
        <nav
          id="site-menu"
          aria-label="Menu"
          className="border-t border-white/[0.06] px-6 pb-5 pt-2 md:hidden"
        >
          <ul className="grid text-[17px]">
            {[...LINKS, { href: "/login", label: "Sign in" }].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMenu(false)}
                  className="block border-b border-white/[0.05] py-3.5 text-site-paper"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function SiteFooter() {
  return (
    <>
      <NoWidows />

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-4 px-6 py-8 pb-24 text-sm text-site-dim sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-8 md:px-10">
          <img src="/brand/dry-run-cyber-icon-white.svg" alt="" className="h-6 w-6 opacity-60" />
          <span>© {new Date().getFullYear()} Dry Run Cyber</span>
          <a href="mailto:hello@dryruncyber.com" className="hover:text-site-paper">
            hello@dryruncyber.com
          </a>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="/ai-security" className="hover:text-site-paper">
              AI security guide
            </a>
            <a href="/coverage" className="hover:text-site-paper">
              Control coverage
            </a>
            <a href="/sample-record" className="hover:text-site-paper">
              Sample record
            </a>
            <a href="/privacy" className="hover:text-site-paper">
              Privacy
            </a>
            <a href="/login" className="hover:text-site-paper">
              Partner sign in
            </a>
          </span>
        </div>
      </footer>
    </>
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
