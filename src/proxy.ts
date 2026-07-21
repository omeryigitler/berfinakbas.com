import { NextResponse } from "next/server";

import { auth } from "@/auth";

// Auth.js wraps the Next.js proxy handler at runtime; its current beta type overload
// does not model the proxy export signature used by Next.js 16.
// @ts-ignore -- runtime-compatible Auth.js proxy wrapper
export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname === "/yonetim" || pathname === "/yonetim/") {
    return NextResponse.rewrite(new URL("/yonetim-static/index.html", request.url));
  }

  if (pathname.startsWith("/yonetim/assets/")) {
    const assetPath = pathname.slice("/yonetim/assets/".length);
    return NextResponse.rewrite(new URL(`/yonetim-static/assets/${assetPath}`, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/yonetim/:path*"],
};
