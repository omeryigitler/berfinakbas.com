import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Download,
  Filter,
  Info,
  Search,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface WorkspaceToast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface WorkspaceFrameProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  filterValue: string;
  onFilterChange: (value: string) => void;
  onSort: () => void;
  sortDirection: 'asc' | 'desc';
  exportRows: Array<Array<string | number | boolean | null | undefined>>;
  exportName: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  toast?: WorkspaceToast | null;
  onDismissToast?: () => void;
}

function csvCell(value: string | number | boolean | null | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv(
  name: string,
  rows: Array<Array<string | number | boolean | null | undefined>>,
) {
  const content = `\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

export default function WorkspaceFrame({
  eyebrow,
  title,
  subtitle,
  children,
  filterValue,
  onFilterChange,
  onSort,
  sortDirection,
  exportRows,
  exportName,
  primaryAction,
  secondaryAction,
  toast,
  onDismissToast,
}: WorkspaceFrameProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!toast || !onDismissToast) return;
    const timer = window.setTimeout(onDismissToast, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismissToast]);

  const ToastIcon = toast ? toastIcons[toast.kind] : Info;

  return (
    <div
      id="module-workspace"
      className="workspace-enter flex-1 rounded-[2.5rem] border border-gray-300/40 px-6 py-5 flex flex-col h-[calc(100vh-5rem)] shadow-sm overflow-y-auto select-none gap-4 relative"
      style={{
        background:
          'linear-gradient(118deg, #eaff7e 0%, #eff9b0 20%, #fff7eb 47%, #ffffff 72%, #fff8f4 100%)',
      }}
    >
      <style>{`
        @keyframes workspace-enter {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .workspace-enter {
          animation: workspace-enter 140ms ease-out both;
        }
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .workspace-toast { animation: toast-enter 150ms ease-out both; }
        .workspace-toast-progress {
          animation: toast-progress 4200ms linear both;
          transform-origin: left;
        }
        @media (prefers-reduced-motion: reduce) {
          .workspace-enter, .workspace-toast, .workspace-toast-progress { animation: none; }
        }
      `}</style>

      {toast && (
        <div className="workspace-toast fixed right-7 top-[5.25rem] z-[100] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.35rem] border border-black/10 bg-white shadow-2xl">
          <div className="flex items-start gap-3 p-4">
            <div
              className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                toast.kind === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : toast.kind === 'error'
                    ? 'bg-red-50 text-red-600'
                    : toast.kind === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-[#eff9b0] text-black'
              }`}
            >
              <ToastIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block text-[12px] font-black text-gray-950">{toast.title}</strong>
              {toast.message && (
                <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-gray-500">
                  {toast.message}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onDismissToast}
              aria-label="Bildirimi kapat"
              className="grid h-7 w-7 place-items-center rounded-full border border-black/10 text-gray-400 hover:bg-gray-50 hover:text-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className={`workspace-toast-progress h-1 ${
              toast.kind === 'success'
                ? 'bg-emerald-500'
                : toast.kind === 'error'
                  ? 'bg-red-500'
                  : toast.kind === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-[#c9ef42]'
            }`}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="rounded-full border border-black bg-black px-3.5 py-2 text-[10px] font-black text-[#eafda8] hover:bg-gray-900"
            >
              +&nbsp; {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="rounded-full border border-black/10 bg-white/65 px-3.5 py-2 text-[10px] font-bold text-gray-700 hover:bg-white"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            className={`rounded-full border px-3 py-2 text-[10px] font-bold flex items-center gap-1.5 ${
              filterOpen
                ? 'border-black bg-black text-[#eafda8]'
                : 'border-black/10 bg-white/65 text-gray-700 hover:bg-white'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtrele
          </button>
          <button
            type="button"
            onClick={onSort}
            className="rounded-full border border-black/10 bg-white/65 px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-white flex items-center gap-1.5"
          >
            {sortDirection === 'asc' ? (
              <ArrowDownAZ className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpAZ className="h-3.5 w-3.5" />
            )}
            Sırala
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(exportName, exportRows)}
            disabled={exportRows.length <= 1}
            className="rounded-full border border-black/10 bg-white/65 px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Dışa aktar
          </button>
        </div>

        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-gray-500">
          Canlı yönetim verisi
        </span>
      </div>

      {filterOpen && (
        <div className="flex items-center gap-2 rounded-[1.4rem] border border-black/[0.07] bg-white/82 p-3 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Bu görünümde ara..."
            className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-gray-900 outline-none placeholder:text-gray-400"
          />
          {filterValue && (
            <button
              type="button"
              onClick={() => onFilterChange('')}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[9px] font-black text-gray-600"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-black/[0.06] pb-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-black px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.13em] text-[#eafda8]">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">{title}</h1>
          <p className="mt-1 max-w-3xl text-[11px] font-semibold leading-relaxed text-gray-500">
            {subtitle}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
