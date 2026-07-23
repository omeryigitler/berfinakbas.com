import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/yonetim/assets/")) {
    const assetPath = pathname.slice("/yonetim/assets/".length);
    return NextResponse.rewrite(new URL(`/yonetim-static/assets/${assetPath}`, request.url));
  }

  if (pathname !== "/yonetim" && pathname !== "/yonetim/") {
    return NextResponse.redirect(new URL("/yonetim", request.url));
  }

  return NextResponse.rewrite(new URL("/yonetim-static/index.html", request.url));
}

export const config = {
  matcher: ["/yonetim/:path*"],
};
