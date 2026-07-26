import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MyWorkPanel, { Client, INITIAL_CLIENTS } from './components/MyWorkPanel';
import WorkspacePanel from './components/WorkspacePanel';
import ModuleNavPanel from './components/ModuleNavPanel';
import ModuleWorkspace from './components/ModuleWorkspace';
import {
  DashboardCatOverlay,
  readDashboardCatVisibility,
  writeDashboardCatVisibility,
} from './components/KediDashboardKit';
import { ClientDetails } from './types';
import { DANISAN_DETAILS_DATABASE } from './data/clientDb';

const createDetailsFromClient = (c: Client): ClientDetails => {
  return {
    id: c.id,
    name: c.name,
    clientNumber: 'DNS-' + Math.floor(1000 + Math.random() * 9000),
    avatar: c.avatar,
    status: c.status,
    ageGroup: c.ageGroup,
    phone: c.phone,
    whatsapp: c.phone,
    email: c.email,
    age: c.ageGroup === 'Çocuk' ? 10 : 35,
    birthDate: c.ageGroup === 'Çocuk' ? '2016-01-01' : '1991-01-01',
    registrationDate: c.registrationDate,
    nextAppointment: c.nextAppointment || 'Yok',
    lastAppointment: c.lastAppointment || 'Yok',
    activePlan: c.activePlan,
    remainingBalance: c.paymentStatus === 'Borçlu' ? 1500 : 0,
    address: 'Girilmedi',
    city: 'İstanbul',
    district: 'Şişli',
    country: 'Türkiye',
    preferredContactMethod: 'WhatsApp',
    contactConsent: true,
    parentPrimaryName: c.parentName || undefined,
    parentPrimaryRelation: c.parentName ? 'Ebeveyn' : undefined,
    parentPrimaryPhone: c.parentName ? c.phone : undefined,
    parentPrimaryEmail: c.parentName ? c.email : undefined,
    appointments: [],
    plans: c.activePlan !== 'Yok' ? [
      {
        name: c.activePlan,
        status: 'Aktif',
        totalSessions: c.planRemainingSessions + 2,
        usedSessions: 2,
        remainingSessions: c.planRemainingSessions,
        startDate: c.registrationDate,
        endDate: '2026-10-20',
        usageHistory: [],
        note: 'Otomatik tanımlanan plan paketi'
      }
    ] : [],
    payments: {
      totalPlanAmount: c.paymentStatus === 'Borçlu' ? 3000 : 1500,
      paidAmount: c.paymentStatus === 'Borçlu' ? 1500 : 1500,
      remainingAmount: c.paymentStatus === 'Borçlu' ? 1500 : 0,
      upcomingPayment: c.paymentStatus === 'Borçlu' ? 'Yakında' : 'Yok',
      overduePayment: 'Yok',
      installments: [],
      history: [],
      discounts: [],
      refunds: []
    },
    documents: [],
    contactHistory: [],
    notes: { admin: '', appointment: '', payment: '', plan: '' },
    auditLog: [
      {
        id: 'audit-1',
        date: c.registrationDate + ' 10:00',
        action: 'Oluşturulma',
        detail: 'Yeni danışan kaydı sistem üzerinden oluşturuldu.',
        user: 'Berfin Akbaş'
      }
    ]
  };
};

const syncClientFromDetails = (details: ClientDetails, originalClient?: Client): Client => {
  return {
    id: details.id,
    name: details.name,
    avatar: details.avatar,
    phone: details.phone,
    email: details.email,
    status: details.status,
    ageGroup: details.ageGroup,
    service: originalClient?.service || (details.appointments.length > 0 ? details.appointments[0].service : 'Diyet ve Beslenme'),
    activePlan: details.activePlan,
    paymentStatus: details.payments.remainingAmount > 0 ? 'Borçlu' : 'Ödendi',
    registrationDate: details.registrationDate,
    lastAppointment: details.lastAppointment || '',
    nextAppointment: details.nextAppointment || '',
    parentName: details.parentPrimaryName || '',
    source: originalClient?.source || 'Web Sitesi',
    planRemainingSessions: details.plans.length > 0 ? details.plans[0].remainingSessions : 0,
    isNew: originalClient?.isNew
  };
};

