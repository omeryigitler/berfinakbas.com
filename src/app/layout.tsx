import type { Metadata, Viewport } from "next";

import { publicSiteUrl } from "@/lib/site-url";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: publicSiteUrl,
  alternates: { canonical: "/" },
  description:
    "Berfin Akbaş için bilgilendirici Dil ve Konuşma Terapisti portfolyosu ve kontrollü randevu talep sistemi.",
  openGraph: {
    description: "Çocuklar, ergenler ve yetişkinler için bilgilendirici dil ve konuşma terapisi ve kontrollü randevu talebi.",
    locale: "tr_TR",
    siteName: "Berfin Akbaş",
    title: "Berfin Akbaş | Dil ve Konuşma Terapisti",
    type: "website",
    url: "/",
  },
  robots: { follow: true, index: true },
  title: "Berfin Akbaş | Dil ve Konuşma Terapisti",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fffaf4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
