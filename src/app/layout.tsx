import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "Berfin Akbaş için bilgilendirici Dil ve Konuşma Terapisti portfolyosu ve kontrollü randevu talep sistemi.",
  robots: {
    follow: false,
    index: false,
  },
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
