import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;

  source = replaceRegexRequired(
    source,
    /const createDetailsFromClient = \(c: Client\): ClientDetails => \{[\s\S]*?\n\};\n\nconst syncClientFromDetails/,
    `const createDetailsFromClient = (c: Client): ClientDetails => ({
  id: c.id,
  name: c.name,
  clientNumber: 'DNS-' + (c.id || '').replace(/-/g, '').slice(0, 8).toUpperCase(),
  avatar: c.avatar,
  status: c.status,
  ageGroup: c.ageGroup,
  phone: c.phone,
  whatsapp: '',
  email: c.email,
  age: 0,
  birthDate: '',
  registrationDate: c.registrationDate,
  nextAppointment: c.nextAppointment || 'Yok',
  lastAppointment: c.lastAppointment || 'Yok',
  activePlan: c.activePlan || 'Yok',
  remainingBalance: 0,
  address: '',
  city: '',
  district: '',
  country: '',
  preferredContactMethod: 'WhatsApp',
  contactConsent: false,
  parentPrimaryName: c.parentName || undefined,
  appointments: [],
  plans: [],
  payments: {
    totalPlanAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    upcomingPayment: 'Yok',
    overduePayment: 'Yok',
    installments: [],
    history: [],
    discounts: [],
    refunds: [],
  },
  documents: [],
  contactHistory: [],
  notes: { admin: '', appointment: '', payment: '', plan: '' },
  auditLog: [],
  _detailLoaded: false,
} as ClientDetails);

const syncClientFromDetails`,
    "Neutral client detail shell",
  );

  source = replaceRequired(
    source,
    `    PROSPECTIVE: 'Potansiyel',`,
    `    PROSPECTIVE: 'Potansiyel',
    ARCHIVED: 'Arşivlenmiş',`,
    "Archived list status mapping",
  );
  source = source.replaceAll("'/api/admin/clients?take=100'", "'/api/admin/clients-v2?take=100'");
  source = replaceRequired(
    source,
    `    age: d.birthYear ? new Date().getFullYear() - d.birthYear : base.age,
    birthDate: d.birthYear ? \`${'${d.birthYear}-01-01'}\` : base.birthDate,`,
    `    age: d.birthYear ? new Date().getFullYear() - d.birthYear : 0,
    birthDate: d.birthYear ? \`${'${d.birthYear}-01-01'}\` : '',`,
    "Remove fabricated age fallback",
  );
  source = replaceRequired(
    source,
    `    address: d.address ?? 'Girilmedi',
    city: d.city ?? 'Girilmedi',
    district: d.district ?? 'Girilmedi',
    country: d.country ?? 'Türkiye',
    preferredContactMethod: d.preferredContactMethod ?? 'WhatsApp',`,
    `    address: d.address ?? '',
    city: d.city ?? '',
    district: d.district ?? '',
    country: d.country ?? '',
    preferredContactMethod: (d.preferredContactMethod ?? 'WhatsApp') as any,`,
    "Remove fabricated profile defaults",
  );
  source = replaceRequired(
    source,
    `    return {
      name: p.name,`,
    `    return {
      _id: p.id,
      _currency: p.currency ?? 'TRY',
      name: p.name,`,
    "Plan identity mapping",
  );
  source = replaceRequired(
    source,
    `    _guardianId: guardian?.id ?? null,
    _currency: activeCurrency,`,
    `    _guardianId: guardian?.id ?? null,
    _currency: activeCurrency,
    _completionPlanId: active && Number(active.remainingSessions ?? 0) > 0 ? active.id : null,
    _detailLoaded: true,`,
    "Explicit completion plan mapping",
  );

  source = replaceRequired(
    source,
    `  const [clientsDb, setClientsDb] = useState<Record<string, ClientDetails>>({});`,
    `  const [clientsDb, setClientsDb] = useState<Record<string, ClientDetails>>({});
  const [clientRefreshNonce, setClientRefreshNonce] = useState(0);`,
    "Client refresh nonce",
  );
  source = replaceRequired(
    source,
    `  }, [selectedLeadId]);`,
    `  }, [selectedLeadId, clientRefreshNonce]);`,
    "Reload detail dependency",
  );
  source = replaceRequired(
    source,
    `  const handleUpdateClientDetails = (id: string, updatedDetails: ClientDetails) => {`,
    `  useEffect(() => {
    const refresh = (event: Event) => {
      const clientId = (event as CustomEvent<{ clientId?: string }>).detail?.clientId;
      if (clientId && clientId === selectedLeadId) setClientRefreshNonce((value) => value + 1);
    };
    window.addEventListener('dashboard:refresh-client', refresh);
    return () => window.removeEventListener('dashboard:refresh-client', refresh);
  }, [selectedLeadId]);

  const handleUpdateClientDetails = (id: string, updatedDetails: ClientDetails) => {`,
    "Real client refresh event",
  );

  return source;
});

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;

  source = replaceRegexRequired(
    source,
    /  const \[planForm, setPlanForm\] = useState\(\{[\s\S]*?\n  \}\);\n\n  \/\/ New Payment Form State/,
    `  const [planForm, setPlanForm] = useState({
    name: '',
    totalSessions: 1,
    price: 0,
    sessionDuration: 50,
    startDate: toLocalDateInput(),
    endDate: monthsFromNowInput(3),
    note: '',
  });

  // New Payment Form State`,
    "Neutral plan form defaults",
  );
  source = replaceRegexRequired(
    source,
    /  const \[payForm, setPayForm\] = useState\(\{[\s\S]*?\n  \}\);/,
    `  const [payForm, setPayForm] = useState({
    amount: 0,
    type: 'Kredi Kartı' as 'Kredi Kartı' | 'Nakit' | 'Havale',
    note: '',
  });`,
    "Neutral payment form defaults",
  );
  source = source.replace("name: 'Gelişim Gözlem Formu.pdf',", "name: '',");
  source = source.replaceAll("En fazla 4 MB", "En fazla 10 MB");

  source = replaceRequired(
    source,
    `    const apiStatus = newStatus === 'Aktif'
      ? 'ACTIVE'
      : newStatus === 'Potansiyel'
        ? 'PROSPECTIVE'
        : 'INACTIVE';`,
    `    const apiStatus = newStatus === 'Aktif'
      ? 'ACTIVE'
      : newStatus === 'Potansiyel'
        ? 'PROSPECTIVE'
        : 'INACTIVE';
    const archived = newStatus === 'Arşivlenmiş';`,
    "Archived status request flag",
  );
  source = replaceRequired(
    source,
    `      body: JSON.stringify({ status: apiStatus }),`,
    `      body: JSON.stringify({ status: apiStatus, archived }),`,
    "Persist archived distinction",
  );

  source = replaceRequired(
    source,
    `      const response = await fetch(\`/api/admin/appointments/\${appointment.id}/complete\`, {
        method: 'POST',
        headers: { 'x-correlation-id': createCorrelationId() },
      });`,
    `      const completionPlanId = (client as any)._completionPlanId ?? null;
      const response = await fetch(\`/api/admin/appointments/\${appointment.id}/complete\`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': createCorrelationId(),
        },
        body: JSON.stringify({ planId: completionPlanId }),
      });`,
    "Explicit completion plan request",
  );
  source = replaceRequired(
    source,
    `      if (payload?.data?.consumedPlanId && plans[0]) {
        const activePlan = plans[0];
        const usedSessions = Math.min(activePlan.totalSessions, activePlan.usedSessions + 1);
        plans[0] = {
          ...activePlan,`,
    `      const consumedPlanIndex = plans.findIndex((plan) => (plan as any)._id === payload?.data?.consumedPlanId);
      if (consumedPlanIndex >= 0) {
        const activePlan = plans[consumedPlanIndex];
        const usedSessions = Math.min(activePlan.totalSessions, activePlan.usedSessions + 1);
        plans[consumedPlanIndex] = {
          ...activePlan,`,
    "Update the consumed plan only",
  );

  source = replaceRequired(
    source,
    `              onClick={() => triggerToast('Danışan bilgileri başarıyla güncellendi!', 'success')}`,
    `              onClick={() => {
                window.dispatchEvent(new CustomEvent('dashboard:refresh-client', { detail: { clientId: client.id } }));
                triggerToast('Danışan bilgileri yeniden yükleniyor.', 'info');
              }}`,
    "Real refresh action",
  );

  return source;
});
