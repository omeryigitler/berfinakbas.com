import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const plansApi: any\[\] = d\.plans \?\? \[\];[\s\S]*?  const totalPlan = currencyPlans\.reduce\([^\n]+\n/,
    `  const plansApi: any[] = d.plans ?? [];
  const payablePlans = plansApi.filter((plan) => plan.status !== 'CANCELLED');
  const active = payablePlans.find((plan) => plan.status === 'ACTIVE') ?? payablePlans[0] ?? null;
  const activeCurrency = active?.currency ?? 'TRY';
  const currencyPlans = payablePlans.filter((plan) => (plan.currency ?? 'TRY') === activeCurrency);
  const openBalance = currencyPlans.reduce((total: number, plan: any) => {
    const balance = Number(plan.balanceMinor ?? '0');
    return total + (balance > 0 ? balance : 0);
  }, 0);
  const totalPlan = currencyPlans.reduce((total: number, plan: any) => total + Number(plan.totalAmountMinor ?? '0'), 0);
`,
    "Payable client plan summary",
  );
  source = replaceRegexRequired(
    source,
    /  const history = \(d\.financeEntries \?\? \[\]\)[\s\S]*?\n\n  const guardian/,
    `  const history = (d.financeEntries ?? [])
    .filter((entry: any) => entry.type === 'PAYMENT' && !entry.isReversed)
    .map((entry: any) => ({
      date: fmtDate(entry.occurredAt),
      amount: Math.abs(money(entry.amountMinor)),
      planName: entry.plan?.name ?? 'Plan bilgisi yok',
      note: entry.note ?? '',
    }));

  const guardian`,
    "Plan-linked payment history",
  );
  source = replaceRegexRequired(
    source,
    /    _payTarget: \(\(\) => \{[\s\S]*?    \}\)\(\),/,
    `    _paymentPlanOptions: payablePlans
      .filter((plan: any) => Number(plan.balanceMinor ?? '0') > 0)
      .map((plan: any) => ({
        id: plan.id,
        planName: plan.name,
        currency: plan.currency ?? 'TRY',
        outstandingMinor: String(plan.balanceMinor ?? '0'),
      })),`,
    "All open plan payment targets",
  );
  return source;
});

