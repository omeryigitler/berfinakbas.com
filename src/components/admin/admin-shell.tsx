"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  id: "calisma" | "danisanlar" | "finans" | "randevular" | "sistem" | "site";
  icon: string;
  items: AdminNavItem[];
  label: string;
};

type WorkspaceEntry = {
  button: HTMLButtonElement;
  elements: HTMLElement[];
  id: string;
};

const siteWorkspaceSections = new Set(["hizmet-terapist-ayarlari", "public-iletisim-ayarlari"]);

export function getAdminNavItems(permissions: AdminNavPermissions): AdminNavItem[] {
  const items: AdminNavItem[] = [];
  if (permissions.servicesRead) {
    items.push({ href: "/yonetim", icon: "⌂", label: "Genel bakış" });
  }
  if (permissions.appointmentsRead) {
    items.push({ href: "/yonetim/hub", icon: "▦", label: "Kayıt merkezi" });
    items.push({ href: "/yonetim/randevular", icon: "◷", label: "Randevu operasyonu" });
  }
  if (permissions.clientsRead === true) {
    items.push({ href: "/yonetim/danisanlar", icon: "◌", label: "Danışan kayıtları" });
    items.push({ href: "/yonetim/danisan-olustur", icon: "+", label: "Yeni danışan" });
  }
  if (permissions.servicesRead) {
    items.push({ href: "/yonetim/musaitlik", icon: "▤", label: "Müsaitlik" });
  }
  if (permissions.financeRead) {
    items.push({ href: "/yonetim/odemeler", icon: "₺", label: "Ödeme ve planlar" });
  }
  if (permissions.technicalHealthRead) {
    items.push({ href: "/yonetim/saglik", icon: "◇", label: "Sistem sağlığı" });
  }
  return items;
}

