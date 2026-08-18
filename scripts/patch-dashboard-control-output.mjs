import { patchFile, replaceRequired } from './dashboard-patch-utils.mjs';

await patchFile('components/Sidebar.tsx', (source) =>
  replaceRequired(
    source,
    "{ id: 'pdf-kaynaklar', label: 'PDF ve Kaynaklar', icon: FileText },",
    "{ id: 'pdf-kaynaklar', label: 'Kontrol ve Çıktılar', icon: FileText },",
    'Control and outputs sidebar label',
  ),
);

await patchFile('components/workspaces/WorkspaceFrame.tsx', (source) =>
  replaceRequired(
    source,
    `          <button
            type="button"
            onClick={() => downloadCsv(exportName, exportRows)}
            disabled={exportRows.length <= 1}
            className="rounded-full border border-black/10 bg-white/65 px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Dışa aktar
          </button>`,
    `          {exportRows.length > 1 && (
            <button
              type="button"
              onClick={() => downloadCsv(exportName, exportRows)}
              className="rounded-full border border-black/10 bg-white/65 px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-white flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Dışa aktar
            </button>
          )}`,
    'Hide empty generic export action',
  ),
);
