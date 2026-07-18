"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./overview.module.css";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      {children}
    </svg>
  );
}

const strokeProps = {
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function OverviewToolbar() {
  const router = useRouter();

  return (
    <nav aria-label="Genel bakış araçları" className={styles.toolbar}>
      <Link
        aria-label="Ara"
        className={styles.toolButton}
        data-tooltip="Ara"
        href={"/yonetim/hub" as Route}
      >
        <Icon>
          <circle cx="11" cy="11" r="6.5" {...strokeProps} />
          <path d="m16 16 4 4" {...strokeProps} />
        </Icon>
      </Link>
      <Link
        aria-label="Yeni danışan"
        className={styles.toolButton}
        data-tooltip="Yeni danışan"
        href={"/yonetim/danisan-olustur" as Route}
      >
        <Icon>
          <circle cx="9" cy="8" r="3" {...strokeProps} />
          <path d="M3.8 19c.6-3.4 2.4-5.1 5.2-5.1s4.6 1.7 5.2 5.1M18 7v6M15 10h6" {...strokeProps} />
        </Icon>
      </Link>
      <Link
        aria-label="Müsaitlik"
        className={styles.toolButton}
        data-tooltip="Müsaitlik"
        href={"/yonetim/musaitlik" as Route}
      >
        <Icon>
          <rect height="14" rx="2.5" width="16" x="4" y="6" {...strokeProps} />
          <path d="M8 3v5M16 3v5M4 10h16" {...strokeProps} />
          <circle cx="15.5" cy="15.5" r="2.2" {...strokeProps} />
        </Icon>
      </Link>
      <Link
        aria-label="Ödemeler"
        className={styles.toolButton}
        data-tooltip="Ödemeler"
        href={"/yonetim/odemeler" as Route}
      >
        <Icon>
          <rect height="13" rx="2.5" width="18" x="3" y="6" {...strokeProps} />
          <path d="M3 10h18M7 15h4" {...strokeProps} />
        </Icon>
      </Link>
      <button
        aria-label="Yenile"
        className={styles.toolButton}
        data-tooltip="Yenile"
        onClick={() => router.refresh()}
        type="button"
      >
        <Icon>
          <path d="M19 8a8 8 0 1 0 .6 7M19 4v4h-4" {...strokeProps} />
        </Icon>
      </button>
      <button
        aria-label="PDF"
        className={styles.toolButton}
        data-tooltip="PDF"
        onClick={() => window.print()}
        type="button"
      >
        <Icon>
          <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 15h4M10 18h4" {...strokeProps} />
        </Icon>
      </button>
    </nav>
  );
}