const mapApiClientToClient = (c: any): Client => {
  const statusMap: Record<string, Client['status']> = {
    ACTIVE: 'Aktif',
    INACTIVE: 'Pasif',
    PROSPECTIVE: 'Potansiyel',
  };
  const openBalance = Number(c.openBalanceMinor ?? '0');
  const toDate = (value: string | null | undefined) => (value ? new Date(value) : null);
  const fmt = (d: Date | null, withTime = false) => {
    if (!d || Number.isNaN(d.getTime())) return '';
    const iso = d.toISOString();
    return withTime ? iso.slice(0, 16).replace('T', ' ') : iso.slice(0, 10);
  };
  return {
    id: c.id,
    name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
    avatar: '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    status: statusMap[c.status] ?? 'Potansiyel',
    ageGroup: c.type === 'CHILD' ? 'Çocuk' : 'Yetişkin',
    service: c.nextAppointment?.serviceNameSnapshot ?? '',
    activePlan: c.activePlanName ?? 'Yok',
    paymentStatus: openBalance > 0 ? 'Borçlu' : 'Ödendi',
    registrationDate: fmt(toDate(c.createdAt)),
    lastAppointment: '',
    nextAppointment: fmt(toDate(c.nextAppointment?.startsAt), true),
    parentName: '',
    source: '',
    planRemainingSessions: Number(c.remainingSessions ?? 0),
  };
};

const apiStatusToTr = (s: string) =>
  s === 'ACTIVE' ? 'Aktif' : s === 'INACTIVE' ? 'Pasif' : s === 'ARCHIVED' ? 'Arşivlenmiş' : 'Potansiyel';

const apptStatusToTr = (s: string) => {
  switch (s) {
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'RESCHEDULE_PROPOSED':
      return 'Yeniden Planlandı';
    case 'REJECTED':
    case 'CANCELLED_BY_CLIENT':
    case 'CANCELLED_BY_PRACTITIONER':
      return 'İptal Edildi';
    case 'NO_SHOW':
      return 'Gelmedi';
    default:
      return 'Yaklaşan';
  }
};

const planStatusToTr = (s: string) =>
  s === 'ACTIVE' ? 'Aktif' : s === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi';

