"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./admin-shell.module.css";

export type AdminNavPermissions = {
  appointmentsRead: boolean;
  clientsRead: boolean;
  financeRead: boolean;
  servicesRead: boolean;
  technicalHealthRead: boolean;
};

export type AdminNavItem = {
  href: Route;
  label: string;
};

export function getAdminNavItems(permissions: AdminNavPermissions): AdminNavItem[] {
  const items: AdminNavItem[] = [];

  if (permissions.servicesRead) {
    items.push({ href: "/yonetim", label: "Hizmetler" });
  }

  if (permissions.clientsRead) {
    items.push({ href: "/yonetim/danisanlar", label: "Danışanlar" });
  }

  if (permissions.appointmentsRead) {
    items.push({ href: "/yonetim/randevular", label: "Randevular" });
  }

  if (permissions.financeRead) {
    items.push({ href: "/yonetim/odemeler", label: "Ödeme ve planlar" });
  }

  if (permissions.technicalHealthRead) {
    items.push({ href: "/yonetim/saglik", label: "Entegrasyon sağlığı" });
  }

  return items;
}

function isActivePath(pathname: string, href: Route): boolean {
  if (href === "/yonetim") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  email,
  title,
  subtitle,
  permissions,
}: {
  children: ReactNode;
  email?: string | null;
  title: string;
  subtitle?: string;
  permissions: AdminNavPermissions;
}) {
  const pathname = usePathname();
  const navigationItems = getAdminNavItems(permissions);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <p className="section-kicker">Berfin Akbaş · Yönetim</p>
          <h1>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.email}>{email}</span>
        </div>
      </header>

      {navigationItems.length > 0 ? (
        <nav className={styles.nav} aria-label="Yönetim menüsü">
          {navigationItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            return (
              <Link
                className={`${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <section className={styles.content}>{children}</section>
    </main>
  );
}
