import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function proxy(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  const pathname = new URL(request.url).pathname;

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
