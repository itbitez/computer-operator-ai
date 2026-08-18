import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "./lib/config/env";
import { log } from "./lib/logging/logger";

function buildCspHeader(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // React's dev build uses eval to reconstruct server error stacks; production
    // must never allow it. `'unsafe-inline'` for scripts is never added — that
    // would make the CSP decorative (see 01b spec).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev injects CSS in ways that do not carry the nonce; production styles are
    // external or nonce-carrying.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Upgrading a priori-insecure subresources breaks a plain-HTTP dev server;
    // in production nginx already terminates TLS and this closes the gap.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestId = crypto.randomUUID();
  const isDev = env.NODE_ENV === "development";
  const cspHeader = buildCspHeader(nonce, isDev);

  // The CSP header is set on the *request* so Next.js extracts the nonce during
  // server rendering and applies it to its own inline scripts and styles; it is
  // set on the response so the browser enforces it. x-request-id rides both ways
  // for log correlation.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", cspHeader);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", cspHeader);
  response.headers.set("x-request-id", requestId);

  log({
    level: "info",
    method: request.method,
    path: request.nextUrl.pathname,
    requestId,
  });

  return response;
}

export const config = {
  matcher: [
    {
      // Everything except static chunks, image optimization, and the favicon.
      // API routes are included: the requestId and request log are the
      // correlation backbone, and the spec applies the headers to every route.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
