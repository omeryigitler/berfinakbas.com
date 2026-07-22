"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BrandAdminShortcut() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const handleBrandClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const brandMark = target.closest(".brand-mark");
      if (!brandMark?.closest('header[aria-label="Ana menü"]')) return;

      event.preventDefault();
      if (event.detail >= 3) {
        window.location.assign("/yonetim");
      }
    };

    document.addEventListener("click", handleBrandClick, true);
    return () => document.removeEventListener("click", handleBrandClick, true);
  }, [pathname]);

  return null;
}
