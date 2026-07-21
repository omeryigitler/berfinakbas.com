import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/yonetim" || pathname === "/yonetim/") {
    return NextResponse.rewrite(new URL("/yonetim-static/index.html", request.url));
  }

  if (pathname.startsWith("/yonetim/assets/")) {
    const assetPath = pathname.slice("/yonetim/assets/".length);
    return NextResponse.rewrite(new URL(`/yonetim-static/assets/${assetPath}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/yonetim/:path*"],
};