function getAdminNavGroups(permissions: AdminNavPermissions): AdminNavGroup[] {
  const groups: AdminNavGroup[] = [];

  if (permissions.servicesRead) {
    groups.push({
      id: "calisma",
      icon: "⌂",
      items: [{ href: "/yonetim", icon: "⌂", label: "Genel bakış" }],
      label: "Çalışma Alanım",
    });
  }

  if (permissions.appointmentsRead || permissions.servicesRead) {
    const items: AdminNavItem[] = [];
    if (permissions.appointmentsRead) {
      items.push({ href: "/yonetim/hub", icon: "▦", label: "Talep kuyruğu" });
      items.push({ href: "/yonetim/randevular", icon: "◷", label: "Randevu operasyonu" });
    }
    if (permissions.servicesRead) {
      if (permissions.appointmentsRead) {
        items.push({
          href: "/yonetim/hub?bolum=musaitlik" as Route,
          icon: "◫",
          label: "Müsaitlik özeti",
        });
      }
      items.push({ href: "/yonetim/musaitlik", icon: "▤", label: "Müsaitlik yönetimi" });
    }
    groups.push({ id: "randevular", icon: "◷", items, label: "Randevular" });
  }

  if (permissions.clientsRead === true) {
    const items: AdminNavItem[] = [];
    if (permissions.appointmentsRead) {
      items.push({
        href: "/yonetim/hub?bolum=danisanlar" as Route,
        icon: "▦",
        label: "Danışan kayıt merkezi",
      });
    }
    items.push({ href: "/yonetim/danisanlar", icon: "◌", label: "Danışan yönetimi" });
    items.push({ href: "/yonetim/danisan-olustur", icon: "+", label: "Yeni danışan" });
    groups.push({ id: "danisanlar", icon: "◌", items, label: "Danışanlar" });
  }

  if (permissions.financeRead) {
    const items: AdminNavItem[] = [];
    if (permissions.appointmentsRead) {
      items.push({
        href: "/yonetim/hub?bolum=odemeler" as Route,
        icon: "▦",
        label: "Ödeme özeti",
      });
    }
    items.push({ href: "/yonetim/odemeler", icon: "₺", label: "Ödeme ve planlar" });
    groups.push({ id: "finans", icon: "₺", items, label: "Finans" });
  }

  if (permissions.servicesRead) {
    groups.push({
      id: "site",
      icon: "⚙",
      items: [
        {
          href: "/yonetim?alan=public-iletisim-ayarlari" as Route,
          icon: "⌁",
          label: "İletişim ayarları",
        },
        {
          href: "/yonetim?alan=hizmet-terapist-ayarlari" as Route,
          icon: "⚙",
          label: "Hizmet ve terapist",
        },
      ],
      label: "Site Yönetimi",
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

function isActivePath(
  pathname: string,
  href: Route,
  activeWorkspaceSection: string,
  activeHubSection: string,
): boolean {
  const [hrefPath, hrefQuery = ""] = String(href).split("?");
  const targetParams = new URLSearchParams(hrefQuery);
  const targetWorkspaceSection = targetParams.get("alan") ?? "";
  const targetHubSection = targetParams.get("bolum") ?? "";

  if (targetWorkspaceSection) {
    return pathname === hrefPath && activeWorkspaceSection === targetWorkspaceSection;
  }
  if (targetHubSection) {
    return pathname === hrefPath && activeHubSection === targetHubSection;
  }
  if (hrefPath === "/yonetim") {
    return pathname === hrefPath && !siteWorkspaceSections.has(activeWorkspaceSection);
  }
  if (hrefPath === "/yonetim/hub") {
    return pathname === hrefPath && activeHubSection === "";
  }
  if (hrefPath === "/yonetim/danisanlar" && pathname.startsWith("/yonetim/danisan-profili")) {
    return true;
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
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

function getWorkspacePanels(content: HTMLElement): HTMLElement[] {
  return Array.from(content.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.classList.contains("admin-panel"),
  );
}

function getPanelHeading(panel: HTMLElement): HTMLElement | null {
  return panel.querySelector<HTMLElement>(".admin-panel-heading h2, h2[id], h2");
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
  const contentRef = useRef<HTMLElement>(null);
  const workspaceNavRef = useRef<HTMLElement>(null);
  const navigationGroups = useMemo(() => getAdminNavGroups(permissions), [permissions]);
  const navigationItems = useMemo(
    () => navigationGroups.flatMap((group) => group.items),
    [navigationGroups],
  );
  const homeHref = navigationItems[0]?.href ?? ("/yonetim/baslangic" as Route);
  const activeWorkspaceSection = searchParams.get("alan") ?? "";
  const activeHubSection = searchParams.get("bolum") ?? "";
  const activeGroupId =
    navigationGroups.find((group) =>
      group.items.some((item) =>
        isActivePath(pathname, item.href, activeWorkspaceSection, activeHubSection),
      ),
    )?.id ??
    navigationGroups[0]?.id ??
    "calisma";
  const [openGroup, setOpenGroup] = useState<string>(activeGroupId);
  const [lastActiveGroupId, setLastActiveGroupId] = useState(activeGroupId);
  const focusMode = searchParams.get("gorunum") === "tam";
  const searchKey = searchParams.toString();

  if (lastActiveGroupId !== activeGroupId) {
    setLastActiveGroupId(activeGroupId);
    setOpenGroup(activeGroupId);
  }

  const setFocusMode = useCallback(
    (enabled: boolean) => {
      const params = new URLSearchParams(searchKey);
      if (enabled) params.set("gorunum", "tam");
      else params.delete("gorunum");
      const query = params.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    },
    [pathname, router, searchKey],
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

  useEffect(() => {
    const content = contentRef.current;
    const navigation = workspaceNavRef.current;
    if (!content || !navigation) return;

    const directChildren = Array.from(content.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const panels = getWorkspacePanels(content);
    navigation.replaceChildren();
    navigation.hidden = true;
    directChildren.forEach((element) => {
      element.hidden = false;
      element.removeAttribute("data-admin-workspace-panel");
    });

    const requestedSection = new URLSearchParams(searchKey).get("alan") ?? "";
    const tabList = document.createElement("div");
    tabList.dataset.adminRegion = "workspace-tab-list";
    const label = document.createElement("span");
    label.dataset.adminRegion = "workspace-tab-label";
    label.textContent = "Çalışma bölümü";
    const entries: WorkspaceEntry[] = [];

    if (pathname === "/yonetim") {
      const overviewElements = directChildren.filter((element) => !panels.includes(element));
      if (overviewElements.length > 0) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.adminRegion = "workspace-tab";
        button.textContent = "Genel bakış";
        button.setAttribute("aria-pressed", "false");
        tabList.append(button);
        entries.push({ button, elements: overviewElements, id: "genel-bakis" });
      }
    }

    panels.forEach((panel, index) => {
      const heading = getPanelHeading(panel);
      const sectionId = heading?.id || `bolum-${index + 1}`;
      const panelId = panel.id || `calisma-paneli-${sectionId}`;
      const button = document.createElement("button");

      if (heading && !heading.id) heading.id = sectionId;
      panel.id = panelId;
      panel.dataset.adminWorkspacePanel = sectionId;
      panel.setAttribute("role", "region");
      if (heading?.id) panel.setAttribute("aria-labelledby", heading.id);

      button.type = "button";
      button.dataset.adminRegion = "workspace-tab";
      button.textContent = heading?.textContent?.trim() || `Bölüm ${index + 1}`;
      button.setAttribute("aria-controls", panelId);
      button.setAttribute("aria-pressed", "false");
      tabList.append(button);
      entries.push({ button, elements: [panel], id: sectionId });
    });

    if (entries.length < 2) return;

    function activate(sectionId: string, updateUrl: boolean) {
      const selected = entries.find((entry) => entry.id === sectionId) ?? entries[0];
      entries.forEach((entry) => {
        const isActive = entry === selected;
        entry.elements.forEach((element) => {
          element.hidden = !isActive;
        });
        entry.button.dataset.adminActive = isActive ? "true" : "false";
        entry.button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      if (!updateUrl || !selected) return;
      const params = new URLSearchParams(window.location.search);
      if (selected.id === "genel-bakis") params.delete("alan");
      else params.set("alan", selected.id);
      const query = params.toString();
      router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
    }

    entries.forEach((entry) => {
      entry.button.addEventListener("click", () => activate(entry.id, true));
    });

    navigation.append(label, tabList);
    navigation.hidden = false;
    const defaultSection = pathname === "/yonetim" ? "genel-bakis" : entries[0]?.id;
    activate(
      entries.some((entry) => entry.id === requestedSection)
        ? requestedSection
        : (defaultSection ?? entries[0]?.id ?? ""),
      false,
    );

    return () => {
      directChildren.forEach((element) => {
        element.hidden = false;
        element.removeAttribute("data-admin-workspace-panel");
        element.removeAttribute("role");
        element.removeAttribute("aria-labelledby");
      });
      navigation.replaceChildren();
      navigation.hidden = true;
    };
  }, [pathname, router, searchKey]);

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
              const containsActive = group.items.some((item) =>
                isActivePath(pathname, item.href, activeWorkspaceSection, activeHubSection),
              );
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
                    <span
                      className={styles.navIcon}
                      data-admin-region="nav-icon"
                      aria-hidden="true"
                    >
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
                        const isActive = isActivePath(
                          pathname,
                          item.href,
                          activeWorkspaceSection,
                          activeHubSection,
                        );
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

        <div className={styles.sidebarFooter} data-admin-region="sidebar-footer">
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
          <Link className={styles.siteLink} href="/" target="_blank">
            Siteyi aç ↗
          </Link>
        </div>
      </aside>

      <section className={styles.workspace} data-admin-region="workspace">
        <div data-admin-region="scroll-area">
          <div className={styles.srOnly}>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <nav
            aria-label="Sayfa çalışma bölümleri"
            data-admin-region="workspace-tabs"
            hidden
            ref={workspaceNavRef}
          />

          <section className={styles.content} data-admin-region="content" ref={contentRef}>
            {children}
          </section>
        </div>
      </section>
    </main>
  );
}
