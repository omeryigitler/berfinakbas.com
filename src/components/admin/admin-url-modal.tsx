import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./admin-url-modal.module.css";

type AdminUrlModalProps = {
  closeHref: Route;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminUrlModal({
  closeHref,
  eyebrow = "URL tabanli islem",
  title,
  description,
  children,
  footer,
}: AdminUrlModalProps) {
  return (
    <div className={styles.root} role="presentation">
      <Link aria-label="Close" className={styles.backdrop} href={closeHref} scroll={false} />
      <div className={styles.stage}>
        <section aria-modal="true" className={styles.dialog} role="dialog">
          <span className={styles.cornerGlow} aria-hidden="true" />
          <span className={styles.cornerPlate} aria-hidden="true" />
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>{eyebrow}</span>
              <h2>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>
            <Link
              aria-label="Close"
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
