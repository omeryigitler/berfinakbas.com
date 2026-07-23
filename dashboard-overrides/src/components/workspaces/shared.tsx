import { cloneElement } from 'react';
import { FileText } from 'lucide-react';
import type {
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
} from 'react';
import type { WorkspaceToast } from './WorkspaceFrame';

export interface ModuleViewsProps {
  activeMenuItem: string;
  selectedItemId: string;
  data: any;
  loading: boolean;
  filter: string;
  sortDirection: 'asc' | 'desc';
  refresh: () => Promise<void>;
  notify: (toast: Omit<WorkspaceToast, 'id'>) => void;
}

export function text(value: unknown) {
  return String(value ?? '');
}

export function normalized(value: unknown) {
  return text(value).toLocaleLowerCase('tr-TR');
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Malta',
  }).format(date);
}

export function money(minor: string | number | bigint | null | undefined, currency = 'TRY') {
  const value = Number(minor ?? 0) / 100;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);
}

export async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export async function postAction(body: unknown) {
  const response = await fetch('/api/admin/management-hub', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return response.json();
}

export type AppointmentTransition =
  | 'PENDING_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'RESCHEDULE_PROPOSED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_PRACTITIONER'
  | 'COMPLETED'
  | 'NO_SHOW';

export const transitionLabels: Record<AppointmentTransition, string> = {
  PENDING_REVIEW: 'İncelemeye al',
  CONFIRMED: 'Onayla',
  REJECTED: 'Reddet',
  RESCHEDULE_PROPOSED: 'Yeni saat öner',
  CANCELLED_BY_CLIENT: 'Danışan iptali',
  CANCELLED_BY_PRACTITIONER: 'Terapist iptali',
  COMPLETED: 'Tamamla',
  NO_SHOW: 'Gelmedi',
};

export function allowedTransitions(status: string): AppointmentTransition[] {
  if (status === 'REQUESTED') return ['PENDING_REVIEW'];
  if (status === 'PENDING_REVIEW') return ['CONFIRMED', 'REJECTED', 'RESCHEDULE_PROPOSED'];
  if (status === 'CONFIRMED') {
    return ['COMPLETED', 'NO_SHOW', 'RESCHEDULE_PROPOSED', 'CANCELLED_BY_PRACTITIONER'];
  }
  if (status === 'RESCHEDULE_PROPOSED') return ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_CLIENT'];
  return [];
}

export async function transitionAppointment(
  appointment: any,
  toStatus: AppointmentTransition,
  refresh: () => Promise<void>,
  notify: (toast: Omit<WorkspaceToast, 'id'>) => void,
) {
  try {
    const response = await fetch(`/api/admin/appointments/${appointment.id}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': crypto.randomUUID(),
      },
      body: JSON.stringify({
        toStatus,
        reasonCode: `ADMIN_${toStatus}`,
        note: null,
      }),
    });
    if (!response.ok) throw new Error(await responseError(response));
    notify({
      kind: 'success',
      title: 'Randevu durumu güncellendi',
      message: `${appointment.publicReference} · ${transitionLabels[toStatus]}`,
    });
    await refresh();
  } catch (error) {
    notify({
      kind: 'error',
      title: 'Randevu güncellenemedi',
      message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
    });
  }
}

export function AppointmentActions({
  appointment,
  refresh,
  notify,
}: {
  appointment: any;
  refresh: () => Promise<void>;
  notify: (toast: Omit<WorkspaceToast, 'id'>) => void;
}) {
  const actions = allowedTransitions(appointment.status);
  if (actions.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
      {actions.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => void transitionAppointment(appointment, status, refresh, notify)}
          className={`rounded-full border px-2.5 py-1.5 text-[7.5px] font-black ${
            status === 'CONFIRMED' || status === 'COMPLETED'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : status === 'REJECTED' || status === 'CANCELLED_BY_PRACTITIONER'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-black/10 bg-white text-gray-600'
          }`}
        >
          {transitionLabels[status]}
        </button>
      ))}
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-40 animate-pulse rounded-[2rem] border border-black/[0.05] bg-white/65" />
      ))}
    </div>
  );
}

export function EmptyState({ title, text: description }: { title: string; text: string }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[2rem] border border-dashed border-black/10 bg-white/60 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black text-[#eafda8]">
          <FileText className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-[14px] font-black text-gray-950">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-[10px] font-semibold leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const positive = ['ACTIVE', 'CONFIRMED', 'COMPLETED', 'PUBLISHED', 'SENT', 'GRANTED'].includes(value);
  const warning = ['REQUESTED', 'PENDING_REVIEW', 'RESCHEDULE_PROPOSED', 'PENDING', 'DRAFT'].includes(value);
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${
        positive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : warning
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-gray-200 bg-gray-50 text-gray-600'
      }`}
    >
      {value}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactElement<any> }) {
  return (
    <label className="block rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] p-3.5">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</span>
      {cloneElement(children, {
        className:
          'w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold text-gray-800 outline-none focus:border-black/25',
      })}
    </label>
  );
}

export function Metric({ title, value, text: detail }: { title: string; value: string | number; text: string }) {
  return (
    <article className="rounded-[2rem] border border-black/[0.07] bg-white/82 p-5">
      <span className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">{title}</span>
      <strong className="mt-3 block text-xl font-black text-gray-950">{value}</strong>
      <span className="mt-1 block text-[9px] font-semibold text-gray-400">{detail}</span>
    </article>
  );
}

export function SimpleInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span><input {...inputProps} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>;
}

export function SimpleSelect({ label, options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<[string, string]> }) {
  return <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span><select {...props} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold">{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
}

export function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">{label}</span><strong className="mt-1.5 block truncate text-[9px] font-black text-gray-800">{value}</strong></div>;
}
