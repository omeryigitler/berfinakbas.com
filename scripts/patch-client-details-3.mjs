import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const handleAddPlan = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Add Payment/,
    `  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(planForm.price > 0)) {
      triggerToast('Plan tutarı sıfırdan büyük olmalıdır.', 'error');
      return;
    }
    try {
      const requestId = createCorrelationId();
      const totalAmountMinor = String(Math.round(planForm.price * 100));
      const response = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': requestId },
        body: JSON.stringify({
          action: 'CREATE_PLAN',
          clientId: client.id,
          currency: (client as any)._currency ?? 'TRY',
          idempotencyKey: requestId,
          installments: [{ amountMinor: totalAmountMinor, dueDate: planForm.startDate, sequence: 1 }],
          name: planForm.name,
          reason: 'Danışan planı panelden oluşturuldu.',
          sessionCount: planForm.totalSessions,
          sessionDurationMinutes: planForm.sessionDuration || 50,
          totalAmountMinor,
          validFrom: planForm.startDate,
          validUntil: planForm.endDate || null,
        }),
      });
      await requireSuccess(response);
      const newPlan: Plan = {
        name: planForm.name,
        status: 'Aktif',
        totalSessions: planForm.totalSessions,
        usedSessions: 0,
        remainingSessions: planForm.totalSessions,
        startDate: planForm.startDate,
        endDate: planForm.endDate,
        usageHistory: [],
        note: planForm.note,
      };
      onUpdateClient(client.id, {
        ...client,
        activePlan: planForm.name,
        plans: [newPlan, ...client.plans],
      });
      setIsCreatingPlan(false);
      triggerToast('Yeni seans planı başarıyla oluşturuldu!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Plan oluşturulamadı.', 'error');
    }
  };

  // Add Payment`,
    "Persist plan before local success",
  );

  source = replaceRegexRequired(
    source,
    /  const handleAddPayment = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Add a document/,
    `  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payForm.amount);
    const payTarget = (client as any)._payTarget;
    if (!(amount > 0) || !payTarget) {
      triggerToast('Ödeme için açık bir taksit bulunamadı.', 'error');
      return;
    }
    try {
      const methodsResponse = await fetch('/api/admin/finance', { headers: { accept: 'application/json' } });
      const methodsPayload = await requireSuccess(methodsResponse);
      const methods: any[] = methodsPayload?.data?.paymentMethods ?? [];
      const normalize = (value: unknown) =>
        String(value ?? '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
      const aliases = payForm.type === 'Kredi Kartı'
        ? ['kredikarti', 'card']
        : payForm.type === 'Nakit'
          ? ['nakit', 'cash']
          : ['havale', 'eft', 'banktransfer'];
      const method = methods.find((entry) => {
        const haystack = \`${'${normalize(entry.name)}${normalize(entry.key)}'}\`;
        return aliases.some((alias) => haystack.includes(alias));
      });
      if (!method?.id) throw new Error(\`${'${payForm.type}'} ödeme yöntemi sistemde aktif değil.\`);

      const requestId = createCorrelationId();
      const response = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': requestId },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          amountMinor: String(Math.round(amount * 100)),
          clientId: client.id,
          currency: payTarget.currency ?? 'TRY',
          idempotencyKey: requestId,
          installmentId: payTarget.installmentId,
          occurredAt: new Date().toISOString(),
          paymentMethodId: method.id,
          planId: payTarget.planId,
          note: payForm.note || null,
          reason: 'Panelden ödeme tahsilatı yapıldı.',
        }),
      });
      const payload = await requireSuccess(response);
      const newPayRecord: PaymentRecord = {
        date: new Date().toISOString().split('T')[0],
        amount,
        type: payForm.type,
        invoiceNo: payload?.data?.id ? String(payload.data.id).slice(0, 12) : requestId.slice(0, 12),
        note: payForm.note,
      };
      onUpdateClient(client.id, {
        ...client,
        remainingBalance: Math.max(0, client.remainingBalance - amount),
        payments: {
          ...client.payments,
          paidAmount: client.payments.paidAmount + amount,
          remainingAmount: Math.max(0, client.payments.remainingAmount - amount),
          history: [newPayRecord, ...client.payments.history],
        },
      });
      setIsAddingPayment(false);
      triggerToast(\`${'${amount} TL'} ödeme başarıyla tahsil edildi!\`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.', 'error');
    }
  };

  // Add a document`,
    "Persist selected payment method and response",
  );

  return source;
});
