"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import "./admin-dashboard-refresh.module.css";
import styles from "./admin-shell.module.css";
import "./admin-icon-placement.module.css";

export type AdminNavPermissions = {
  appointmentsRead: boolean;
  clientsRead?: boolean;
  financeRead: boolean;
  servicesRead: boolean;
  technicalHealthRead: boolean;
};

export type AdminNavItem = {
  href: Route;
  icon: string;
  label: string;
};

export function getAdminNavItems(permissions: AdminNavPermissions): AdminNavItem[] {
  const items: AdminNavItem[] = [];

  if (permissions.servicesRead) {
    items.push({ href: "/yonetim", icon: "⌘", label: "Dashboard" });
  }

  if (permissions.clientsRead === true) {
    items.push({ href: "/yonetim/danisanlar", icon: "◌", label: "Danışanlar" });
  }

  if (permissions.appointmentsRead) {
    items.push({ href: "/yonetim/randevular", icon: "◷", label: "Randevular" });
  }

  if (permissions.financeRead) {
    items.push({ href: "/yonetim/odemeler", icon: "₺", label: "Ödeme ve planlar" });
  }

  if (permissions.technicalHealthRead) {
    items.push({ href: "/yonetim/saglik", icon: "◇", label: "Entegrasyon sağlığı" });
  }

  return items;
}

function isActivePath(pathname: string, href: Route): boolean {
  if (href === "/yonetim") return pathname === href;
  if (href === "/yonetim/danisanlar" && pathname.startsWith("/yonetim/danisan-profili")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(email?: string | null): string {
  if (!email) return "BA";
  const [name] = email.split("@");
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("") || "BA";
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
    <main className={styles.shell} data-admin-refresh="shell">
      <aside className={styles.sidebar} data-admin-region="sidebar" aria-label="Yönetim alanı">
        <Link className={styles.brand} data-admin-region="brand" href="/yonetim">
          <span className={styles.brandMark} data-admin-region="brand-mark">BA</span>
          <span>
            <strong>Berfin Akbaş</strong>
            <small>Yönetim paneli</small>
          </span>
        </Link>

        {navigationItems.length > 0 ? (
          <nav className={styles.nav} data-admin-region="nav" aria-label="Yönetim menüsü">
            <span className={styles.navSection} data-admin-region="nav-section">MENÜ</span>
            {navigationItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              const className = `${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ""}`;
              return (
                <Link
                  className={className}
                  data-admin-active={isActive ? "true" : undefined}
                  data-admin-region="nav-link"
                  href={item.href}
                  key={item.href}
                >
                  <span className={styles.navIcon} data-admin-region="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className={styles.sidebarNote} data-admin-region="sidebar-note">
          <strong>BO düzeni</strong>
          <span>Danışan, randevu ve ödeme işlemleri tek yönetim panelinde takip edilir.</span>
        </div>
      </aside>

      <section className={styles.workspace} data-admin-region="workspace">
        <header className={styles.topbar} data-admin-region="topbar">
          <form className={styles.searchForm} data-admin-region="search" action="/yonetim/danisanlar">
            <span aria-hidden="true">⌕</span>
            <input name="q" placeholder="Danışan, telefon veya e-posta ara" type="search" />
            <kbd>Enter</kbd>
          </form>

          <div className={styles.headerMeta} data-admin-region="header-meta">
            <div className={styles.profilePill} data-admin-region="profile-pill">
              <span>{getInitials(email)}</span>
              <div>
                <strong>Yönetici</strong>
                <small>{email}</small>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.titleRow} data-admin-region="title-row">
          <div className={styles.titleGroup} data-admin-region="title-group">
            <p className="section-kicker">Berfin Akbaş · Yönetim</p>
            <h1>{title}</h1>
            {subtitle ? <p className={styles.subtitle} data-admin-region="subtitle">{subtitle}</p> : null}
          </div>
        </div>

        <section className={styles.content} data-admin-region="content">{children}</section>
      </section>
    </main>
  );
}
