export interface ManagementNavigateDetail {
  itemId: string;
  menuItem: string;
  recordId?: string;
}

export function navigateManagement(menuItem: string, itemId: string, recordId?: string) {
  const detail: ManagementNavigateDetail = { menuItem, itemId, ...(recordId ? { recordId } : {}) };
  const url = new URL(window.location.href);
  url.searchParams.set('workspace', menuItem);
  url.searchParams.set('view', itemId);
  if (recordId) url.searchParams.set('record', recordId);
  else url.searchParams.delete('record');
  window.history.replaceState(window.history.state, '', url);
  window.dispatchEvent(new CustomEvent<ManagementNavigateDetail>('management:navigate', { detail }));
}

export function readManagementRecord(menuItem: string, itemId: string): string | null {
  const url = new URL(window.location.href);
  if (url.searchParams.get('workspace') !== menuItem) return null;
  if (url.searchParams.get('view') !== itemId) return null;
  return url.searchParams.get('record');
}
