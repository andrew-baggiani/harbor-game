import { createMiddleware, createStart } from "@tanstack/react-start";

/**
 * Security headers on every response the Worker renders (pages and API). Static files get theirs from
 * public/_headers. No script-source policy yet: these directives only lock down framing, plugins, base
 * URLs and where forms may post, so nothing on the site can break.
 */
const HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), usb=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy":
    "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
};

const securityHeaders = createMiddleware({ type: "request" }).server(async ({ next }) => {
  const result = await next();
  let response = result.response;
  try {
    for (const [k, v] of Object.entries(HEADERS)) if (!response.headers.has(k)) response.headers.set(k, v);
  } catch {
    // Immutable headers (a proxied response): copy it so they can be added.
    response = new Response(response.body, response);
    for (const [k, v] of Object.entries(HEADERS)) if (!response.headers.has(k)) response.headers.set(k, v);
  }
  return { ...result, response };
});

export const startInstance = createStart(() => ({ requestMiddleware: [securityHeaders] }));
