import type { Metadata } from "next";

import { PublicBookingFlow } from "@/components/booking/public-booking-flow";
import { SiteFooter, SiteHeader } from "@/components/public-shell";
import { resolvePublicBookingRuntime } from "@/lib/booking/public-booking-runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/randevu" },
  description: "Uygun saat seçimi ve kontrollü randevu talebi akışı.",
  title: "Randevu Talebi | Berfin Akbaş",
};

export default async function BookingPage() {
  const runtime = await resolvePublicBookingRuntime();

  return (
    <main className="inner-page">
      <SiteHeader />
      <PublicBookingFlow initiallyEnabled={runtime.enabled && Boolean(runtime.practitionerId)} />
      <SiteFooter />
    </main>
  );
}
