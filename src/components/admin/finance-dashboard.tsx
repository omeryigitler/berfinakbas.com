"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import "./finance-friendly-copy.module.css";
import { DateControl } from "./date-control";
import { SelectControl } from "./select-control";

type Client = { firstName: string; id: string; lastName: string; status: string };
type PaymentMethod = { id: string; key: string; name: string; status: string };
type LedgerEntry = {
  amountMinor: string;
  id: string;
  occurredAt: string;
  reversesEntryId: string | null;
  type: string;
};
type Installment = {
  amountDueMinor: string;
  dueDate: string;
  id: string;
  paidAmountMinor: string;
  sequence: number;
  state: "DUE" | "OVERDUE" | "PAID" | "PARTIALLY_PAID";
};
type Plan = {
  balanceMinor: string;
  client: { firstName: string; lastName: string };
  clientId: string;
  currency: string;
  id: string;
  installments: Installment[];
  invoiceReference: string | null;
  invoiceStatus: "NOT_REQUIRED" | "PENDING" | "ISSUED" | "SENT_TO_ACCOUNTING" | "CANCELLED";
  ledgerEntries: LedgerEntry[];
  name: string;
  remainingSessions: string;
  status: string;
  totalAmountMinor: string;
};
type Overview = { clients: Client[]; paymentMethods: PaymentMethod[]; plans: Plan[] };
type ApiResponse<T> = { code?: string; data?: T; error?: string };
type InstallmentDraft = { amount: string; dueDate: string };

const installmentStateLabels = {
  DUE: "Bekliyor",
  OVERDUE: "Gecikmiş",
  PAID: "Ödendi",
  PARTIALLY_PAID: "Kısmi ödendi",
};

const invoiceStatusLabels = {
  CANCELLED: "Belge iptal edildi",
  ISSUED: "Belge oluşturuldu",
  NOT_REQUIRED: "Belge gerekmiyor",
  PENDING: "Belge bekliyor",
  SENT_TO_ACCOUNTING: "Muhasebeye gönderildi",
} as const;

const financeEntryLabels = {
  ACCRUAL: "Plan borcu",
  ADJUSTMENT: "Düzeltme",
  PAYMENT: "Ödeme",
  REFUND: "İade",
  REVERSAL: "Dengeleyici kayıt",
} as const;

const planStatusLabels = {
  ACTIVE: "Aktif",
  CANCELLED: "İptal",
  COMPLETED: "Tamamlandı",
  EXPIRED: "Süresi doldu",
} as const;

const dueFilterOptions = [
  { label: "Tümü", value: "ALL" },
  { label: "Gecikmiş", value: "OVERDUE" },
  { label: "7 gün içinde", value: "DUE_7_DAYS" },
];

const initialInvoiceStatusOptions = [
  { label: "Belge gerekmiyor", value: "NOT_REQUIRED" },
  { label: "Belge bekliyor", value: "PENDING" },
];

const invoiceStatusOptions = [
  { label: "Belge gerekmiyor", value: "NOT_REQUIRED" },
  { label: "Belge bekliyor", value: "PENDING" },
  { label: "Belge oluşturuldu", value: "ISSUED" },
  { label: "Muhasebeye gönderildi", value: "SENT_TO_ACCOUNTING" },
  { label: "Belge iptal edildi", value: "CANCELLED" },
];

export function amountToMinor(value: string): string | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return minor > 0n ? minor.toString() : null;
}

export function formatMoney(amountMinor: string, currency: string): string {
  const amount = BigInt(amountMinor);
  const absolute = amount < 0n ? -amount : amount;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const formatter = new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  });
  const formatted = formatter
    .formatToParts(absolute / 100n)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
  return amount < 0n ? `-${formatted}` : formatted;
}

function minorToInput(amountMinor: string): string {
  const amount = BigInt(amountMinor);
  return `${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`;
}

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { error: "Beklenmeyen bir sunucu yanıtı alındı." };
  }
}

