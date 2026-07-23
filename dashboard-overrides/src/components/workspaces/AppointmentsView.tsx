import { useMemo } from 'react';
import { Clock3 } from 'lucide-react';
import {
  AppointmentActions,
  EmptyState,
  StatusPill,
  formatDate,
  normalized,
  type ModuleViewsProps,
} from './shared';

export default function AppointmentsView({ data, selectedItemId, filter, sortDirection, refresh, notify }: ModuleViewsProps) {
  const appointments = useMemo(() => {
    const rows = [...(data?.appointments ?? [])];
    const query = normalized(filter);
    const filtered = rows.filter((item) =>
      normalized(
        `${item.client?.firstName} ${item.client?.lastName} ${item.serviceNameSnapshot} ${item.publicReference} ${item.status}`,
      ).includes(query),
    );
    filtered.sort(
      (left, right) =>
        (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) *
        (sortDirection === 'asc' ? 1 : -1),
    );
    return filtered;
  }, [data, filter, sortDirection]);

  if (appointments.length === 0) {
    return <EmptyState title="Randevu bulunamadı" text="Seçilen görünüm ve filtre için kayıt yok." />;
  }

  if (selectedItemId === 'takvim') {
    const grouped = appointments.reduce<Record<string, any[]>>((accumulator, appointment) => {
      const day = new Date(appointment.startsAt).toISOString().slice(0, 10);
      (accumulator[day] ??= []).push(appointment);
      return accumulator;
    }, {});
    return (
      <div className="space-y-4 pb-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.location.assign('/yonetim/randevular')}
            className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]"
          >
            + Yeni randevu
          </button>
        </div>
        {Object.entries(grouped).map(([day, items]) => (
          <section key={day} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
            <h2 className="text-[13px] font-black text-gray-950">{formatDate(day)}</h2>
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {items.map((appointment) => (
                <article key={appointment.id} className="rounded-[1.4rem] border border-black/[0.06] bg-[#faf9f6] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-[11px] font-black text-gray-950">
                        {appointment.client.firstName} {appointment.client.lastName}
                      </strong>
                      <span className="mt-1 block text-[9px] font-semibold text-gray-500">
                        {appointment.serviceNameSnapshot} · {appointment.practitioner.displayName}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusPill value={appointment.status} />
                      <AppointmentActions appointment={appointment} refresh={refresh} notify={notify} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-gray-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDate(appointment.startsAt, true)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.location.assign('/yonetim/randevular')}
          className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]"
        >
          + Yeni randevu
        </button>
      </div>
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {appointments.map((appointment, index) => (
          <article
            key={appointment.id}
            className={`grid grid-cols-[minmax(0,1.4fr)_minmax(180px,.8fr)_auto] items-center gap-4 px-5 py-4 ${
              index > 0 ? 'border-t border-black/[0.05]' : ''
            }`}
          >
            <div className="min-w-0">
              <strong className="block truncate text-[11px] font-black text-gray-950">
                {appointment.client.firstName} {appointment.client.lastName}
              </strong>
              <span className="mt-1 block truncate text-[9px] font-semibold text-gray-500">
                {appointment.serviceNameSnapshot} · {appointment.publicReference}
              </span>
            </div>
            <div>
              <strong className="block text-[10px] font-black text-gray-800">
                {formatDate(appointment.startsAt, true)}
              </strong>
              <span className="mt-1 block text-[8.5px] font-semibold text-gray-400">
                {appointment.durationMinutesSnapshot} dakika · {appointment.locationTypeSnapshot}
              </span>
            </div>
            <div className="min-w-[160px] text-right">
              <StatusPill value={appointment.status} />
              <AppointmentActions appointment={appointment} refresh={refresh} notify={notify} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
