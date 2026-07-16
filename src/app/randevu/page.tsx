import type { Metadata } from "next";

import { PublicBookingFlow } from "@/components/booking/public-booking-flow";
import { SiteFooter, SiteHeader } from "@/components/public-shell";
import { getServerEnvironment } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/randevu" },
  description: "Uygun saat seçimi ve kontrollü randevu talebi akışı.",
  title: "Randevu Talebi | Berfin Akbaş",
};

export default function BookingPage() {
  const environment = getServerEnvironment();
  const initiallyEnabled =
    environment.PUBLIC_BOOKING_FLOW_ENABLED &&
    environment.PUBLIC_APPOINTMENT_SLOTS_ENABLED &&
    environment.PUBLIC_APPOINTMENT_HOLDS_ENABLED &&
    environment.PUBLIC_APPOINTMENT_REQUESTS_ENABLED &&
    Boolean(environment.BOOKING_PUBLIC_PRACTITIONER_ID) &&
    environment.BOOKING_HOLD_DURATION_MINUTES !== undefined;

  return (
    <main className="inner-page">
      <SiteHeader />
      <PublicBookingFlow initiallyEnabled={initiallyEnabled} />
      <SiteFooter />
    </main>
  );
}
