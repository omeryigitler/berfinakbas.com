import { cloneElement, useState } from 'react';
import { FileText } from 'lucide-react';
import type {
  InputHTMLAttributes,
  ReactElement,
} from 'react';
import type { WorkspaceToast } from './WorkspaceFrame';
import { CustomSelect } from '../CustomSelect';
import { CustomDatePicker } from '../CustomDatePicker';
import { CustomTimePicker } from '../CustomTimePicker';

export interface ModuleViewsProps {
  activeMenuItem: string;
  selectedItemId: string;
  data: any;
  loading: boolean;
  filter: string;
  sortDirection: 'asc' | 'desc';
  refresh: () => Promise<void>;
  notify: (toast: Omit<WorkspaceToast, 'id'>) => void;
  onOpenWorkspace?: (module: string, view: string) => void;
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

type CompletionPlan = { id: string; name: string; remainingSessions: number };

async function completeAppointment(appointmentId: string, planId: string | null) {
  const response = await fetch(`/api/admin/appointments/${appointmentId}/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': crypto.randomUUID() },
    body: JSON.stringify({ planId }),
  });
  if (!response.ok) throw new Error(await responseError(response));
  return response.json();
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
  const [busy, setBusy] = useState(false);
  const [planOptions, setPlanOptions] = useState<CompletionPlan[] | null>(null);

  if (actions.length === 0) return null;

  async function finishCompletion(planId: string | null) {
    setBusy(true);
    try {
      await completeAppointment(appointment.id, planId);
      notify({
        kind: 'success',
        title: 'Randevu tamamlandı',
        message: `${appointment.publicReference} · Tamamlandı`,
      });
      setPlanOptions(null);
      await refresh();
    } catch (error) {
      notify({
        kind: 'error',
        title: 'Randevu tamamlanamadı',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function beginCompletion() {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointment.id}/completion-options`,
        { headers: { 'x-correlation-id': crypto.randomUUID() } },
      );
      // A user without finance access cannot see plans; fall back to completing
      // without one (works for clients that have no active plan, and returns a
      // clear "finance required" error otherwise).
      if (response.status === 403) {
        await finishCompletion(null);
        return;
      }
      if (!response.ok) throw new Error(await responseError(response));
      const { data } = (await response.json()) as { data: { plans: CompletionPlan[] } };
      if (!data.plans || data.plans.length === 0) {
        await finishCompletion(null);
      } else {
        setPlanOptions(data.plans);
      }
    } catch (error) {
      notify({
        kind: 'error',
        title: 'Randevu tamamlanamadı',
        message: error instanceof Error ? error.message : 'Beklenmeyen hata.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
        {actions.map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() =>
              status === 'COMPLETED'
                ? void beginCompletion()
                : void transitionAppointment(appointment, status, refresh, notify)
            }
            className={`rounded-full border px-2.5 py-1.5 text-[7.5px] font-black disabled:opacity-50 ${
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

      {planOptions && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setPlanOptions(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-[2rem] border border-black/10 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-[13px] font-black text-gray-950">Hangi plandan seans düşülsün?</h3>
            <p className="mt-1 text-[10px] font-semibold text-gray-400">
              {appointment.client?.firstName} {appointment.client?.lastName} ·{' '}
              {appointment.publicReference}
            </p>
            <div className="mt-4 space-y-2">
              {planOptions.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void finishCompletion(plan.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-[1.2rem] border border-black/10 bg-[#faf9f6] px-4 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <span className="text-[11px] font-black text-gray-950">{plan.name}</span>
                  <span className="text-[9px] font-black text-emerald-700">
                    {plan.remainingSessions} seans kaldı
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPlanOptions(null)}
              className="mt-4 w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-black text-gray-600 disabled:opacity-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </>
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

// Custom dropdown that stays FormData-compatible via a synced hidden input, so the
// existing name-based form handlers keep working while the visual matches the design.
export function SimpleSelect({ label, options, name, defaultValue }: { label: string; options: Array<[string, string]>; name?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.[0] ?? '');
  return (
    <label className="block space-y-1.5">
      <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span>
      <CustomSelect className="py-2.5 text-[10px] border-black/10" options={options.map(([v, t]) => ({ value: v, label: t }))} value={value} onChange={setValue} />
      {name && <input type="hidden" name={name} value={value} />}
    </label>
  );
}

export function SimpleDate({ label, name, defaultValue }: { label: string; name?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '');
  return (
    <label className="block space-y-1.5">
      <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span>
      <CustomDatePicker value={value} onChange={setValue} />
      {name && <input type="hidden" name={name} value={value} />}
    </label>
  );
}

export function SimpleTime({ label, name, defaultValue }: { label: string; name?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '');
  return (
    <label className="block space-y-1.5">
      <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span>
      <CustomTimePicker value={value} onChange={setValue} />
      {name && <input type="hidden" name={name} value={value} />}
    </label>
  );
}

// Controlled variant of Field for enum/boolean values, rendered with the design's CustomSelect.
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <div className="block rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] p-3.5">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</span>
      <CustomSelect className="py-2.5 text-[10px] border-black/10" options={options.map(([v, t]) => ({ value: v, label: t }))} value={value} onChange={onChange} />
    </div>
  );
}

export function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-black/[0.05] bg-[#faf9f6] p-3"><span className="block text-[7.5px] font-black uppercase tracking-wider text-gray-400">{label}</span><strong className="mt-1.5 block truncate text-[9px] font-black text-gray-800">{value}</strong></div>;
}