async function requestFinanceOverview(
  status: "ALL" | "DUE_7_DAYS" | "OVERDUE",
  clientId: string,
  signal?: AbortSignal,
): Promise<Overview> {
  const params = new URLSearchParams({ status });
  if (clientId) params.set("clientId", clientId);
  const response = await fetch(`/api/admin/finance?${params.toString()}`, {
    cache: "no-store",
    signal,
  });
  const payload = await readResponse<Overview>(response);
  if (!response.ok || !payload.data) throw new Error(payload.error);
  return payload.data;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function selectedClientLabel(clients: Client[], clientId: string): string {
  const client = clients.find((item) => item.id === clientId);
  return client ? `${client.firstName} ${client.lastName}` : "Seçili danışan";
}

export function FinanceDashboard({
  canManage,
  clientId = "",
}: {
  canManage: boolean;
  clientId?: string;
}) {
  const [overview, setOverview] = useState<Overview>({
    clients: [],
    paymentMethods: [],
    plans: [],
  });
  const [filter, setFilter] = useState<"ALL" | "DUE_7_DAYS" | "OVERDUE">("ALL");
  const [planStatusFilter, setPlanStatusFilter] = useState("ALL");
  const [invoiceFilter, setInvoiceFilter] = useState("ALL");
  const [financeSearch, setFinanceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [installments, setInstallments] = useState<InstallmentDraft[]>([
    { amount: "", dueDate: today() },
  ]);
  const [paymentPlanId, setPaymentPlanId] = useState("");
  const [reverseDialog, setReverseDialog] = useState<{
    entryId: string;
    error: string;
    reason: string;
  } | null>(null);

  const isFilteredByClient = clientId.length > 0;

  const load = useCallback(
    async (status: typeof filter) => {
      try {
        setOverview(await requestFinanceOverview(status, clientId));
      } catch (error) {
        setMessage(
          error instanceof Error && error.message ? error.message : "Finans özeti yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestFinanceOverview(filter, clientId, controller.signal)
      .then(setOverview)
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setMessage(
            error instanceof Error && error.message ? error.message : "Finans özeti yüklenemedi.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, clientId]);

  const reversedEntryIds = useMemo(
    () =>
      new Set(
        overview.plans.flatMap((plan) =>
          plan.ledgerEntries
            .map((entry) => entry.reversesEntryId)
            .filter((entryId): entryId is string => entryId !== null),
        ),
      ),
    [overview.plans],
  );
  const displayedPlans = useMemo(() => {
    const search = financeSearch.trim().toLocaleLowerCase("tr-TR");
    return overview.plans.filter((plan) => {
      if (planStatusFilter !== "ALL" && plan.status !== planStatusFilter) return false;
      if (invoiceFilter !== "ALL" && plan.invoiceStatus !== invoiceFilter) return false;
      if (!search) return true;
      return `${plan.client.firstName} ${plan.client.lastName} ${plan.name}`
        .toLocaleLowerCase("tr-TR")
        .includes(search);
    });
  }, [financeSearch, invoiceFilter, overview.plans, planStatusFilter]);
  const expectedPayments = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sevenDays = new Date(start.getTime() + 7 * 86_400_000);
    const thirtyDays = new Date(start.getTime() + 30 * 86_400_000);
    const rows = displayedPlans.flatMap((plan) =>
      plan.installments
        .filter((installment) => installment.state !== "PAID")
        .map((installment) => ({
          currency: plan.currency,
          dueDate: new Date(`${installment.dueDate}T00:00:00`),
          remaining: BigInt(installment.amountDueMinor) - BigInt(installment.paidAmountMinor),
          state: installment.state,
        })),
    );
    const summarize = (items: typeof rows) => {
      const totals = new Map<string, bigint>();
      items.forEach((item) =>
        totals.set(item.currency, (totals.get(item.currency) ?? 0n) + item.remaining),
      );
      return {
        count: items.length,
        label:
          [...totals]
            .map(([currency, amount]) => formatMoney(amount.toString(), currency))
            .join(" + ") || "₺0,00",
      };
    };
    return {
      overdue: summarize(rows.filter((item) => item.state === "OVERDUE")),
      sevenDays: summarize(
        rows.filter((item) => item.dueDate >= start && item.dueDate <= sevenDays),
      ),
      thirtyDays: summarize(
        rows.filter((item) => item.dueDate >= start && item.dueDate <= thirtyDays),
      ),
    };
  }, [displayedPlans]);
  const paymentPlan = overview.plans.find((plan) => plan.id === paymentPlanId);
  const clientOptions = [
    { label: "Seçin", value: "" },
    ...overview.clients.map((client) => ({
      label: `${client.firstName} ${client.lastName}`,
      value: client.id,
    })),
  ];

  async function operation(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/finance", {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json", "x-correlation-id": crypto.randomUUID() },
        method: "POST",
      });
      const payload = await readResponse<unknown>(response);
      if (!response.ok) throw new Error(payload.error);
      await load(filter);
      setMessage("İşlem kaydedildi.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "İşlem kaydedilemedi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const success = await operation({
      action: "CREATE_PAYMENT_METHOD",
      key: String(data.get("key") ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_"),
      name: String(data.get("name") ?? ""),
      reason: String(data.get("reason") ?? ""),
      sortOrder: 0,
    });
    if (success) form.reset();
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const converted = installments.map((installment, index) => ({
      amountMinor: amountToMinor(installment.amount),
      dueDate: installment.dueDate,
      sequence: index + 1,
    }));
    if (converted.some((installment) => !installment.amountMinor || !installment.dueDate)) {
      setMessage("Ödeme takvimindeki tutar ve tarih alanlarını kontrol edin.");
      return;
    }
    const selectedClientId = String(data.get("clientId") ?? "");
    const totalAmountMinor = converted.reduce(
      (total, installment) => total + BigInt(installment.amountMinor ?? "0"),
      0n,
    );
    const success = await operation({
      action: "CREATE_PLAN",
      clientId: selectedClientId,
      currency: String(data.get("currency") ?? "TRY").toUpperCase(),
      idempotencyKey: crypto.randomUUID(),
      installments: converted,
      invoiceStatus: String(data.get("invoiceStatus") ?? "NOT_REQUIRED"),
      name: String(data.get("name") ?? ""),
      reason: String(data.get("reason") ?? ""),
      sessionCount: Number(data.get("sessionCount")),
      sessionDurationMinutes: Number(data.get("sessionDurationMinutes")),
      source: "CUSTOM",
      totalAmountMinor: totalAmountMinor.toString(),
      validFrom: String(data.get("validFrom") ?? ""),
      validUntil: String(data.get("validUntil") ?? "") || null,
    });
    if (success) {
      form.reset();
      setInstallments([{ amount: "", dueDate: today() }]);
    }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const plan = overview.plans.find((item) => item.id === data.get("planId"));
    const amountMinor = amountToMinor(String(data.get("amount") ?? ""));
    if (!plan || !amountMinor) {
      setMessage("Plan ve ödeme tutarını kontrol edin.");
      return;
    }
    const success = await operation({
      action: "RECORD_PAYMENT",
      amountMinor,
      clientId: plan.clientId,
      currency: plan.currency,
      externalReference: String(data.get("externalReference") ?? "") || null,
      idempotencyKey: crypto.randomUUID(),
      installmentId: String(data.get("installmentId") ?? ""),
      note: null,
      occurredAt: new Date(`${String(data.get("occurredDate"))}T12:00:00.000Z`).toISOString(),
      paymentMethodId: String(data.get("paymentMethodId") ?? ""),
      planId: plan.id,
      reason: String(data.get("reason") ?? ""),
    });
    if (success) {
      form.reset();
      setPaymentPlanId("");
    }
  }

  async function updateInvoiceStatus(event: FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await operation({
      action: "UPDATE_INVOICE_STATUS",
      invoiceReference: String(data.get("invoiceReference") ?? "") || null,
      invoiceStatus: String(data.get("invoiceStatus") ?? "NOT_REQUIRED"),
      planId,
      reason: String(data.get("reason") ?? ""),
    });
  }

  async function updatePlanStatus(event: FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await operation({
      action: "UPDATE_PLAN_STATUS",
      planId,
      reason: String(data.get("reason") ?? ""),
      status: String(data.get("status") ?? "ACTIVE"),
    });
  }

  async function updateInstallment(event: FormEvent<HTMLFormElement>, installmentId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amountMinor = amountToMinor(String(data.get("amount") ?? ""));
    if (!amountMinor) {
      setMessage("Taksit tutarını kontrol edin.");
      return;
    }
    await operation({
      action: "UPDATE_INSTALLMENT",
      amountMinor,
      dueDate: String(data.get("dueDate") ?? ""),
      idempotencyKey: crypto.randomUUID(),
      installmentId,
      reason: String(data.get("reason") ?? ""),
    });
  }

  function openReversePayment(entryId: string) {
    setMessage("");
    setReverseDialog({ entryId, error: "", reason: "" });
  }

  async function submitReversePayment() {
    if (!reverseDialog) return;

    const reason = reverseDialog.reason.trim();
    if (reason.length < 8) {
      setReverseDialog((current) =>
        current ? { ...current, error: "Düzeltme notu en az 8 karakter olmalıdır." } : current,
      );
      return;
    }

    const entryId = reverseDialog.entryId;
    setReverseDialog(null);

    await operation({
      action: "REVERSE_PAYMENT",
      entryId,
      idempotencyKey: crypto.randomUUID(),
      reason,
    });
  }

  if (loading)
    return (
      <div className="admin-empty-state" aria-live="polite">
        Finans özeti yükleniyor…
      </div>
    );

  return (
    <div className="finance-dashboard">
      <div className="finance-toolbar">
        <label>
          <span>Danışan filtresi</span>
          <SelectControl
            name="clientFilter"
            onValueChange={(nextClientId) => {
              if (nextClientId === clientId) return;
              window.location.assign(
                nextClientId
                  ? `/yonetim/odemeler?clientId=${encodeURIComponent(nextClientId)}`
                  : "/yonetim/odemeler",
              );
            }}
            options={[
              { label: "Tüm danışanlar", value: "" },
              ...overview.clients.map((client) => ({
                label: `${client.firstName} ${client.lastName}`,
                value: client.id,
              })),
            ]}
            value={clientId}
          />
        </label>
        <label>
          <span>Vade filtresi</span>
          <SelectControl
            name="statusFilter"
            onValueChange={(nextValue) => {
              setLoading(true);
              setMessage("");
              setPaymentPlanId("");
              setFilter(nextValue as typeof filter);
            }}
            options={dueFilterOptions}
            value={filter}
          />
        </label>
        <label>
          <span>Plan durumu</span>
          <SelectControl
            name="planStatusFilter"
            onValueChange={setPlanStatusFilter}
            options={[
              { label: "Tümü", value: "ALL" },
              { label: "Aktif", value: "ACTIVE" },
              { label: "Tamamlandı", value: "COMPLETED" },
              { label: "İptal", value: "CANCELLED" },
              { label: "Süresi doldu", value: "EXPIRED" },
            ]}
            value={planStatusFilter}
          />
        </label>
        <label>
          <span>Fatura durumu</span>
          <SelectControl
            name="invoiceFilter"
            onValueChange={setInvoiceFilter}
            options={[{ label: "Tümü", value: "ALL" }, ...invoiceStatusOptions]}
            value={invoiceFilter}
          />
        </label>
        <label>
          <span>Danışan / plan ara</span>
          <input
            onChange={(event) => setFinanceSearch(event.target.value)}
            placeholder="Ad veya plan adı"
            type="search"
            value={financeSearch}
          />
        </label>
        <span>{displayedPlans.length} plan</span>
        {isFilteredByClient ? (
          <strong>{selectedClientLabel(overview.clients, clientId)} filtresi aktif</strong>
        ) : null}
      </div>

      <section aria-label="Beklenen ödeme özeti" className="finance-operation-grid">
        <article className="finance-operation-card">
          <small>Gecikmiş</small>
          <h3>{expectedPayments.overdue.label}</h3>
          <p>{expectedPayments.overdue.count} açık taksit</p>
        </article>
        <article className="finance-operation-card">
          <small>7 gün içinde beklenen</small>
          <h3>{expectedPayments.sevenDays.label}</h3>
          <p>{expectedPayments.sevenDays.count} açık taksit</p>
        </article>
        <article className="finance-operation-card">
          <small>30 gün içinde beklenen</small>
          <h3>{expectedPayments.thirtyDays.label}</h3>
          <p>{expectedPayments.thirtyDays.count} açık taksit</p>
        </article>
      </section>

      {canManage && (
        <div className="finance-operation-grid">
          <details className="finance-operation-card">
            <summary>Ödeme kanalı ekle</summary>
            <p className="finance-operation-help">
              Nakit, banka havalesi veya POS gibi ödeme seçeneklerini bir kez tanımlayın.
            </p>
            <form onSubmit={createMethod}>
              <label>
                Ödeme kanalı adı
                <input name="name" placeholder="Örn. Banka havalesi" required />
              </label>
              <label>
                Kısa kod
                <input
                  name="key"
                  pattern="[A-Za-z][A-Za-z0-9 _-]+"
                  placeholder="Örn. BANKA"
                  required
                />
              </label>
              <label>
                İşlem notu
                <textarea
                  minLength={8}
                  name="reason"
                  placeholder="Bu kanal neden eklendi?"
                  required
                />
              </label>
              <button disabled={busy} type="submit">
                Kanalı kaydet
              </button>
            </form>
          </details>
          <details className="finance-operation-card">
            <summary>
              {isFilteredByClient ? "Bu danışana plan oluştur" : "Danışan planı oluştur"}
            </summary>
            <p className="finance-operation-help">
              Seans sayısı, toplam ücret ve ödeme takvimini tek plan altında oluşturun.
            </p>
            <form onSubmit={createPlan}>
              <label>
                Danışan
                <SelectControl
                  defaultValue={clientId}
                  disabled={isFilteredByClient && overview.clients.length === 1}
                  name="clientId"
                  options={clientOptions}
                  required
                />
              </label>
              <label>
                Plan adı
                <input name="name" placeholder="Örn. 8 seanslık konuşma terapisi planı" required />
              </label>
              <div className="finance-inline-fields">
                <label>
                  Seans sayısı
                  <input min="1" name="sessionCount" placeholder="8" required type="number" />
                </label>
                <label>
                  Seans süresi / dk
                  <input
                    min="5"
                    name="sessionDurationMinutes"
                    placeholder="45"
                    required
                    type="number"
                  />
                </label>
                <label>
                  Para birimi
                  <input defaultValue="TRY" maxLength={3} name="currency" required />
                </label>
              </div>
              <div className="finance-inline-fields">
                <label>
                  Plan başlangıcı
                  <DateControl defaultValue={today()} name="validFrom" required />
                </label>
                <label>
                  Plan bitişi / opsiyonel
                  <DateControl name="validUntil" />
                </label>
                <label>
                  Fatura / belge durumu
                  <SelectControl
                    defaultValue="NOT_REQUIRED"
                    name="invoiceStatus"
                    options={initialInvoiceStatusOptions}
                  />
                </label>
              </div>
              <fieldset className="finance-installment-editor">
                <legend>Ödeme takvimi</legend>
                {installments.map((installment, index) => (
                  <div className="finance-inline-fields" key={index}>
                    <label>
                      Ödenecek tutar
                      <input
                        inputMode="decimal"
                        onChange={(event) =>
                          setInstallments((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, amount: event.target.value } : item,
                            ),
                          )
                        }
                        placeholder="2500"
                        required
                        value={installment.amount}
                      />
                    </label>
                    <label>
                      Son ödeme tarihi
                      <DateControl
                        name={`installmentDueDate-${index}`}
                        onValueChange={(nextValue) =>
                          setInstallments((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, dueDate: nextValue } : item,
                            ),
                          )
                        }
                        required
                        value={installment.dueDate}
                      />
                    </label>
                    {installments.length > 1 && (
                      <button
                        onClick={() =>
                          setInstallments((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        type="button"
                      >
                        Satırı kaldır
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() =>
                    setInstallments((current) => [...current, { amount: "", dueDate: today() }])
                  }
                  type="button"
                >
                  Ödeme satırı ekle
                </button>
              </fieldset>
              <label>
                İşlem notu
                <textarea
                  minLength={8}
                  name="reason"
                  placeholder="Plan neden oluşturuldu?"
                  required
                />
              </label>
              <button
                disabled={busy || (isFilteredByClient && overview.clients.length === 0)}
                type="submit"
              >
                Planı oluştur
              </button>
            </form>
          </details>
          <details className="finance-operation-card">
            <summary>{isFilteredByClient ? "Bu danışana ödeme kaydet" : "Ödeme kaydet"}</summary>
            <p className="finance-operation-help">
              Alınan ödemeyi doğru plan ve taksite bağlayın; kayıt silinmeden geçmişte kalır.
            </p>
            <form onSubmit={recordPayment}>
              <label>
                Plan
                <SelectControl
                  name="planId"
                  onValueChange={setPaymentPlanId}
                  options={[
                    { label: "Seçin", value: "" },
                    ...overview.plans
                      .filter((plan) => plan.status === "ACTIVE")
                      .map((plan) => ({
                        label: `${plan.client.firstName} ${plan.client.lastName} · ${plan.name}`,
                        value: plan.id,
                      })),
                  ]}
                  required
                  value={paymentPlanId}
                />
              </label>
              <label>
                Ödenen taksit
                <SelectControl
                  disabled={!paymentPlan}
                  key={paymentPlanId || "no-payment-plan"}
                  name="installmentId"
                  options={[
                    { label: "Seçin", value: "" },
                    ...(paymentPlan?.installments
                      .filter((item) => item.state !== "PAID")
                      .map((item) => ({
                        label: `${item.sequence}. taksit · kalan ${formatMoney(
                          (BigInt(item.amountDueMinor) - BigInt(item.paidAmountMinor)).toString(),
                          paymentPlan.currency,
                        )}`,
                        value: item.id,
                      })) ?? []),
                  ]}
                  required
                />
              </label>
              <label>
                Ödeme kanalı
                <SelectControl
                  name="paymentMethodId"
                  options={[
                    { label: "Seçin", value: "" },
                    ...overview.paymentMethods.map((method) => ({
                      label: method.name,
                      value: method.id,
                    })),
                  ]}
                  required
                />
              </label>
              <div className="finance-inline-fields">
                <label>
                  Alınan tutar
                  <input inputMode="decimal" name="amount" placeholder="2500" required />
                </label>
                <label>
                  Ödeme tarihi
                  <DateControl defaultValue={today()} name="occurredDate" required />
                </label>
              </div>
              <label>
                Makbuz / banka referansı
                <input name="externalReference" placeholder="Opsiyonel" />
              </label>
              <label>
                İşlem notu
                <textarea minLength={8} name="reason" placeholder="Ödeme nasıl alındı?" required />
              </label>
              <button disabled={busy || overview.paymentMethods.length === 0} type="submit">
                Ödemeyi kaydet
              </button>
            </form>
          </details>
        </div>
      )}

      <p className="finance-message" aria-live="polite">
        {message}
      </p>

      {reverseDialog ? (
        <div className="admin-modal-backdrop" role="presentation">
          <div
            aria-labelledby="reverse-payment-title"
            aria-modal="true"
            className="admin-modal"
            role="dialog"
          >
            <div className="admin-modal-heading">
              <p className="section-kicker">Ödeme düzeltme</p>
              <h2 id="reverse-payment-title">Ödemeyi düzeltme kaydıyla geri al</h2>
              <p>
                Orijinal ödeme silinmez. Sistem aynı tutarda dengeleyici kayıt oluşturarak geçmişi
                korur.
              </p>
            </div>

            <label className="admin-modal-field">
              Düzeltme notu
              <textarea
                autoFocus
                minLength={8}
                onChange={(event) =>
                  setReverseDialog((current) =>
                    current ? { ...current, error: "", reason: event.target.value } : current,
                  )
                }
                placeholder="Örn. Yanlış taksite işlendiği için ödeme geri alındı."
                value={reverseDialog.reason}
              />
            </label>

            {reverseDialog.error ? (
              <p className="admin-modal-error">{reverseDialog.error}</p>
            ) : null}

            <div className="admin-modal-actions">
              <button disabled={busy} onClick={() => setReverseDialog(null)} type="button">
                Vazgeç
              </button>
              <button disabled={busy} onClick={() => void submitReversePayment()} type="button">
                Düzeltme kaydı oluştur
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {displayedPlans.length === 0 ? (
        <div className="admin-empty-state">
          <strong>{isFilteredByClient ? "Bu danışanda plan yok" : "Bu filtrede plan yok"}</strong>
          <span>
            {isFilteredByClient
              ? "Bu danışana yeni plan oluşturabilir veya vade filtresini değiştirebilirsiniz."
              : "Yeni plan oluşturabilir veya vade filtresini değiştirebilirsiniz."}
          </span>
        </div>
      ) : (
        <div className="finance-plan-list">
          {displayedPlans.map((plan) => (
            <article className="finance-plan-card" key={plan.id}>
              <header>
                <div>
                  <small>
                    {plan.client.firstName} {plan.client.lastName}
                  </small>
                  <h3>{plan.name}</h3>
                </div>
                <span>
                  {planStatusLabels[plan.status as keyof typeof planStatusLabels] ?? plan.status}
                </span>
              </header>
              <dl>
                <div>
                  <dt>Kalan bakiye</dt>
                  <dd>{formatMoney(plan.balanceMinor, plan.currency)}</dd>
                </div>
                <div>
                  <dt>Kalan seans</dt>
                  <dd>{plan.remainingSessions}</dd>
                </div>
                <div>
                  <dt>Plan toplamı</dt>
                  <dd>{formatMoney(plan.totalAmountMinor, plan.currency)}</dd>
                </div>
              </dl>
              <div className="finance-installments">
                {plan.installments.map((installment) => (
                  <div key={installment.id}>
                    <span>
                      {installment.sequence}. taksit · {installment.dueDate}
                    </span>
                    <strong>{formatMoney(installment.amountDueMinor, plan.currency)}</strong>
                    <small>Ödenen {formatMoney(installment.paidAmountMinor, plan.currency)}</small>
                    <small
                      className={`finance-state finance-state--${installment.state.toLowerCase()}`}
                    >
                      {installmentStateLabels[installment.state]}
                    </small>
                    {canManage && plan.status === "ACTIVE" ? (
                      <details className="finance-history">
                        <summary>Taksiti düzenle</summary>
                        <form onSubmit={(event) => void updateInstallment(event, installment.id)}>
                          <label>
                            Tutar
                            <input
                              defaultValue={minorToInput(installment.amountDueMinor)}
                              inputMode="decimal"
                              name="amount"
                              required
                            />
                          </label>
                          <label>
                            Son ödeme tarihi
                            <DateControl
                              defaultValue={installment.dueDate}
                              name="dueDate"
                              required
                            />
                          </label>
                          <label>
                            İşlem notu
                            <textarea minLength={8} name="reason" required />
                          </label>
                          <button disabled={busy} type="submit">
                            Taksiti kaydet
                          </button>
                        </form>
                      </details>
                    ) : null}
                  </div>
                ))}
              </div>
              {canManage ? (
                <details className="finance-history">
                  <summary>Plan durumunu değiştir</summary>
                  <form onSubmit={(event) => void updatePlanStatus(event, plan.id)}>
                    <label>
                      Durum
                      <SelectControl
                        defaultValue={plan.status}
                        name="status"
                        options={[
                          { label: "Aktif", value: "ACTIVE" },
                          { label: "Tamamlandı", value: "COMPLETED" },
                          { label: "İptal", value: "CANCELLED" },
                          { label: "Süresi doldu", value: "EXPIRED" },
                        ]}
                      />
                    </label>
                    <label>
                      İşlem notu
                      <textarea minLength={8} name="reason" required />
                    </label>
                    <button disabled={busy} type="submit">
                      Plan durumunu kaydet
                    </button>
                  </form>
                </details>
              ) : null}
              <details className="finance-history">
                <summary>Fatura / belge durumu · {invoiceStatusLabels[plan.invoiceStatus]}</summary>
                {canManage ? (
                  <form
                    key={`${plan.id}-${plan.invoiceStatus}-${plan.invoiceReference ?? ""}`}
                    onSubmit={(event) => void updateInvoiceStatus(event, plan.id)}
                  >
                    <label>
                      Durum
                      <SelectControl
                        defaultValue={plan.invoiceStatus}
                        name="invoiceStatus"
                        options={invoiceStatusOptions}
                      />
                    </label>
                    <label>
                      Belge referansı
                      <input defaultValue={plan.invoiceReference ?? ""} name="invoiceReference" />
                    </label>
                    <label>
                      İşlem notu
                      <textarea minLength={8} name="reason" required />
                    </label>
                    <button disabled={busy} type="submit">
                      Belge durumunu kaydet
                    </button>
                  </form>
                ) : (
                  <p>{plan.invoiceReference || "Belge referansı yok."}</p>
                )}
              </details>
              <details className="finance-history">
                <summary>Hareket geçmişi</summary>
                <ul>
                  {plan.ledgerEntries.map((entry) => (
                    <li key={entry.id}>
                      <span>
                        {financeEntryLabels[entry.type as keyof typeof financeEntryLabels] ??
                          entry.type}{" "}
                        · {new Date(entry.occurredAt).toLocaleDateString("tr-TR")}
                      </span>
                      <strong>{formatMoney(entry.amountMinor, plan.currency)}</strong>
                      {canManage && entry.type === "PAYMENT" && !reversedEntryIds.has(entry.id) && (
                        <button
                          disabled={busy}
                          onClick={() => openReversePayment(entry.id)}
                          type="button"
                        >
                          Ödemeyi geri al
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