await patchFile("types.ts", (initialSource) => {
  return replaceRegexRequired(
    initialSource,
    /export interface PaymentRecord \{[\s\S]*?\n\}/,
    `export interface PaymentRecord {
  date: string;
  amount: number;
  planName?: string;
  note: string;
  type?: 'Kredi Kartı' | 'Nakit' | 'Havale';
  invoiceNo?: string;
}`,
    "Simple payment record type",
  );
});

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `import { ClientDetails, Appointment, Plan, DocumentRecord, PaymentRecord, PaymentInstallment } from '../types';`,
    `import { ClientDetails, Appointment, Plan, DocumentRecord } from '../types';`,
    "Remove legacy payment type imports",
  );
  source = replaceRegexRequired(
    source,
    /const paymentTypeOptions = \[[\s\S]*?\n\];\n\n/,
    "",
    "Remove payment method choices",
  );
  source = replaceRegexRequired(
    source,
    /  \/\/ New Payment Form State\n  const \[payForm, setPayForm\] = useState\(\{[\s\S]*?\n  \}\);/,
    `  // New Payment Form State — only plan, amount, date and optional note are required.
  const paymentPlanOptions: Array<{ id: string; planName: string; currency: string; outstandingMinor: string }> =
    Array.isArray((client as any)._paymentPlanOptions) ? (client as any)._paymentPlanOptions : [];
  const clientPaymentCurrencyLabel = (client as any)._currency === 'TRY' ? 'TL' : ((client as any)._currency ?? 'TRY');
  const [payForm, setPayForm] = useState({
    amount: 0,
    date: toLocalDateInput(),
    planId: '',
    note: '',
  });`,
    "Simple payment form state",
  );
  source = replaceRegexRequired(
    source,
    /    \} else if \(panelName === 'payment'\) \{[\s\S]*?    \} else if \(panelName === 'document'\) \{/,
    `    } else if (panelName === 'payment') {
      const next = !isAddingPayment;
      if (next) {
        const options = Array.isArray((client as any)._paymentPlanOptions)
          ? (client as any)._paymentPlanOptions
          : [];
        if (options.length === 0) {
          setIsAddingPayment(false);
          triggerToast('Ödenecek bakiyesi olan plan bulunmuyor.', 'info');
          return;
        }
        setPayForm({
          amount: 0,
          date: toLocalDateInput(),
          planId: options.length === 1 ? options[0].id : '',
          note: '',
        });
      }
      setIsAddingPayment(next);
      if (next) {
        setIsEditing(false);
        setIsAddingAppointment(false);
        setIsCreatingPlan(false);
        setIsUploadingDoc(false);
        setActiveTab('odemeler');
      }
    } else if (panelName === 'document') {`,
    "Only open payment form for plans with debt",
  );
  source = replaceRegexRequired(
    source,
    /  const handleAddPayment = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Add a document/,
    `  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payForm.amount);
    const selectedPlan = paymentPlanOptions.find((plan) => plan.id === payForm.planId);
    if (!selectedPlan) {
      triggerToast('Ödeme yapılacak planı seçin.', 'error');
      return;
    }
    if (!(amount > 0)) {
      triggerToast('Geçerli bir ödeme tutarı girin.', 'error');
      return;
    }
    if (Math.round(amount * 100) > Number(selectedPlan.outstandingMinor)) {
      triggerToast('Ödeme tutarı planın kalan borcunu aşamaz.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': createCorrelationId(),
        },
        body: JSON.stringify({
          amountMinor: String(Math.round(amount * 100)),
          clientId: client.id,
          note: payForm.note.trim() || null,
          occurredOn: payForm.date,
          planId: selectedPlan.id,
        }),
      });
      await requireSuccess(response);
      setIsAddingPayment(false);
      window.dispatchEvent(new CustomEvent('dashboard:refresh-client', { detail: { clientId: client.id } }));
      const currency = selectedPlan.currency === 'TRY' ? 'TL' : selectedPlan.currency;
      triggerToast(amount.toLocaleString('tr-TR') + ' ' + currency + ' ödeme kaydedildi.');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.', 'error');
    }
  };

  // Add a document`,
    "Persist simple plan payment",
  );
  source = replaceRequired(
    source,
    `<span>Ödeme Taksitleri ve Tahsilat Geçmişi</span>`,
    `<span>Plan Ödemeleri ve Tahsilat Geçmişi</span>`,
    "Payment section heading",
  );
  source = source.replace(`>Aktif Kullanımda</span>`, `>{p.status}</span>`);
  source = source
    .replace(
      `{client.payments.totalPlanAmount.toLocaleString('tr-TR')} TL</span>`,
      `{client.payments.totalPlanAmount.toLocaleString('tr-TR')} {clientPaymentCurrencyLabel}</span>`,
    )
    .replace(
      `{client.payments.paidAmount.toLocaleString('tr-TR')} TL</span>`,
      `{client.payments.paidAmount.toLocaleString('tr-TR')} {clientPaymentCurrencyLabel}</span>`,
    )
    .replace(
      `{client.payments.remainingAmount.toLocaleString('tr-TR')} TL</span>`,
      `{client.payments.remainingAmount.toLocaleString('tr-TR')} {clientPaymentCurrencyLabel}</span>`,
    );
  source = replaceRegexRequired(
    source,
    /              \{\/\* Installments & History \*\/\}[\s\S]*?\n            \{\/\* Ödeme ekle panel \*\/\}/,
    `              {/* Open plans & payment history */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                <div className="flex flex-col gap-3">
                  <span className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-50 pb-1.5">ÖDEME YAPILABİLECEK PLANLAR</span>
                  {paymentPlanOptions.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Ödenecek bakiyesi olan plan bulunmuyor.</span>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {paymentPlanOptions.map((plan) => {
                        const currency = plan.currency === 'TRY' ? 'TL' : plan.currency;
                        const remaining = Math.round(Number(plan.outstandingMinor) / 100).toLocaleString('tr-TR');
                        return (
                          <div key={plan.id} className="p-3 bg-gray-50/60 border border-gray-150 rounded-xl flex justify-between items-center gap-3">
                            <span className="font-bold text-gray-900">{plan.planName}</span>
                            <span className="text-[10px] font-black text-rose-600">Kalan: {remaining} {currency}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-50 pb-1.5">ÖDEME GEÇMİŞİ</span>
                  {client.payments.history.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Henüz bir ödeme kaydedilmedi.</span>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {client.payments.history.map((record, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-1 hover:shadow-2xs transition-all">
                          <div className="flex justify-between items-center gap-3">
                            <span className="font-black text-emerald-600">+{record.amount.toLocaleString('tr-TR')} {clientPaymentCurrencyLabel}</span>
                            <span className="text-[9px] font-black text-gray-700 text-right">{record.planName || 'Plan bilgisi yok'}</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[10px] text-gray-400 font-bold">
                            <span>{record.date}</span>
                            {record.note && <span className="text-gray-600 text-right">{record.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ödeme ekle panel */}`,
    "Simple payment summary UI",
  );
  source = replaceRequired(
    source,
    `                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Alınan Tutar (TL)</label>
                    <input type="number" required value={payForm.amount} onChange={e => setPayForm({...payForm, amount: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-black text-gray-900 focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <CustomSelect
                      label="Ödeme Türü"
                      options={paymentTypeOptions}
                      value={payForm.type}
                      onChange={val => setPayForm({...payForm, type: val as any})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 font-bold mb-1">Ödeme Notu</label>
                    <input type="text" required value={payForm.note} onChange={e => setPayForm({...payForm, note: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-900 focus:outline-none focus:border-black" />
                  </div>
                </div>`,
    `                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <CustomSelect
                    label="Plan"
                    options={paymentPlanOptions.map((plan) => ({
                      value: plan.id,
                      label: plan.planName + ' — Kalan ' + Math.round(Number(plan.outstandingMinor) / 100).toLocaleString('tr-TR') + ' ' + (plan.currency === 'TRY' ? 'TL' : plan.currency),
                    }))}
                    value={payForm.planId}
                    onChange={(value) => setPayForm({ ...payForm, planId: value })}
                  />
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Alınan Tutar</label>
                    <input type="number" min="0.01" step="0.01" required value={payForm.amount || ''} onChange={(event) => setPayForm({ ...payForm, amount: Number(event.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-black text-gray-900 focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Ödeme Tarihi</label>
                    <CustomDatePicker required value={payForm.date} onChange={(value) => setPayForm({ ...payForm, date: value })} />
                  </div>
                  <div>
                    <label className="block text-gray-500 font-bold mb-1">Not</label>
                    <input type="text" value={payForm.note} onChange={(event) => setPayForm({ ...payForm, note: event.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-900 focus:outline-none focus:border-black" />
                  </div>
                </div>`,
    "Simple payment fields",
  );
  return source;
});
