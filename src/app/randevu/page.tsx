import type { Metadata } from "next";

import { PublicBookingFlow } from "@/components/booking/public-booking-flow";
import { SiteFooter, SiteHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/randevu" },
  description: "Uygun saat seçimi ve kontrollü randevu talebi akışı.",
  title: "Randevu Talebi | Berfin Akbaş",
};

export default function BookingPage() {
  return (
    <main className="inner-page">
      <SiteHeader />
      <PublicBookingFlow />
      <SiteFooter />
    </main>
  );
}
