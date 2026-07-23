import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ModuleNavPanel from './components/ModuleNavPanel';
import ModuleWorkspace from './components/ModuleWorkspace';
import {
  DashboardCatOverlay,
  readDashboardCatVisibility,
  writeDashboardCatVisibility,
} from './components/KediDashboardKit';
import { getDefaultModuleItemId, getModuleConfig } from './data/moduleConfig';
import { navigateManagement, type ManagementNavigateDetail } from './data/navigation';

function initialWorkspace() {
  const url = new URL(window.location.href);
  const requestedMenu = url.searchParams.get('workspace') ?? 'ana-panel';
  const menuItem = getModuleConfig(requestedMenu) ? requestedMenu : 'ana-panel';
  const requestedView = url.searchParams.get('view') ?? '';
  const itemId = requestedView || getDefaultModuleItemId(menuItem);
  return { menuItem, itemId };
}

export default function App() {
  const initial = initialWorkspace();
  const [activeMenuItem, setActiveMenuItem] = useState(initial.menuItem);
  const [selectedItemId, setSelectedItemId] = useState(initial.itemId);
  const [isCatVisible, setIsCatVisible] = useState(() => readDashboardCatVisibility());

  function openWorkspace(menuItem: string, itemId?: string) {
    setActiveMenuItem(menuItem);
    setSelectedItemId(itemId || getDefaultModuleItemId(menuItem));
  }

  useEffect(() => {
    function handleNavigate(event: Event) {
      const detail = (event as CustomEvent<ManagementNavigateDetail>).detail;
      if (!detail?.menuItem) return;
      openWorkspace(detail.menuItem, detail.itemId);
    }
    window.addEventListener('management:navigate', handleNavigate);
    return () => window.removeEventListener('management:navigate', handleNavigate);
  }, []);

  function handleMenuItemClick(menuItem: string) {
    navigateManagement(menuItem, getDefaultModuleItemId(menuItem));
  }

  function handleToggleCat() {
    setIsCatVisible((visible) => {
      const next = !visible;
      writeDashboardCatVisibility(next);
      return next;
    });
  }

  const hasNavigation = Boolean(getDefaultModuleItemId(activeMenuItem));

  return (
    <div id="app-root-layout" className="flex h-screen overflow-hidden bg-crm-sidebar font-sans text-[#323130]">
      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={handleMenuItemClick}
        isCatVisible={isCatVisible}
        onToggleCat={handleToggleCat}
      />

      <div className="flex h-screen flex-1 flex-col overflow-hidden bg-crm-sidebar">
        <Header />
        <div className="flex flex-1 gap-2 overflow-hidden pb-6 pl-1 pr-6">
          {hasNavigation ? (
            <ModuleNavPanel
              activeMenuItem={activeMenuItem}
              selectedItemId={selectedItemId}
              onSelectItem={(itemId) => navigateManagement(activeMenuItem, itemId)}
            />
          ) : null}
          <div id="dashboard-right-column" className="flex min-w-0 flex-1">
            <ModuleWorkspace activeMenuItem={activeMenuItem} selectedItemId={selectedItemId} />
          </div>
        </div>
      </div>

      <DashboardCatOverlay visible={isCatVisible} />
    </div>
  );
}
