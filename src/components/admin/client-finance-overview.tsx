import type { Route } from "next";
import Link from "next/link";

import styles from "@/components/admin/admin-shell.module.css";
import { getFilteredFinanceOverview } from "@/lib/finance/finance-overview-filter";

function formatMoney(amountMinor: string | bigint, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(BigInt(amountMinor)) / 100);
}

function positiveBalance(value: bigint): bigint {
  return value > 0n ? value : 0n;
}

export async function ClientFinanceOverview({ clientId }: { clientId: string }) {
  const overview = await getFilteredFinanceOverview({ clientId, status: "ALL" });
  const client = overview.clients[0];

  if (!client) {
    return (
      <section className="admin-panel" aria-labelledby="danisan-finans-ozeti">
        <div className="admin-empty-state">
          <strong>Danışan bulunamadı</strong>
          <span>Finans özeti için geçerli bir danışan seçilmelidir.</span>
        </div>
      </section>
    );
  }

  const currency = overview.plans[0]?.currency ?? "TRY";
  const totalPlanMinor = overview.plans.reduce(
    (total, plan) => total + BigInt(plan.totalAmountMinor),
    0n,
  );
  const rawBalanceMinor = overview.plans.reduce(
    (total, plan) => total + BigInt(plan.balanceMinor),
    0n,
  );
  const openBalanceMinor = positiveBalance(rawBalanceMinor);
  const paidMinor = totalPlanMinor > rawBalanceMinor ? totalPlanMinor - rawBalanceMinor : 0n;
  const remainingSessions = overview.plans.reduce(
    (total, plan) => total + Number(plan.remainingSessions),
    0,
  );
  const overdueInstallments = overview.plans.reduce(
    (total, plan) =>
      total + plan.installments.filter((installment) => installment.state === "OVERDUE").length,
    0,
  );

  return (
    <section className="admin-panel" aria-labelledby="danisan-finans-ozeti">
      <div className="admin-panel-heading">
        <div>
          <h2 id="danisan-finans-ozeti">Danışan finans özeti</h2>
          <p>
            {client.firstName} {client.lastName} için plan, taksit ve ödeme hareketleri filtreli
            gösteriliyor.
          </p>
        </div>
        <div className="finance-overview-actions">
          <Link
            className="secondary-button"
            href={`/yonetim/danisan-profili?clientId=${client.id}` as Route}
          >
            Danışan profiline dön
          </Link>
          <Link className="secondary-button" href="/yonetim/odemeler">
            Tüm finans ekranı
          </Link>
        </div>
      </div>

      <div className="finance-toolbar">
        <span>{overview.plans.length} plan</span>
        <strong>{formatMoney(openBalanceMinor, currency)} açık bakiye</strong>
      </div>

      <div className={styles.dashboardGrid}>
        <article className={styles.dashboardCard}>
          <span>Plan toplamı</span>
          <strong>{formatMoney(totalPlanMinor, currency)}</strong>
          <small>{overview.plans.length} plan kaydı</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Alınan ödeme</span>
          <strong>{formatMoney(paidMinor, currency)}</strong>
          <small>Net plan bakiyesine göre</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Açık bakiye</span>
          <strong>{formatMoney(openBalanceMinor, currency)}</strong>
          <small>{overdueInstallments} gecikmiş taksit</small>
        </article>
        <article className={styles.dashboardCard}>
          <span>Kalan seans</span>
          <strong>{remainingSessions}</strong>
          <small>Aktif/geçerli planlardan</small>
        </article>
      </div>

      <p className="finance-overview-note">
        Plan, taksit ve hareket ayrıntıları aşağıdaki tek operasyon listesinde gösterilir.
      </p>
    </section>
  );
}
