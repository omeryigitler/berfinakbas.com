'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface FinanceOverview {
  clients: Array<{ firstName: string; id: string; lastName: string; status: string }>;
  paymentMethods: Array<{ id: string; key: string; name: string; status: string }>;
  plans: Array<{
    balanceMinor: string;
    client: { firstName: string; lastName: string };
    clientId: string;
    currency: string;
    id: string;
    installments: Array<{
      amountDueMinor: string;
      dueDate: string;
      id: string;
      paidAmountMinor: string;
      sequence: number;
      state: 'DUE' | 'OVERDUE' | 'PAID' | 'PARTIALLY_PAID';
    }>;
    invoiceReference: string | null;
    invoiceStatus: string;
    ledgerEntries: Array<{
      amountMinor: string;
      id: string;
      occurredAt: string;
      reversesEntryId: string | null;
      type: string;
    }>;
    name: string;
    remainingSessions: string;
    status: string;
    totalAmountMinor: string;
  }>;
}

type ModalType = 'plan' | 'payment' | null;

const installmentLabels: Record<string, string> = {
  DUE: 'Bekliyor',
  OVERDUE: 'Gecikmiş',
  PAID: 'Ödendi',
  PARTIALLY_PAID: 'Kısmi ödeme',
};

function formatMoney(amountMinor: string, currency: string) {
  return new Intl.NumberFormat('tr-TR', {
    currency,
    style: 'currency',
  }).format(Number(amountMinor) / 100);
}

