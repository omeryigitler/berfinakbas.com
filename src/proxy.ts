import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/giris", request.url));
  }

  const { pathname } = request.nextUrl;
  const rewriteTo = (targetPathname: string) => {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = targetPathname;
    return NextResponse.rewrite(targetUrl);
  };

  if (pathname === "/yonetim" || pathname === "/yonetim/") {
    return rewriteTo("/yonetim-static/index.html");
  }

  if (pathname.startsWith("/yonetim/assets/")) {
    const assetPath = pathname.slice("/yonetim/assets/".length);
    return rewriteTo(`/yonetim-static/assets/${assetPath}`);
  }

  if (pathname === "/yonetim/kedi" || pathname === "/yonetim/kedi/") {
    return rewriteTo("/yonetim-static/kedi/index.html");
  }

  if (pathname.startsWith("/yonetim/kedi/")) {
    const kediPath = pathname.slice("/yonetim/kedi/".length);
    return rewriteTo(`/yonetim-static/kedi/${kediPath}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/yonetim/:path*"],
};
