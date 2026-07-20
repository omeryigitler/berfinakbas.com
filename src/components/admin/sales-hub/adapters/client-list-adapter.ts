import type { ClientListItem } from '@/components/admin/client-dashboard-types';

export type ClientGroupFilter = 'ALL' | 'ACTIVE' | 'PROSPECTIVE' | 'CHILD' | 'INACTIVE';
export type ClientSortMode = 'updated' | 'name';

export interface SalesHubClientListItem {
  createdAtLabel: string;
  displayName: string;
  id: string;
  initials: string;
  nextAppointmentLabel: string;
  planLabel: string;
  searchText: string;
  serviceLabel: string;
  status: ClientListItem['status'];
  statusLabel: string;
  type: ClientListItem['type'];
  updatedAtValue: number;
}

const statusLabels: Record<ClientListItem['status'], string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  PROSPECTIVE: 'Potansiyel',
};

export function formatDashboardDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getDashboardInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toLocaleUpperCase('tr-TR') || '—';
}

export function adaptClientListItem(client: ClientListItem): SalesHubClientListItem {
  const displayName = `${client.firstName} ${client.lastName}`.trim();
  const serviceLabel = client.nextAppointment?.serviceNameSnapshot?.trim() || '—';
  const nextAppointmentLabel = formatDashboardDate(client.nextAppointment?.startsAt, true);
  const createdAtLabel = formatDashboardDate(client.createdAt ?? client.updatedAt);

  return {
    createdAtLabel,
    displayName,
    id: client.id,
    initials: getDashboardInitials(client.firstName, client.lastName),
    nextAppointmentLabel,
    planLabel: client.plansCount > 0 ? `${client.plansCount} kayıt` : 'Yok',
    searchText: `${displayName} ${client.email ?? ''} ${client.phone ?? ''}`.toLocaleLowerCase('tr-TR'),
    serviceLabel,
    status: client.status,
    statusLabel: statusLabels[client.status],
    type: client.type,
    updatedAtValue: new Date(client.updatedAt).getTime(),
  };
}

export function filterAndSortClientList(
  clients: ClientListItem[],
  filter: ClientGroupFilter,
  query: string,
  sortMode: ClientSortMode,
): SalesHubClientListItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');

  return clients
    .map(adaptClientListItem)
    .filter((client) => {
      const matchesGroup =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && client.status === 'ACTIVE') ||
        (filter === 'PROSPECTIVE' && client.status === 'PROSPECTIVE') ||
        (filter === 'CHILD' && client.type === 'CHILD') ||
        (filter === 'INACTIVE' && client.status === 'INACTIVE');

      return matchesGroup && (!normalizedQuery || client.searchText.includes(normalizedQuery));
    })
    .sort((left, right) => {
      if (sortMode === 'name') return left.displayName.localeCompare(right.displayName, 'tr');
      return right.updatedAtValue - left.updatedAtValue;
    });
}
