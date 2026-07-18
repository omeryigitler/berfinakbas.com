import { NextResponse } from "next/server";

import { auth } from "@/auth";

export const proxy = auth((request) => {
  if (request.nextUrl.pathname === "/yonetim" && request.nextUrl.search === "") {
    return NextResponse.redirect(new URL("/yonetim/baslangic", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/yonetim/:path*"],
};
