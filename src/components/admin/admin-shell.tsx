"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./admin-dashboard-refresh.module.css";
import "./admin-hub-shell-controls.module.css";
import "./dashboard-action-order.module.css";
import "./service-practitioner-symmetry.module.css";
import "./dashboard-config-summary-polish.module.css";
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

type AdminNavGroup = {
  id: "calisma" | "danisanlar" | "finans" | "randevular" | "sistem";
  icon: string;
  items: AdminNavItem[];
  label: string;
};

export function getAdminNavItems(permissions: AdminNavPermissions): AdminNavItem[] {
  return getAdminNavGroups(permissions).flatMap((group) => group.items);
}

function getAdminNavGroups(permissions: AdminNavPermissions): AdminNavGroup[] {
  const groups: AdminNavGroup[] = [];

  const workspaceItems: AdminNavItem[] = [];
  if (permissions.servicesRead) {
    workspaceItems.push({ href: "/yonetim", icon: "⌂", label: "Genel bakış" });
  }
  if (permissions.appointmentsRead) {
    workspaceItems.push({ href: "/yonetim/hub", icon: "▦", label: "Kayıt merkezi" });
  }
  if (workspaceItems.length > 0) {
    groups.push({ id: "calisma", icon: "⌂", items: workspaceItems, label: "Çalışma Alanım" });
  }

  if (permissions.appointmentsRead || permissions.servicesRead) {
    const items: AdminNavItem[] = [];
    if (permissions.appointmentsRead) {
      items.push({ href: "/yonetim/randevular", icon: "◷", label: "Randevu operasyonu" });
    }
    if (permissions.servicesRead) {
      items.push({ href: "/yonetim/musaitlik", icon: "▤", label: "Müsaitlik" });
    }
    groups.push({ id: "randevular", icon: "◷", items, label: "Randevular" });
  }

  if (permissions.clientsRead === true) {
    groups.push({
      id: "danisanlar",
      icon: "◌",
      items: [
        { href: "/yonetim/danisanlar", icon: "◌", label: "Danışan kayıtları" },
        { href: "/yonetim/danisan-olustur", icon: "+", label: "Yeni danışan" },
      ],
      label: "Danışanlar",
    });
  }

  if (permissions.financeRead) {
    groups.push({
      id: "finans",
      icon: "₺",
      items: [{ href: "/yonetim/odemeler", icon: "₺", label: "Ödeme ve planlar" }],
      label: "Finans",
    });
  }

  if (permissions.technicalHealthRead) {
    groups.push({
      id: "sistem",
      icon: "◇",
      items: [{ href: "/yonetim/saglik", icon: "◇", label: "Sistem sağlığı" }],
      label: "Sistem",
    });
  }

  return groups;
}

