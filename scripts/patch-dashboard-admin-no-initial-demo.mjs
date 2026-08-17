import { patchFile, replaceRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `import MyWorkPanel, { Client, INITIAL_CLIENTS } from './components/MyWorkPanel';`,
    `import MyWorkPanel, { Client } from './components/MyWorkPanel';`,
    "Remove initial demo client import",
  );
  source = replaceRequired(
    source,
    `  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);`,
    `  const [clients, setClients] = useState<Client[]>([]);`,
    "Start client list from real data only",
  );
  return source;
});
