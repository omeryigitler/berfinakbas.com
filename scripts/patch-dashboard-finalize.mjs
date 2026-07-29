import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `      if (!res.ok) return;
      const payload = await res.json();`,
    `      if (!res.ok) throw new Error('Danışan listesi yüklenemedi.');
      const payload = await res.json();`,
    "Client list error propagation",
  );
  source = replaceRequired(
    source,
    `    } catch {
      /* keep mock data when the API is unavailable */
    }`,
    `    } catch {
      setClients([]);
      setClientsDb({});
    }`,
    "Remove client mock fallback",
  );
  return source;
});