function toMinor(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return Math.round(amount * 100).toString();
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export default function OdemelerPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/finance?status=ALL', {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: FinanceOverview };
      setOverview(payload.data);
      setSelectedPlanId((current) => current || payload.data.plans[0]?.id || '');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Finans verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOverview]);

  const selectedPlan = useMemo(
    () => overview?.plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [overview, selectedPlanId],
  );

  const payableInstallments = selectedPlan?.installments.filter((installment) => installment.state !== 'PAID') ?? [];
  const activePlans = overview?.plans.filter((plan) => plan.status === 'ACTIVE').length ?? 0;
  const overdueCount = overview?.plans.reduce(
    (total, plan) => total + plan.installments.filter((installment) => installment.state === 'OVERDUE').length,
    0,
  ) ?? 0;
  const openBalanceByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const plan of overview?.plans ?? []) {
      totals.set(plan.currency, (totals.get(plan.currency) ?? 0) + Number(plan.balanceMinor));
    }
    return [...totals.entries()].map(([currency, value]) => formatMoney(String(value), currency)).join(' + ') || '—';
  }, [overview]);

  async function financeOperation(body: unknown) {
    const response = await fetch('/api/admin/finance', {
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': crypto.randomUUID(),
      },
      method: 'POST',
    });
    if (!response.ok) throw new Error(await readError(response));
    return response.json();
  }

  async function ensurePaymentMethod() {
    if ((overview?.paymentMethods.length ?? 0) > 0) return;
    await financeOperation({
      action: 'CREATE_PAYMENT_METHOD',
      key: 'CASH',
      name: 'Nakit',
      reason: 'Dashboard varsayılan ödeme yöntemi kurulumu',
      sortOrder: 0,
    });
    await loadOverview();
  }

  async function openPayment(planId: string) {
    setSelectedPlanId(planId);
    setMessage('');
    setModal('payment');
    try {
      await ensurePaymentMethod();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ödeme yöntemi hazırlanamadı.');
    }
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amountMinor = toMinor(formData.get('amount'));
    if (!amountMinor) {
      setMessage('Plan tutarını kontrol edin.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await financeOperation({
        action: 'CREATE_PLAN',
        clientId: String(formData.get('clientId') ?? ''),
        currency: String(formData.get('currency') ?? 'EUR').toUpperCase(),
        idempotencyKey: crypto.randomUUID(),
        installments: [
          {
            amountMinor,
            dueDate: String(formData.get('dueDate') ?? ''),
            sequence: 1,
          },
        ],
        invoiceStatus: 'NOT_REQUIRED',
        name: String(formData.get('name') ?? '').trim(),
        reason: 'Dashboard üzerinden danışan planı oluşturuldu',
        sessionCount: Number(formData.get('sessionCount') ?? 1),
        sessionDurationMinutes: Number(formData.get('sessionDurationMinutes') ?? 45),
        source: 'CUSTOM',
        totalAmountMinor: amountMinor,
        validFrom: String(formData.get('validFrom') ?? ''),
        validUntil: String(formData.get('validUntil') ?? '') || null,
      });
      setModal(null);
      await loadOverview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Plan oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan || !overview) return;
    const formData = new FormData(event.currentTarget);
    const installmentId = String(formData.get('installmentId') ?? '');
    const installment = selectedPlan.installments.find((item) => item.id === installmentId);
    const amountMinor = toMinor(formData.get('amount'));
    if (!installment || !amountMinor) {
      setMessage('Taksit ve ödeme tutarını kontrol edin.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await financeOperation({
        action: 'RECORD_PAYMENT',
        amountMinor,
        clientId: selectedPlan.clientId,
        currency: selectedPlan.currency,
        externalReference: String(formData.get('externalReference') ?? '').trim() || null,
        idempotencyKey: crypto.randomUUID(),
        installmentId,
        note: String(formData.get('note') ?? '').trim() || null,
        occurredAt: new Date().toISOString(),
        paymentMethodId: String(formData.get('paymentMethodId') ?? ''),
        planId: selectedPlan.id,
        reason: 'Dashboard üzerinden danışan ödemesi kaydedildi',
      });
      setModal(null);
      await loadOverview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ödeme kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={styles.page}>
        <section style={styles.headerCard}>
          <div>
            <span style={styles.kicker}>FİNANS OPERASYONU</span>
            <h1 style={styles.title}>Ödemeler ve planlar</h1>
            <p style={styles.subtitle}>Danışan planları, taksitler ve ödeme hareketleri.</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => void loadOverview()} style={styles.secondaryButton} type="button">Yenile</button>
            <button onClick={() => { setMessage(''); setModal('plan'); }} style={styles.primaryButton} type="button">Yeni plan</button>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Aktif plan</span><strong style={styles.summaryValue}>{activePlans}</strong><small style={styles.summaryMeta}>Devam eden danışan planı</small></article>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Gecikmiş taksit</span><strong style={styles.summaryValue}>{overdueCount}</strong><small style={styles.summaryMeta}>Vadesi geçmiş açık ödeme</small></article>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Açık bakiye</span><strong style={styles.balanceValue}>{openBalanceByCurrency}</strong><small style={styles.summaryMeta}>Plan bazlı net bakiye</small></article>
        </section>

        {message && !modal ? <div style={styles.message}>{message}</div> : null}

        <section style={styles.listPanel}>
          <div style={styles.listHeader}><h2 style={styles.listTitle}>Danışan planları</h2><span style={styles.badge}>CANLI VERİ</span></div>
          <div style={styles.planGrid}>
            {loading ? <p style={styles.empty}>Finans verileri yükleniyor...</p> : null}
            {!loading && (overview?.plans.length ?? 0) === 0 ? <p style={styles.empty}>Henüz ödeme planı bulunmuyor.</p> : null}
            {overview?.plans.map((plan) => (
              <article key={plan.id} style={styles.planCard}>
                <div style={styles.planHeader}>
                  <div><strong style={styles.planName}>{plan.name}</strong><span style={styles.clientName}>{plan.client.firstName} {plan.client.lastName}</span></div>
                  <span style={{ ...styles.statusPill, ...(plan.status === 'ACTIVE' ? styles.statusActive : styles.statusNeutral) }}>{plan.status}</span>
                </div>
                <div style={styles.planStats}>
                  <div><span>Toplam</span><strong>{formatMoney(plan.totalAmountMinor, plan.currency)}</strong></div>
                  <div><span>Açık bakiye</span><strong>{formatMoney(plan.balanceMinor, plan.currency)}</strong></div>
                  <div><span>Kalan seans</span><strong>{plan.remainingSessions}</strong></div>
                </div>
                <div style={styles.installmentList}>
                  {plan.installments.map((installment) => (
                    <div key={installment.id} style={styles.installmentRow}>
                      <div><strong>Taksit {installment.sequence}</strong><span>{installment.dueDate}</span></div>
                      <div style={styles.installmentRight}><strong>{formatMoney(installment.amountDueMinor, plan.currency)}</strong><span style={{ ...styles.installmentState, ...(installment.state === 'OVERDUE' ? styles.stateOverdue : installment.state === 'PAID' ? styles.statePaid : styles.stateDue) }}>{installmentLabels[installment.state]}</span></div>
                    </div>
                  ))}
                </div>
                <div style={styles.cardActions}>
                  <button disabled={plan.status !== 'ACTIVE' || plan.installments.every((item) => item.state === 'PAID')} onClick={() => void openPayment(plan.id)} style={styles.primaryButton} type="button">Ödeme kaydet</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {modal === 'plan' ? (
        <div style={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="plan-olustur" aria-modal="true" role="dialog" style={styles.modal}>
            <div style={styles.modalHeader}><div><span style={styles.kicker}>YENİ PLAN</span><h2 id="plan-olustur" style={styles.modalTitle}>Ödeme planı oluştur</h2></div><button onClick={() => setModal(null)} style={styles.closeButton} type="button">×</button></div>
            <form onSubmit={createPlan} style={styles.form}>
              <div style={styles.formGrid}>
                <label style={styles.field}><span>Danışan</span><select name="clientId" required style={styles.input}><option value="">Danışan seçin</option>{overview?.clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></label>
                <label style={styles.field}><span>Plan adı</span><input defaultValue="Terapi Paketi" name="name" required style={styles.input} /></label>
                <label style={styles.field}><span>Seans sayısı</span><input defaultValue="4" min="1" name="sessionCount" required style={styles.input} type="number" /></label>
                <label style={styles.field}><span>Seans süresi</span><select defaultValue="45" name="sessionDurationMinutes" style={styles.input}><option value="15">15 dakika</option><option value="30">30 dakika</option><option value="45">45 dakika</option><option value="60">60 dakika</option></select></label>
                <label style={styles.field}><span>Toplam tutar</span><input min="0.01" name="amount" required step="0.01" style={styles.input} type="number" /></label>
                <label style={styles.field}><span>Para birimi</span><select defaultValue="EUR" name="currency" style={styles.input}><option value="EUR">EUR</option><option value="TRY">TRY</option><option value="GBP">GBP</option><option value="USD">USD</option></select></label>
                <label style={styles.field}><span>Başlangıç</span><input defaultValue={today()} name="validFrom" required style={styles.input} type="date" /></label>
                <label style={styles.field}><span>Bitiş</span><input defaultValue={plusDays(90)} name="validUntil" style={styles.input} type="date" /></label>
                <label style={styles.field}><span>İlk taksit vadesi</span><input defaultValue={today()} name="dueDate" required style={styles.input} type="date" /></label>
              </div>
              {message ? <div style={styles.message}>{message}</div> : null}
              <div style={styles.modalActions}><button onClick={() => setModal(null)} style={styles.secondaryButton} type="button">Vazgeç</button><button disabled={submitting} style={styles.primaryButton} type="submit">{submitting ? 'Oluşturuluyor...' : 'Planı oluştur'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === 'payment' && selectedPlan ? (
        <div style={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="odeme-kaydet" aria-modal="true" role="dialog" style={styles.modal}>
            <div style={styles.modalHeader}><div><span style={styles.kicker}>ÖDEME</span><h2 id="odeme-kaydet" style={styles.modalTitle}>{selectedPlan.client.firstName} {selectedPlan.client.lastName}</h2></div><button onClick={() => setModal(null)} style={styles.closeButton} type="button">×</button></div>
            <form onSubmit={recordPayment} style={styles.form}>
              <div style={styles.formGrid}>
                <label style={styles.field}><span>Plan</span><select onChange={(event) => setSelectedPlanId(event.target.value)} style={styles.input} value={selectedPlanId}>{overview?.plans.filter((plan) => plan.status === 'ACTIVE').map((plan) => <option key={plan.id} value={plan.id}>{plan.client.firstName} {plan.client.lastName} • {plan.name}</option>)}</select></label>
                <label style={styles.field}><span>Taksit</span><select name="installmentId" required style={styles.input}><option value="">Taksit seçin</option>{payableInstallments.map((installment) => <option key={installment.id} value={installment.id}>Taksit {installment.sequence} • {formatMoney(String(Number(installment.amountDueMinor) - Number(installment.paidAmountMinor)), selectedPlan.currency)} açık</option>)}</select></label>
                <label style={styles.field}><span>Ödeme tutarı</span><input min="0.01" name="amount" required step="0.01" style={styles.input} type="number" /></label>
                <label style={styles.field}><span>Ödeme yöntemi</span><select name="paymentMethodId" required style={styles.input}><option value="">Yöntem seçin</option>{overview?.paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
                <label style={styles.field}><span>Referans</span><input name="externalReference" style={styles.input} /></label>
              </div>
              <label style={styles.field}><span>Not</span><textarea maxLength={500} name="note" style={styles.textarea} /></label>
              {message ? <div style={styles.message}>{message}</div> : null}
              <div style={styles.modalActions}><button onClick={() => setModal(null)} style={styles.secondaryButton} type="button">Vazgeç</button><button disabled={submitting} style={styles.primaryButton} type="submit">{submitting ? 'Kaydediliyor...' : 'Ödemeyi kaydet'}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const styles = {
  page: { display: 'grid', gap: 18 },
  headerCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, border: '1px solid rgba(50,49,48,.12)', borderRadius: 28, background: 'linear-gradient(135deg,#fff 0%,#faf9f5 68%,#efffc3 100%)', padding: 24 },
  kicker: { display: 'inline-flex', width: 'fit-content', borderRadius: 999, background: '#050505', padding: '5px 9px', color: '#dfff65', fontSize: 8, fontWeight: 800, letterSpacing: '.07em' },
  title: { margin: '10px 0 4px', color: '#151413', fontSize: 28, letterSpacing: '-.04em' },
  subtitle: { margin: 0, color: '#77727d', fontSize: 13 },
  headerActions: { display: 'flex', gap: 8 },
  primaryButton: { minHeight: 38, border: '1px solid #050505', borderRadius: 999, background: '#050505', padding: '0 16px', color: '#fff', font: 'inherit', fontSize: 11, fontWeight: 750, cursor: 'pointer' },
  secondaryButton: { minHeight: 38, border: '1px solid rgba(50,49,48,.15)', borderRadius: 999, background: '#fff', padding: '0 16px', color: '#4e4a46', font: 'inherit', fontSize: 11, fontWeight: 750, cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
  summaryCard: { display: 'grid', gap: 8, border: '1px solid rgba(50,49,48,.12)', borderRadius: 22, background: '#fff', padding: 20 },
  summaryLabel: { color: '#9692a0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const },
  summaryValue: { color: '#151413', fontSize: 32, lineHeight: 1 },
  balanceValue: { color: '#151413', fontSize: 19, lineHeight: 1.2 },
  summaryMeta: { color: '#77727d', fontSize: 11 },
  listPanel: { border: '1px solid rgba(50,49,48,.12)', borderRadius: 24, background: '#fff', padding: 20 },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(50,49,48,.08)', paddingBottom: 12 },
  listTitle: { margin: 0, color: '#151413', fontSize: 15 },
  badge: { borderRadius: 999, background: '#efffc3', padding: '4px 8px', color: '#263000', fontSize: 8, fontWeight: 800 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 14 },
  planCard: { display: 'grid', gap: 14, border: '1px solid rgba(50,49,48,.12)', borderRadius: 20, background: '#faf9f7', padding: 16 },
  planHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  planName: { display: 'block', color: '#171615', fontSize: 14 },
  clientName: { display: 'block', marginTop: 3, color: '#77727d', fontSize: 10 },
  statusPill: { borderRadius: 999, padding: '4px 8px', fontSize: 8, fontWeight: 800 },
  statusActive: { background: '#efffc3', color: '#263000' },
  statusNeutral: { background: '#f0efed', color: '#77727d' },
  planStats: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 },
  installmentList: { display: 'grid', gap: 8 },
  installmentRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 12, background: '#fff', padding: 10, color: '#171615', fontSize: 10 },
  installmentRight: { display: 'grid', justifyItems: 'end', gap: 4 },
  installmentState: { borderRadius: 999, padding: '3px 7px', fontSize: 8, fontWeight: 800 },
  stateOverdue: { background: '#fff7ed', color: '#9a3412' },
  statePaid: { background: '#efffc3', color: '#263000' },
  stateDue: { background: '#f0efed', color: '#77727d' },
  cardActions: { display: 'flex', justifyContent: 'flex-end' },
  empty: { margin: 0, color: '#77727d', fontSize: 12 },
  message: { borderRadius: 12, background: '#fff7ed', padding: '10px 12px', color: '#9a3412', fontSize: 11 },
  modalBackdrop: { position: 'fixed' as const, inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(5,5,5,.42)', padding: 24 },
  modal: { width: 'min(100%,760px)', maxHeight: 'calc(100vh - 48px)', overflow: 'auto', borderRadius: 24, background: '#fff', padding: 22, boxShadow: '0 28px 80px rgba(5,5,5,.22)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(50,49,48,.1)', paddingBottom: 14 },
  modalTitle: { margin: '8px 0 0', color: '#151413', fontSize: 22 },
  closeButton: { display: 'grid', width: 32, height: 32, placeItems: 'center', border: '1px solid rgba(50,49,48,.14)', borderRadius: '50%', background: '#fff', cursor: 'pointer' },
  form: { display: 'grid', gap: 16, marginTop: 18 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  field: { display: 'grid', gap: 7, color: '#77727d', fontSize: 10, fontWeight: 750 },
  input: { width: '100%', border: '1px solid rgba(50,49,48,.14)', borderRadius: 12, background: '#faf9f7', padding: '10px 12px', color: '#171615', font: 'inherit', fontSize: 12, outline: 0 },
  textarea: { width: '100%', minHeight: 100, resize: 'vertical' as const, border: '1px solid rgba(50,49,48,.14)', borderRadius: 12, background: '#faf9f7', padding: '10px 12px', color: '#171615', font: 'inherit', fontSize: 12, outline: 0 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
};