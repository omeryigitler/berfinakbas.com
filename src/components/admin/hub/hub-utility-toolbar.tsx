"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./hub-reference-interactions.module.css";

function findRibbonActions(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[aria-label="Çalışma alanı"] > div:first-child > div',
  );
}

export function HubUtilityToolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [ribbonTarget, setRibbonTarget] = useState<HTMLElement | null>(null);

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
    let frame = window.requestAnimationFrame(() => setRibbonTarget(findRibbonActions()));
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setRibbonTarget(findRibbonActions()));
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

  return (
    <>
      <nav className={styles.utilityToolbar} aria-label="Hub hızlı araçları">
        <button
          aria-label="Kayıtlarda ara"
          className={styles.utilityAction}
          onClick={focusSearch}
          title="Kayıtlarda ara"
          type="button"
        >
          ⌕
        </button>
        <Link
          aria-label="Yeni danışan"
          className={styles.utilityAction}
          href={"/yonetim/danisan-olustur" as Route}
          title="Yeni danışan"
        >
          +
        </Link>
        <Link
          aria-label="Müsaitlik yönetimi"
          className={styles.utilityAction}
          href={"/yonetim/musaitlik" as Route}
          title="Müsaitlik yönetimi"
        >
          ◷
        </Link>
        <Link
          aria-label="Ödeme ve planlar"
          className={styles.utilityAction}
          href={"/yonetim/odemeler" as Route}
          title="Ödeme ve planlar"
        >
          ₺
        </Link>
        <button
          aria-label="Verileri yenile"
          className={styles.utilityAction}
          onClick={() => router.refresh()}
          title="Verileri yenile"
          type="button"
        >
          ↻
        </button>
        <button
          aria-label="Yazdır veya PDF kaydet"
          className={styles.utilityAction}
          onClick={printWorkspace}
          title="Yazdır veya PDF kaydet"
          type="button"
        >
          ▣
        </button>
      </nav>

      {ribbonTarget
        ? createPortal(
            <>
              <Link
                className={styles.supplementalPill}
                data-priority="first"
                href={"/yonetim/danisan-olustur" as Route}
              >
                Yeni danışan
              </Link>
              <button
                className={styles.supplementalPill}
                onClick={focusProcess}
                type="button"
              >
                Süreç
              </button>
              <button
                className={styles.supplementalPill}
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