const mapApiDetailToClientDetails = (d: any, base: ClientDetails): ClientDetails => {
  const toDate = (v: any) => (v ? new Date(v) : null);
  const okDate = (dt: Date | null) => dt && !Number.isNaN(dt.getTime());
  const fmtDate = (v: any) => {
    const dt = toDate(v);
    return okDate(dt)
      ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' }).format(dt as Date)
      : '';
  };
  const fmtDateTime = (v: any) => {
    const dt = toDate(v);
    return okDate(dt)
      ? new Intl.DateTimeFormat('tr-TR', {
          timeZone: 'Europe/Istanbul',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(dt as Date)
      : 'Yok';
  };
  const fmtTime = (v: any) => {
    const dt = toDate(v);
    return okDate(dt)
      ? new Intl.DateTimeFormat('tr-TR', {
          timeZone: 'Europe/Istanbul',
          hour: '2-digit',
          minute: '2-digit',
        }).format(dt as Date)
      : '';
  };
  const money = (minor: any) => Math.round(Number(minor ?? '0') / 100);

  const plansApi: any[] = d.plans ?? [];
  const active = plansApi.find((p) => p.status === 'ACTIVE') ?? plansApi[0] ?? null;
  const openBalance = plansApi.reduce((t: number, p: any) => {
    const b = Number(p.balanceMinor ?? '0');
    return t + (b > 0 ? b : 0);
  }, 0);
  const totalPlan = plansApi.reduce((t: number, p: any) => t + Number(p.totalAmountMinor ?? '0'), 0);

  const appointments = (d.appointments ?? []).map((a: any) => ({
    id: a.id,
    date: fmtDate(a.startsAt),
    time: fmtTime(a.startsAt),
    service: a.serviceNameSnapshot ?? '',
    duration: `${a.durationMinutesSnapshot ?? ''} dk`,
    status: apptStatusToTr(a.status),
    payment: 'Bekleniyor',
    type: a.locationTypeSnapshot === 'ONLINE' ? 'Online' : 'Yüz Yüze',
    note: a.requestNote ?? undefined,
  }));

  const plans = plansApi.map((p: any) => {
    const remaining = Number(p.remainingSessions ?? 0);
    const total = Number(p.sessionCount ?? 0);
    return {
      name: p.name,
      status: planStatusToTr(p.status),
      totalSessions: total,
      usedSessions: Math.max(0, total - remaining),
      remainingSessions: remaining,
      startDate: fmtDate(p.validFrom),
      endDate: fmtDate(p.validUntil),
      usageHistory: [],
    };
  });

  const history = (d.financeEntries ?? [])
    .filter((e: any) => e.type === 'PAYMENT')
    .map((e: any) => ({
      date: fmtDate(e.occurredAt),
      amount: Math.abs(money(e.amountMinor)),
      type: e.paymentMethod?.name ?? 'Havale',
      invoiceNo: e.externalReference ?? '',
      note: e.note ?? '',
    }));

  const guardian = (d.guardians ?? [])[0]?.guardian;

  return {
    ...base,
    id: d.id,
    name: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(),
    status: apiStatusToTr(d.status),
    ageGroup: d.type === 'CHILD' ? 'Çocuk' : 'Yetişkin',
    phone: d.phone ?? '',
    whatsapp: d.phone ?? '',
    email: d.email ?? '',
    age: d.birthYear ? new Date().getFullYear() - d.birthYear : base.age,
    birthDate: d.birthYear ? `${d.birthYear}-01-01` : base.birthDate,
    registrationDate: fmtDate(d.createdAt) || base.registrationDate,
    nextAppointment: d.nextAppointment ? fmtDateTime(d.nextAppointment.startsAt) : 'Yok',
    lastAppointment: d.lastVisit ? fmtDateTime(d.lastVisit.startsAt) : 'Yok',
    activePlan: active?.name ?? 'Yok',
    remainingBalance: money(openBalance),
    parentPrimaryName: guardian ? `${guardian.firstName} ${guardian.lastName}`.trim() : base.parentPrimaryName,
    parentPrimaryPhone: guardian?.phone ?? base.parentPrimaryPhone,
    parentPrimaryEmail: guardian?.email ?? base.parentPrimaryEmail,
    appointments,
    plans,
    payments: {
      totalPlanAmount: money(totalPlan),
      paidAmount: Math.max(0, money(totalPlan) - money(openBalance)),
      remainingAmount: money(openBalance),
      upcomingPayment: openBalance > 0 ? 'Yakında' : 'Yok',
      overduePayment: 'Yok',
      installments: [],
      history,
      discounts: [],
      refunds: [],
    },
    notes: {
      admin: (d.notes ?? [])[0]?.note ?? '',
      appointment: '',
      payment: '',
      plan: '',
    },
    _payTarget: (() => {
      for (const p of plansApi) {
        for (const inst of p.installments ?? []) {
          if (Number(inst.outstandingMinor ?? '0') > 0) return { planId: p.id, installmentId: inst.id };
        }
      }
      return null;
    })(),
  } as ClientDetails;
};

export default function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('danisanlar');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [showOrta, setShowOrta] = useState(true);
  const [showSag, setShowSag] = useState(true);
  const [isCatVisible, setIsCatVisible] = useState(() => readDashboardCatVisibility());

  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [clientsDb, setClientsDb] = useState<Record<string, ClientDetails>>(DANISAN_DETAILS_DATABASE);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients?take=100', {
        headers: { accept: 'application/json' },
      });
      if (!res.ok) return;
      const payload = await res.json();
      const rows: any[] = payload?.data ?? [];
      const mapped: Client[] = rows.map(mapApiClientToClient);
      setClients(mapped);
      setClientsDb(
        Object.fromEntries(
          rows.map((row, index) => {
            const client = mapped[index];
            const detail = createDetailsFromClient(client);
            const balanceMajor = Math.round(Number(row.openBalanceMinor ?? '0') / 100);
            detail.remainingBalance = balanceMajor;
            if (detail.payments) {
              detail.payments.remainingAmount = balanceMajor;
            }
            if (detail.plans && detail.plans[0] && row.sessionCount != null) {
              detail.plans[0].totalSessions = Number(row.sessionCount);
              detail.plans[0].usedSessions = Math.max(
                0,
                Number(row.sessionCount) - Number(row.remainingSessions ?? 0),
              );
            }
            return [client.id, detail];
          }),
        ),
      );
    } catch {
      /* keep mock data when the API is unavailable */
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (!selectedLeadId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/clients/${selectedLeadId}`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return;
        const payload = await res.json();
        const api = payload?.data;
        if (!api || cancelled) return;
        setClientsDb((prev) => {
          const base = prev[selectedLeadId];
          if (!base) return prev;
          return { ...prev, [selectedLeadId]: mapApiDetailToClientDetails(api, base) };
        });
      } catch {
        /* keep the summary detail when the API is unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLeadId]);

  const handleUpdateClientDetails = (id: string, updatedDetails: ClientDetails) => {
    setClientsDb(prev => ({
      ...prev,
      [id]: updatedDetails
    }));
    setClients(prev => prev.map(c => c.id === id ? syncClientFromDetails(updatedDetails, c) : c));
  };

  const handleDeleteClient = async (id: string) => {
    setClientsDb(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setClients(prev => prev.filter(c => c.id !== id));
    setSelectedLeadId('');
    try {
      // Soft-delete (status -> INACTIVE) so the record moves to Arşiv and can be restored.
      await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
        headers: { 'x-correlation-id': crypto.randomUUID() },
      });
    } catch {
      /* keep the optimistic local removal when the API is unavailable */
    }
  };

  const handleAddClient = async (newlyCreated: Client) => {
    setClients(prev => [newlyCreated, ...prev]);
    setClientsDb(prev => ({
      ...prev,
      [newlyCreated.id]: createDetailsFromClient(newlyCreated),
    }));
    try {
      const parts = newlyCreated.name.trim().split(/\s+/);
      const firstName = parts.shift() || newlyCreated.name.trim() || 'Danışan';
      const lastName = parts.join(' ') || '-';
      const isChild = newlyCreated.ageGroup === 'Çocuk';
      const body: Record<string, unknown> = {
        firstName,
        lastName,
        type: isChild ? 'CHILD' : 'ADULT',
        email: newlyCreated.email || null,
        phone: newlyCreated.phone || null,
        birthYear: null,
        preferredName: null,
        status: newlyCreated.status === 'Aktif' ? 'ACTIVE' : 'PROSPECTIVE',
        requestId: crypto.randomUUID(),
        guardianMode: isChild ? 'NEW' : null,
        guardianFirstName: isChild ? newlyCreated.parentName || 'Veli' : null,
        guardianLastName: isChild ? '-' : null,
        guardianPhone: isChild ? newlyCreated.phone || null : null,
        guardianEmail: null,
        guardianId: null,
        relationship: isChild ? 'Ebeveyn' : null,
      };
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await loadClients();
      }
    } catch {
      /* keep the optimistic local entry when the API is unavailable */
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    if (activeMenuItem === itemId) {
      setShowOrta(prev => {
        const nextVal = !prev;
        if (!nextVal) {
          setShowSag(false);
        }
        return nextVal;
      });
    } else {
      setActiveMenuItem(itemId);
      setShowOrta(true);
      setShowSag(true);
      if (itemId === 'ana-panel') {
        setSelectedLeadId('genel-bakis');
      } else {
        setSelectedLeadId('');
      }
    }
  };

  const handleSelectLead = (leadId: string) => {
    if (!showOrta) return;
    setSelectedLeadId(leadId);
    setShowSag(true);
  };

  const handleOpenWorkspace = (menuItem: string, itemId: string) => {
    setActiveMenuItem(menuItem);
    setSelectedLeadId(itemId);
    setShowOrta(true);
    setShowSag(true);
  };

  const handleToggleCat = () => {
    setIsCatVisible((visible) => {
      const next = !visible;
      writeDashboardCatVisibility(next);
      return next;
    });
  };

  const usesExistingPanels = activeMenuItem === 'danisanlar' || activeMenuItem === 'ana-panel';

  return (
    <div id="app-root-layout" className="flex h-screen bg-crm-sidebar text-[#323130] overflow-hidden font-sans">
      <style>{`
        #dashboard-right-column > * {
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0) 33%,
              rgba(255, 255, 255, 0.82) 39%,
              #ffffff 44%,
              #ffffff 100%
            ),
            linear-gradient(
              105deg,
              #eaff7e 0%,
              #eff9b0 30%,
              #fff7eb 66%,
              #ffffff 100%
            ) !important;
          background-image:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0) 33%,
              rgba(255, 255, 255, 0.82) 39%,
              #ffffff 44%,
              #ffffff 100%
            ),
            linear-gradient(
              105deg,
              #eaff7e 0%,
              #eff9b0 30%,
              #fff7eb 66%,
              #ffffff 100%
            ) !important;
        }
      `}</style>

      <Sidebar
        activeMenuItem={activeMenuItem}
        setActiveMenuItem={handleMenuItemClick}
        isCatVisible={isCatVisible}
        onToggleCat={handleToggleCat}
      />

      <div className="flex-1 bg-crm-sidebar h-screen flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 flex gap-2 pl-1 pr-6 pb-6 overflow-hidden">
          {showOrta && (
            usesExistingPanels ? (
              <MyWorkPanel
                selectedLeadId={showSag ? selectedLeadId : ''}
                onSelectLead={handleSelectLead}
                activeMenuItem={activeMenuItem}
                clients={clients}
                onAddClient={handleAddClient}
              />
            ) : (
              <ModuleNavPanel
                activeMenuItem={activeMenuItem}
                selectedItemId={showSag ? selectedLeadId : ''}
                onSelectItem={handleSelectLead}
              />
            )
          )}

          {showOrta && showSag && (
            <div id="dashboard-right-column" className="flex-1 min-w-0 flex">
              {usesExistingPanels ? (
                <WorkspacePanel
                  selectedLeadId={selectedLeadId}
                  activeMenuItem={activeMenuItem}
                  onSelectLead={handleSelectLead}
                  clientsDb={clientsDb}
                  onUpdateClientDetails={handleUpdateClientDetails}
                  onDeleteClient={handleDeleteClient}
                  onOpenWorkspace={handleOpenWorkspace}
                />
              ) : (
                <ModuleWorkspace
                  activeMenuItem={activeMenuItem}
                  selectedItemId={selectedLeadId}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <DashboardCatOverlay visible={isCatVisible} />
    </div>
  );
}
