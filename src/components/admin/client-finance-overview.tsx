import Link from "next/link";

import { getFilteredFinanceOverview } from "@/lib/finance/finance-overview-filter";

function formatMoney(amountMinor: string, currency: string): string {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(Number(BigInt(amountMinor)) / 100);
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

  const totalBalanceMinor = overview.plans.reduce(
    (total, plan) => total + BigInt(plan.balanceMinor),
    0n,
  );
  const currency = overview.plans[0]?.currency ?? "TRY";

  return (
    <section className="admin-panel" aria-labelledby="danisan-finans-ozeti">
      <div className="admin-panel-heading">
        <div>
          <h2 id="danisan-finans-ozeti">Danışan finans özeti</h2>
          <p>
            {client.firstName} {client.lastName} için plan, taksit ve ödeme hareketleri.
          </p>
        </div>
        <Link className="secondary-button" href="/yonetim/odemeler">
          Tüm finans ekranı
        </Link>
      </div>

      <div className="finance-toolbar">
        <span>{overview.plans.length} plan</span>
        <strong>{formatMoney(totalBalanceMinor.toString(), currency)} açık bakiye</strong>
      </div>

      {overview.plans.length === 0 ? (
        <div className="admin-empty-state">
          <strong>Plan yok</strong>
          <span>Bu danışan için henüz ödeme planı oluşturulmamış.</span>
        </div>
      ) : (
        <div className="finance-plan-list">
          {overview.plans.map((plan) => (
            <article className="finance-plan-card" key={plan.id}>
              <header>
                <div>
                  <small>{plan.status}</small>
                  <h3>{plan.name}</h3>
                </div>
                <span>{formatMoney(plan.balanceMinor, plan.currency)}</span>
              </header>
              <dl>
                <div>
                  <dt>Kalan seans</dt>
                  <dd>{plan.remainingSessions}</dd>
                </div>
                <div>
                  <dt>Plan toplamı</dt>
                  <dd>{formatMoney(plan.totalAmountMinor, plan.currency)}</dd>
                </div>
                <div>
                  <dt>Taksit</dt>
                  <dd>{plan.installments.length}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
