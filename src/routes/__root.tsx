import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { Shell } from "@/components/shell";
import { NotFound } from "@/site/NotFound";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dry Run Cyber" },
      {
        name: "description",
        content:
          "Security awareness training your team plays: a first-person night shift where every decision is recorded against NIST, CMMC, HIPAA and CIS controls. Built for MSPs.",
      },
      { name: "theme-color", content: "#101319" },
      { property: "og:site_name", content: "Dry Run Cyber" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://dryruncyber.com/og.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://dryruncyber.com/og.jpg" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  notFoundComponent: NotFound,
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Shell>
            <Outlet />
          </Shell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
