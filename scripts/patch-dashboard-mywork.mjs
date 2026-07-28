import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/MyWorkPanel.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `  onAddClient: (newClient: Client) => void;`,
    `  onAddClient: (newClient: Client) => Promise<string | null>;`,
    "Async add-client contract",
  );
  source = replaceRequired(
    source,
    `  const handleSaveNewClient = () => {`,
    `  const handleSaveNewClient = async () => {`,
    "Async client form submit",
  );
  source = source.replace(
    "    const newId = newClient.name.toLowerCase().replace(/\\s+/g, '_');\n",
    "",
  );
  source = replaceRequired(
    source,
    `    onAddClient(newlyCreated);
    setShowAddModal(false);
    onSelectLead(newId); // auto select the new lead!`,
    `    const persistedId = await onAddClient(newlyCreated);
    if (!persistedId) return;
    setShowAddModal(false);
    onSelectLead(persistedId);`,
    "Wait for persisted client before closing modal",
  );
  return source;
});