function isActivePath(pathname: string, href: Route): boolean {
  if (href === "/yonetim") return pathname === href;
  if (href === "/yonetim/danisanlar" && pathname.startsWith("/yonetim/danisan-profili"))
    return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(email?: string | null): string {
  if (!email) return "BA";
  const [name] = email.split("@");
  return (
    name
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
      .join("") || "BA"
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigationGroups = useMemo(() => getAdminNavGroups(permissions), [permissions]);
  const navigationItems = useMemo(
    () => navigationGroups.flatMap((group) => group.items),
    [navigationGroups],
  );
  const homeHref = navigationItems[0]?.href ?? ("/yonetim/baslangic" as Route);
  const activeGroupId =
    navigationGroups.find((group) => group.items.some((item) => isActivePath(pathname, item.href)))
      ?.id ?? navigationGroups[0]?.id ?? "calisma";
  const [openGroup, setOpenGroup] = useState<string>(activeGroupId);
  const focusMode = searchParams.get("gorunum") === "tam";

  useEffect(() => {
    setOpenGroup(activeGroupId);
  }, [activeGroupId]);

  const setFocusMode = useCallback(
    (enabled: boolean) => {
      const params = new URLSearchParams(searchParams);
      if (enabled) params.set("gorunum", "tam");
      else params.delete("gorunum");
      const query = params.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        setFocusMode(!focusMode);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode, setFocusMode]);

  return (
    <main
      className={styles.shell}
      data-admin-focus={focusMode ? "true" : undefined}
      data-admin-refresh="shell"
    >
      <aside className={styles.sidebar} data-admin-region="sidebar" aria-label="Yönetim alanı">
        <Link className={styles.brand} data-admin-region="brand" href={homeHref}>
          <span className={styles.brandMark} data-admin-region="brand-mark">
            <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          </span>
          <span data-admin-region="brand-copy">
            <strong>Berfin Akbaş</strong>
            <small>Yönetim Hub</small>
          </span>
        </Link>

        {navigationGroups.length > 0 ? (
          <nav className={styles.nav} data-admin-region="nav" aria-label="Yönetim menüsü">
            {navigationGroups.map((group) => {
              const isOpen = openGroup === group.id;
              const containsActive = group.items.some((item) => isActivePath(pathname, item.href));
              return (
                <div
                  data-admin-group={group.id}
                  data-admin-group-open={isOpen ? "true" : undefined}
                  key={group.id}
                >
                  <button
                    aria-expanded={isOpen}
                    className={styles.navLink}
                    data-admin-active={containsActive ? "true" : undefined}
                    data-admin-region="nav-group-button"
                    onClick={() => setOpenGroup(isOpen ? "" : group.id)}
                    type="button"
                  >
                    <span className={styles.navIcon} data-admin-region="nav-icon" aria-hidden="true">
                      {group.icon}
                    </span>
                    <span data-admin-region="nav-label">{group.label}</span>
                    <span data-admin-region="nav-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>

                  {isOpen ? (
                    <div data-admin-region="nav-children">
                      {group.items.map((item) => {
                        const isActive = isActivePath(pathname, item.href);
                        const className = `${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ""}`;
                        return (
                          <Link
                            className={className}
                            data-admin-active={isActive ? "true" : undefined}
                            data-admin-region="nav-child"
                            href={item.href}
                            key={item.href}
                          >
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        ) : null}

        <div className={styles.sidebarNote} data-admin-region="sidebar-note">
          <strong>Operasyon merkezi</strong>
          <span>Danışan, randevu, ödeme ve sistem durumunu tek panelden yönetin.</span>
          <Link href="/" target="_blank">
            Siteyi aç ↗
          </Link>
        </div>
      </aside>

      <section className={styles.workspace} data-admin-region="workspace">
        <header className={styles.topbar} data-admin-region="topbar">
          <form
            className={styles.searchForm}
            data-admin-region="search"
            action="/yonetim/danisanlar"
          >
            <span aria-hidden="true">⌕</span>
            <input name="q" placeholder="Danışan, telefon veya e-posta ara" type="search" />
            <kbd>Enter</kbd>
          </form>

          <div className={styles.headerMeta} data-admin-region="header-meta">
            <button
              aria-pressed={focusMode}
              className={styles.iconButton}
              data-admin-active={focusMode ? "true" : undefined}
              data-admin-region="focus-button"
              onClick={() => setFocusMode(!focusMode)}
              type="button"
            >
              {focusMode ? "Panelleri geri aç" : "Tam sayfa çalış"}
            </button>
            <div className={styles.profilePill} data-admin-region="profile-pill">
              <span>{getInitials(email)}</span>
              <div>
                <strong>Yönetici</strong>
                <small>{email}</small>
              </div>
            </div>
          </div>
        </header>

        <div data-admin-region="scroll-area">
          <div className={styles.titleRow} data-admin-region="title-row">
            <div className={styles.titleGroup} data-admin-region="title-group">
              <p className="section-kicker">Berfin Akbaş · Yönetim Hub</p>
              <h1>{title}</h1>
              {subtitle ? (
                <p className={styles.subtitle} data-admin-region="subtitle">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <section className={styles.content} data-admin-region="content">
            {children}
          </section>
        </div>
      </section>
    </main>
  );
}
