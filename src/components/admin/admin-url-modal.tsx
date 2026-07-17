"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import styles from "./admin-url-modal.module.css";

type AdminUrlModalProps = {
  closeHref: Route;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function AdminUrlModal({
  closeHref,
  eyebrow = "Yönetim işlemi",
  title,
  description,
  children,
  footer,
}: AdminUrlModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    (focusable[0] ?? dialog).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.replace(closeHref, { scroll: false });
        return;
      }
      if (event.key !== "Tab") return;

      const candidates = Array.from(
        dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
      if (candidates.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = candidates[0];
      const last = candidates.at(-1) ?? first;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [closeHref, router]);

  return (
    <div className={styles.root} role="presentation">
      <Link
        aria-hidden="true"
        className={styles.backdrop}
        href={closeHref}
        scroll={false}
        tabIndex={-1}
      />
      <div className={styles.stage}>
        <section
          aria-describedby={description ? descriptionId : undefined}
          aria-labelledby={titleId}
          aria-modal="true"
          className={styles.dialog}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <span className={styles.cornerGlow} aria-hidden="true" />
          <span className={styles.cornerPlate} aria-hidden="true" />
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>{eyebrow}</span>
              <h2 id={titleId}>{title}</h2>
              {description ? <p id={descriptionId}>{description}</p> : null}
            </div>
            <Link
              aria-label="Kapat"
              className={styles.closeButton}
              href={closeHref}
              scroll={false}
            >
              ×
            </Link>
          </header>
          <div className={styles.body}>{children}</div>
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </section>
      </div>
    </div>
  );
}

export function ModalFieldPreview({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className={styles.fieldPreview}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

export function ModalOptionGrid({
  items,
}: {
  items: { label: string; description: string; icon: string }[];
}) {
  return (
    <div className={styles.optionGrid}>
      {items.map((item) => (
        <article className={styles.optionCard} key={item.label}>
          <span>{item.icon}</span>
          <strong>{item.label}</strong>
          <small>{item.description}</small>
        </article>
      ))}
    </div>
  );
}
