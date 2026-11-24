import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";

/** Site-wide 404, in the site's own chrome. */
export function NotFound() {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto max-w-[760px] px-6 pb-28 pt-16 md:px-10 lg:pt-24">
        <p className="text-sm font-semibold text-site-mint">404</p>
        <h1 className="display mt-3 text-[40px] sm:text-[56px]">This door doesn't open.</h1>
        <p className="mt-5 text-lg leading-relaxed text-site-mist">
          The page you're after isn't here. It may have moved, or the link was mistyped. Good instinct to check before you click, though.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="/" className="rounded-full bg-site-violet px-6 py-3 font-semibold text-site-paper hover:bg-site-violet-hi">
            Back to the home page
          </a>
          <a href="/pricing" className="rounded-full border border-site-rule px-6 py-3 font-semibold text-site-paper hover:border-white/40">
            See pricing
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
