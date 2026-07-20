import { navigationGroups } from './sales-hub-config';
import { SalesHubIcon } from './sales-hub-icon';
import styles from '../sales-hub-dashboard.module.css';

interface SidebarProps {
  collapsed: boolean;
  onNavigate: (route: string) => void;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onNavigate, onToggle }: SidebarProps) {
  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
      data-testid="sales-hub-sidebar"
    >
      <div className={styles.brandRow}>
        <span className={styles.waffle}>
          <SalesHubIcon name="waffle" size={21} />
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
            title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            type="button"
          >
            <SalesHubIcon name={collapsed ? 'arrow-right' : 'arrow-left'} size={14} />
          </button>
        </div>

        {navigationGroups.map((group) => (
          <section className={styles.navGroup} key={group.title}>
            <span className={styles.navGroupTitle}>{group.title}</span>
            <div className={styles.navItems}>
              {group.items.map((item) => {
                const active = item.id === 'danisanlar';
                return (
                  <button
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    disabled={!item.route}
                    key={item.id}
                    onClick={() => item.route && onNavigate(item.route)}
                    title={collapsed ? item.label : undefined}
                    type="button"
                  >
                    <span className={styles.navIcon}>
                      <SalesHubIcon name={item.icon} size={16} />
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
