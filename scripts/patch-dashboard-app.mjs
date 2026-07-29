import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    "import { ClientDetails } from './types';",
    "import { ClientDetails } from './types';\nimport { createCorrelationId } from './lib/correlation-id';",
    "App correlation id import",
  );
  source = source.replaceAll("crypto.randomUUID()", "createCorrelationId()");
  source = source.replace(
    "details.appointments.length > 0 ? details.appointments[0].service : 'Diyet ve Beslenme'",
    "details.appointments.length > 0 ? details.appointments[0].service : 'Belirtilmedi'",
  );

  source = replaceRequired(
    source,
    `  const plansApi: any[] = d.plans ?? [];
  const active = plansApi.find((p) => p.status === 'ACTIVE') ?? plansApi[0] ?? null;
  const openBalance = plansApi.reduce((t: number, p: any) => {
    const b = Number(p.balanceMinor ?? '0');
    return t + (b > 0 ? b : 0);
  }, 0);
  const totalPlan = plansApi.reduce((t: number, p: any) => t + Number(p.totalAmountMinor ?? '0'), 0);`,
    `  const plansApi: any[] = d.plans ?? [];
  const active = plansApi.find((p) => p.status === 'ACTIVE') ?? plansApi[0] ?? null;
  const activeCurrency = active?.currency ?? 'TRY';
  const currencyPlans = plansApi.filter((p) => (p.currency ?? 'TRY') === activeCurrency);
  const openBalance = currencyPlans.reduce((t: number, p: any) => {
    const b = Number(p.balanceMinor ?? '0');
    return t + (b > 0 ? b : 0);
  }, 0);
  const totalPlan = currencyPlans.reduce((t: number, p: any) => t + Number(p.totalAmountMinor ?? '0'), 0);`,
    "Client detail currency isolation",
  );
  source = replaceRequired(
    source,
    `    payment: 'Bekleniyor',`,
    `    payment: a.paymentStatus === 'PAID' ? 'Ödendi' : 'Bekleniyor',`,
    "Appointment payment state mapping",
  );
  source = replaceRequired(
    source,
    `.filter((e: any) => e.type === 'PAYMENT')`,
    `.filter((e: any) => e.type === 'PAYMENT' && !e.isReversed)`,
    "Reversed payment history filtering",
  );
  source = replaceRequired(
    source,
    `    whatsapp: d.phone ?? '',
    email: d.email ?? '',`,
    `    whatsapp: d.whatsapp ?? d.phone ?? '',
    email: d.email ?? '',`,
    "Persisted WhatsApp mapping",
  );
  source = replaceRequired(
    source,
    `    remainingBalance: money(openBalance),
    parentPrimaryName: guardian ? \`${"${guardian.firstName} ${guardian.lastName}"}\`.trim() : base.parentPrimaryName,
    parentPrimaryPhone: guardian?.phone ?? base.parentPrimaryPhone,
    parentPrimaryEmail: guardian?.email ?? base.parentPrimaryEmail,`,
    `    remainingBalance: money(openBalance),
    address: d.address ?? 'Girilmedi',
    city: d.city ?? 'Girilmedi',
    district: d.district ?? 'Girilmedi',
    country: d.country ?? 'Türkiye',
    preferredContactMethod: d.preferredContactMethod ?? 'WhatsApp',
    contactConsent: Boolean(d.contactConsent),
    emergencyContact: d.emergencyContact ?? '',
    parentPrimaryName: guardian ? \`${"${guardian.firstName} ${guardian.lastName}"}\`.trim() : undefined,
    parentPrimaryRelation: (d.guardians ?? [])[0]?.relationship ?? undefined,
    parentPrimaryPhone: guardian?.phone ?? undefined,
    parentPrimaryEmail: guardian?.email ?? undefined,`,
    "Persisted profile and guardian mapping",
  );
  source = replaceRequired(
    source,
    `    notes: {
      admin: (d.notes ?? [])[0]?.note ?? '',
      appointment: '',
      payment: '',
      plan: '',
    },`,
    `    notes: {
      admin: (d.notes ?? []).find((note: any) => note.category === 'ADMIN')?.note ?? '',
      appointment: (d.notes ?? []).find((note: any) => note.category === 'APPOINTMENT')?.note ?? '',
      payment: (d.notes ?? []).find((note: any) => note.category === 'PAYMENT')?.note ?? '',
      plan: (d.notes ?? []).find((note: any) => note.category === 'PLAN')?.note ?? '',
    },`,
    "Category-specific note mapping",
  );
  source = replaceRequired(
    source,
    `    documents: (d.documents ?? []).map((doc: any) => ({
      id: doc.id,
      name: doc.title,
      type: doc.category,
      size: '—',
      date: fmtDate(doc.createdAt),
      status: 'Aktif',
    })),`,
    `    documents: (d.documents ?? []).map((doc: any) => ({
      id: doc.id,
      name: doc.title,
      type: doc.category,
      size: Number(doc.sizeBytes) > 0
        ? \`${"${Math.max(1, Math.round(Number(doc.sizeBytes) / 1024))} KB"}\`
        : 'Bağlantı',
      date: fmtDate(doc.createdAt),
      status: 'Aktif',
      url: doc.downloadUrl ?? doc.url ?? '',
    })) as any,`,
    "Document metadata and URL mapping",
  );
  source = replaceRequired(
    source,
    `          if (Number(inst.outstandingMinor ?? '0') > 0) return { planId: p.id, installmentId: inst.id };`,
    `          if (Number(inst.outstandingMinor ?? '0') > 0) {
            return { planId: p.id, installmentId: inst.id, currency: p.currency ?? 'TRY' };
          }`,
    "Payment target currency mapping",
  );
  source = replaceRequired(
    source,
    `    _payTarget: (() => {`,
    `    _guardianId: guardian?.id ?? null,
    _currency: activeCurrency,
    _payTarget: (() => {`,
    "Hidden guardian and currency mapping",
  );

  source = replaceRegexRequired(
    source,
    /  const handleDeleteClient = async \(id: string\) => \{[\s\S]*?\n  \};\n\n  const handleAddClient = async/,
    `  const handleDeleteClient = async (id: string) => {
    try {
      const response = await fetch(\`/api/admin/clients/\${id}\`, {
        method: 'DELETE',
        headers: { 'x-correlation-id': createCorrelationId() },
      });
      if (!response.ok) return;
      setClientsDb(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setClients(prev => prev.filter(c => c.id !== id));
      setSelectedLeadId('');
    } catch {
      // Keep the persisted client visible when the request fails.
    }
  };

  const handleAddClient = async`,
    "Non-optimistic client deletion",
  );
  source = replaceRegexRequired(
    source,
    /  const handleAddClient = async \(newlyCreated: Client\) => \{[\s\S]*?\n  \};\n\n  const handleMenuItemClick/,
    `  const handleAddClient = async (newlyCreated: Client): Promise<string | null> => {
    try {
      const parts = newlyCreated.name.trim().split(/\\s+/);
      const firstName = parts.shift() || newlyCreated.name.trim() || 'Danışan';
      const lastName = parts.join(' ') || '-';
      const isChild = newlyCreated.ageGroup === 'Çocuk';
      const requestId = createCorrelationId();
      const body: Record<string, unknown> = {
        firstName,
        lastName,
        type: isChild ? 'CHILD' : 'ADULT',
        email: newlyCreated.email && newlyCreated.email !== 'Girilmedi' ? newlyCreated.email : null,
        phone: newlyCreated.phone && newlyCreated.phone !== 'Girilmedi' ? newlyCreated.phone : null,
        birthYear: null,
        preferredName: null,
        status: newlyCreated.status === 'Aktif' ? 'ACTIVE' : 'PROSPECTIVE',
        requestId,
        guardianMode: isChild ? 'NEW' : null,
        guardianFirstName: isChild ? newlyCreated.parentName.trim().split(/\\s+/)[0] || 'Veli' : null,
        guardianLastName: isChild ? newlyCreated.parentName.trim().split(/\\s+/).slice(1).join(' ') || '-' : null,
        guardianPhone: isChild && newlyCreated.phone !== 'Girilmedi' ? newlyCreated.phone : null,
        guardianEmail: null,
        guardianId: null,
        relationship: isChild ? 'Ebeveyn' : null,
      };
      if (isChild && !body.guardianPhone) return null;
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': createCorrelationId(),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      await loadClients();
      return payload?.data?.id ?? requestId;
    } catch {
      return null;
    }
  };

  const handleMenuItemClick`,
    "Non-optimistic client creation",
  );

  return source;
});
