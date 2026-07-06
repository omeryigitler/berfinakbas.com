import { financeOverviewQuerySchema } from "@/domain/finance/finance-operations";

import { getFinanceOverview } from "./finance-service";

export async function getFilteredFinanceOverview(input: unknown) {
  const query = financeOverviewQuerySchema.parse(input);
  const overview = await getFinanceOverview(query);
  if (!query.clientId) return overview;

  return Object.freeze({
    clients: overview.clients.filter((client) => client.id === query.clientId),
    paymentMethods: overview.paymentMethods,
    plans: overview.plans.filter((plan) => plan.clientId === query.clientId),
  });
}
