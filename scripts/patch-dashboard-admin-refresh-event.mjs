import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) =>
  replaceRequired(
    initialSource,
    `  useEffect(() => {
    const refresh = (event: Event) => {
      const clientId = (event as CustomEvent<{ clientId?: string }>).detail?.clientId;
      if (clientId && clientId === selectedLeadId) setClientRefreshNonce((value) => value + 1);
    };
    window.addEventListener('dashboard:refresh-client', refresh);
    return () => window.removeEventListener('dashboard:refresh-client', refresh);
  }, [selectedLeadId]);`,
    `  useEffect(() => {
    const refresh = (event: Event) => {
      const clientId = (event as CustomEvent<{ clientId?: string }>).detail?.clientId;
      if (!clientId) return;
      void loadClients();
      if (clientId === selectedLeadId) setClientRefreshNonce((value) => value + 1);
    };
    window.addEventListener('dashboard:refresh-client', refresh);
    return () => window.removeEventListener('dashboard:refresh-client', refresh);
  }, [loadClients, selectedLeadId]);`,
    "Refresh list and selected client from one persistence event listener",
  ),
);
