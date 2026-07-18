"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import interactionStyles from "./hub-reference-interactions.module.css";
import toolbarStyles from "./hub-utility-toolbar.module.css";

type ToolbarIconName =
  | "calendar"
  | "credit-card"
  | "file-down"
  | "refresh"
  | "search"
  | "user-plus";

function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    focusable: false,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7.5" />
        <path d="m20.5 20.5-4.15-4.15" />
      </svg>
    );
  }

  if (name === "user-plus") {
    return (
      <svg {...common}>
        <path d="M15 20v-1.4A4.6 4.6 0 0 0 10.4 14H6.6A4.6 4.6 0 0 0 2 18.6V20" />
        <circle cx="8.5" cy="7" r="3.5" />
        <path d="M18.5 8v6M21.5 11h-6" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M7 2.5v3M17 2.5v3M3.5 8.5h11" />
        <path d="M13.5 21H6a2.5 2.5 0 0 1-2.5-2.5V6.8A2.3 2.3 0 0 1 5.8 4.5h12.4a2.3 2.3 0 0 1 2.3 2.3V12" />
        <circle cx="17.5" cy="17.5" r="4" />
        <path d="M17.5 15.5v2.2l1.5.9" />
      </svg>
    );
  }

  if (name === "credit-card") {
    return (
      <svg {...common}>
        <rect height="14" rx="2.5" width="19" x="2.5" y="5" />
        <path d="M2.5 9.5h19M6 15h3" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 6v5h-5" />
        <path d="M18.2 15.5A7.5 7.5 0 1 1 19.8 9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14.5 2.5H6A2.5 2.5 0 0 0 3.5 5v14A2.5 2.5 0 0 0 6 21.5h12A2.5 2.5 0 0 0 20.5 19V8.5Z" />
      <path d="M14.5 2.5v6h6M12 12v6M9.5 15.5 12 18l2.5-2.5" />
    </svg>
  );
}

function findRibbonActions(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[aria-label="Çalışma alanı"] > div:first-child > div',
  );
}

function findToolbarTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-admin-refresh="shell"] [data-admin-region="workspace"]',
  );
}

export function HubUtilityToolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [ribbonTarget, setRibbonTarget] = useState<HTMLElement | null>(null);
  const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const desktop = window.matchMedia("(min-width: 901px)");

    const synchronizeViewport = () => {
      if (desktop.matches) {
        window.scrollTo(0, 0);
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        body.style.overscrollBehavior = "none";
      } else {
        html.style.overflow = previousHtmlOverflow;
        body.style.overflow = previousBodyOverflow;
        body.style.overscrollBehavior = previousBodyOverscroll;
      }
    };

    synchronizeViewport();
    desktop.addEventListener("change", synchronizeViewport);
    return () => {
      desktop.removeEventListener("change", synchronizeViewport);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    const synchronizeTargets = () => {
      setRibbonTarget(findRibbonActions());
      setToolbarTarget(findToolbarTarget());
    };

    let frame = window.requestAnimationFrame(synchronizeTargets);
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(synchronizeTargets);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, searchKey]);

  const focusSearch = () => {
    const input = document.querySelector<HTMLInputElement>(".hub-search input");
    input?.focus();
    input?.select();
  };

  const focusProcess = () => {
    const activeWork = document.querySelector<HTMLElement>(
      '[aria-label="Çalışma alanı"] header:has(h2) + div > section:nth-child(2) > article:first-child',
    );
    activeWork?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const printWorkspace = () => window.print();

  const toolbar = (
    <nav className={toolbarStyles.utilityToolbar} aria-label="Hub hızlı araçları">
      <button
        aria-label="Kayıtlarda ara"
        className={toolbarStyles.utilityAction}
        data-tooltip="Ara"
        onClick={focusSearch}
        type="button"
      >
        <ToolbarIcon name="search" />
      </button>
      <Link
        aria-label="Yeni danışan"
        className={toolbarStyles.utilityAction}
        data-tooltip="Yeni danışan"
        href={"/yonetim/danisan-olustur" as Route}
      >
        <ToolbarIcon name="user-plus" />
      </Link>
      <Link
        aria-label="Müsaitlik yönetimi"
        className={toolbarStyles.utilityAction}
        data-tooltip="Müsaitlik"
        href={"/yonetim/musaitlik" as Route}
      >
        <ToolbarIcon name="calendar" />
      </Link>
      <Link
        aria-label="Ödeme ve planlar"
        className={toolbarStyles.utilityAction}
        data-tooltip="Ödemeler"
        href={"/yonetim/odemeler" as Route}
      >
        <ToolbarIcon name="credit-card" />
      </Link>
      <button
        aria-label="Verileri yenile"
        className={toolbarStyles.utilityAction}
        data-tooltip="Yenile"
        onClick={() => router.refresh()}
        type="button"
      >
        <ToolbarIcon name="refresh" />
      </button>
      <button
        aria-label="Yazdır veya PDF kaydet"
        className={toolbarStyles.utilityAction}
        data-tooltip="PDF"
        onClick={printWorkspace}
        type="button"
      >
        <ToolbarIcon name="file-down" />
      </button>
    </nav>
  );

  return (
    <>
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : null}

      {ribbonTarget
        ? createPortal(
            <>
              <Link
                className={interactionStyles.supplementalPill}
                data-priority="first"
                href={"/yonetim/danisan-olustur" as Route}
              >
                Yeni danışan
              </Link>
              <button
                className={interactionStyles.supplementalPill}
                onClick={focusProcess}
                type="button"
              >
                Süreç
              </button>
              <button
                className={interactionStyles.supplementalPill}
                onClick={printWorkspace}
                type="button"
              >
                PDF
              </button>
            </>,
            ribbonTarget,
          )
        : null}
    </>
  );
}
