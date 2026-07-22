"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BrandAdminShortcut() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;

    const handleBrandClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".brand-mark")) return;

      event.preventDefault();
      if (event.detail >= 3) {
        router.push("/yonetim");
      }
    };

    document.addEventListener("click", handleBrandClick, true);
    return () => document.removeEventListener("click", handleBrandClick, true);
  }, [pathname, router]);

  return null;
}
