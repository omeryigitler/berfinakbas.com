import { NextResponse } from "next/server";

import { auth } from "@/auth";

export const proxy = auth(() => NextResponse.next());

export const config = {
  matcher: ["/yonetim/:path*"],
};
