import styles from "../sales-hub-dashboard.module.css";
import { navigationGroups } from "./sales-hub-config";
import { SalesHubIcon } from "./sales-hub-icon";

interface SidebarProps {
  collapsed: boolean;
  onNavigate: (route: string) => void;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onNavigate, onToggle }: SidebarProps) {
  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      data-testid="sales-hub-sidebar"
      id="sidebar-container"
    >
      <div className={styles.brandRow}>
        <span className={styles.waffle}>
          <SalesHubIcon name="waffle" size={20} strokeWidth={2} />
        </span>
        <div className={styles.brandText}>
          <strong>Dynamic 365</strong>
          <span className={styles.brandDivider} />
          <span>Sales Hub</span>
        </div>
      </div>

      <div className={styles.navScroll}>
        <div className={styles.menuHeading}>
          <strong>Menu</strong>
          <button
            className={styles.circleButton}
            onClick={onToggle}
            title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            type="button"
          >
            <SalesHubIcon
              name={collapsed ? "arrow-right-from-line" : "arrow-left-from-line"}
              size={16}
              strokeWidth={2}
            />
          </button>
        </div>

        {navigationGroups.map((group) => (
          <section className={styles.navGroup} key={group.title}>
            <span className={styles.navGroupTitle}>{group.title}</span>
            <div className={styles.navItems}>
              {group.items.map((item) => {
                const active = item.id === "danisanlar";
                return (
                  <button
                    aria-disabled={!item.route}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    key={item.id}
                    onClick={() => item.route && onNavigate(item.route)}
                    title={collapsed ? item.label : undefined}
                    type="button"
                  >
                    <span className={styles.navIcon}>
                      <SalesHubIcon name={item.icon} size={16} strokeWidth={active ? 2.5 : 2} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
