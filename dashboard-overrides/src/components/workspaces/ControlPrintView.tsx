import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileDown, Printer } from 'lucide-react';
import { CustomDatePicker } from '../CustomDatePicker';
import { EmptyState, money, normalized, type ModuleViewsProps } from './shared';

const appointmentStatusLabels: Record<string, string> = {
  REQUESTED: 'Talep',
  PENDING_REVIEW: 'İnceleme bekliyor',
  CONFIRMED: 'Onaylandı',
  RESCHEDULE_PROPOSED: 'Değişiklik önerildi',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
  NO_SHOW: 'Gelmedi',
  CANCELLED_BY_CLIENT: 'Danışan iptali',
  CANCELLED_BY_PRACTITIONER: 'Terapist iptali',
  EXPIRED: 'Süresi doldu',
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || '—';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

function appointmentName(item: any) {
  return `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`.trim() || '—';
}

function paymentName(item: any) {
  return `${item.client?.firstName ?? ''} ${item.client?.lastName ?? ''}`.trim() || '—';
}

function downloadCsv(name: string, rows: Array<Array<string | number>>) {
  const csv = `\ufeff${rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ControlPrintView({ data, selectedItemId, filter, sortDirection }: ModuleViewsProps) {
  const allTime = selectedItemId === 'tum-zamanlar';
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!selectedDate && data?.businessToday) setSelectedDate(data.businessToday);
  }, [data, selectedDate]);

  const query = normalized(filter);
  const appointments = useMemo(() => {
    const rows = [...(data?.appointments ?? [])].filter((item) => {
      if (!allTime && selectedDate && item.localDate !== selectedDate) return false;
      return normalized(
        `${appointmentName(item)} ${item.serviceNameSnapshot} ${item.practitioner?.displayName} ${item.status}`,
      ).includes(query);
    });
    rows.sort(
      (left, right) =>
        (new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()) *
        (sortDirection === 'asc' ? 1 : -1),
    );
    return rows;
  }, [allTime, data, query, selectedDate, sortDirection]);

  const payments = useMemo(() => {
    const rows = [...(data?.payments ?? [])].filter((item) => {
      if (!allTime && selectedDate && item.localDate !== selectedDate) return false;
      return normalized(`${paymentName(item)} ${item.plan?.name} ${item.note} ${item.currency}`).includes(query);
    });
    rows.sort(
      (left, right) =>
        (new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()) *
        (sortDirection === 'asc' ? 1 : -1),
    );
    return rows;
  }, [allTime, data, query, selectedDate, sortDirection]);

  const completed = appointments.filter((item) => item.status === 'COMPLETED').length;
  const noShow = appointments.filter((item) => item.status === 'NO_SHOW').length;
  const cancelled = appointments.filter((item) =>
    ['REJECTED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_PRACTITIONER', 'EXPIRED'].includes(item.status),
  ).length;

  const paymentTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of payments) {
      totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + Number(payment.amountMinor ?? 0));
    }
    return [...totals.entries()];
  }, [payments]);

  const periodLabel = allTime ? 'Tüm zamanlar' : formatLocalDate(selectedDate || data?.businessToday || '');

  function csvRows() {
    const rows: Array<Array<string | number>> = [
      ['BERFİN AKBAŞ - KONTROL ÇIKTISI'],
      ['Dönem', periodLabel],
      [],
      ['RANDEVULAR'],
      ['Kontrol', 'Tarih', 'Saat', 'Danışan', 'Hizmet', 'Terapist', 'Durum'],
      ...appointments.map((item) => [
        '☐',
        formatLocalDate(item.localDate),
        item.localTime,
        appointmentName(item),
        item.serviceNameSnapshot,
        item.practitioner?.displayName ?? '—',
        appointmentStatusLabels[item.status] ?? item.status,
      ]),
      [],
      ['ÖDEMELER'],
      ['Kontrol', 'Tarih', 'Saat', 'Danışan', 'Plan', 'Tutar', 'Not'],
      ...payments.map((item) => [
        '☐',
        formatLocalDate(item.localDate),
        item.localTime,
        paymentName(item),
        item.plan?.name ?? '—',
        money(item.amountMinor, item.currency),
        item.note ?? '',
      ]),
    ];
    return rows;
  }

  function printReport() {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!popup) return;

    const appointmentRows = appointments
      .map(
        (item) => `<tr>
          <td class="check">□</td>
          <td>${escapeHtml(formatLocalDate(item.localDate))}</td>
          <td>${escapeHtml(item.localTime)}</td>
          <td class="strong">${escapeHtml(appointmentName(item))}</td>
          <td>${escapeHtml(item.serviceNameSnapshot)}</td>
          <td>${escapeHtml(item.practitioner?.displayName ?? '—')}</td>
          <td>${escapeHtml(appointmentStatusLabels[item.status] ?? item.status)}</td>
        </tr>`,
      )
      .join('');

    const paymentRows = payments
      .map(
        (item) => `<tr>
          <td class="check">□</td>
          <td>${escapeHtml(formatLocalDate(item.localDate))}</td>
          <td>${escapeHtml(item.localTime)}</td>
          <td class="strong">${escapeHtml(paymentName(item))}</td>
          <td>${escapeHtml(item.plan?.name ?? '—')}</td>
          <td class="amount">${escapeHtml(money(item.amountMinor, item.currency))}</td>
          <td>${escapeHtml(item.note ?? '')}</td>
        </tr>`,
      )
      .join('');

    const paymentSummary = paymentTotals.length
      ? paymentTotals.map(([currency, total]) => money(total, currency)).join(' · ')
      : '0';

    popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Berfin Akbaş - ${escapeHtml(periodLabel)} Kontrol</title><style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #181818; font-size: 10px; }
      h1 { margin: 0; font-size: 20px; }
      h2 { margin: 18px 0 8px; font-size: 13px; }
      .header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #111; padding-bottom:10px; }
      .muted { color:#666; margin-top:4px; }
      .summary { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin:12px 0 4px; }
      .card { border:1px solid #ddd; border-radius:8px; padding:8px; }
      .card span { display:block; color:#777; font-size:8px; text-transform:uppercase; margin-bottom:3px; }
      .card strong { font-size:12px; }
      table { width:100%; border-collapse:collapse; table-layout:fixed; }
      thead { display:table-header-group; }
      th { background:#f0f0ed; text-align:left; font-size:8px; text-transform:uppercase; letter-spacing:.03em; }
      th, td { border:1px solid #d9d9d4; padding:6px; vertical-align:top; overflow-wrap:anywhere; }
      tr { break-inside:avoid; }
      .check { width:34px; text-align:center; font-size:17px; line-height:1; }
      .strong { font-weight:700; }
      .amount { font-weight:700; white-space:nowrap; }
      .empty { border:1px dashed #bbb; padding:12px; color:#777; }
      .footer { margin-top:14px; padding-top:7px; border-top:1px solid #ddd; display:flex; justify-content:space-between; color:#777; font-size:8px; }
    </style></head><body>
      <div class="header"><div><h1>Berfin Akbaş</h1><div class="muted">Randevu ve Ödeme Kontrol Çıktısı</div></div><div><strong>${escapeHtml(periodLabel)}</strong><div class="muted">${escapeHtml(data?.businessTimeZone ?? '')}</div></div></div>
      <div class="summary">
        <div class="card"><span>Randevu</span><strong>${appointments.length}</strong></div>
        <div class="card"><span>Tamamlanan</span><strong>${completed}</strong></div>
        <div class="card"><span>Gelmedi</span><strong>${noShow}</strong></div>
        <div class="card"><span>İptal / Red</span><strong>${cancelled}</strong></div>
        <div class="card"><span>Alınan Ödeme</span><strong>${escapeHtml(paymentSummary)}</strong></div>
      </div>
      <h2>Randevular</h2>
      ${appointments.length ? `<table><thead><tr><th class="check">Kontrol</th><th>Tarih</th><th>Saat</th><th>Danışan</th><th>Hizmet</th><th>Terapist</th><th>Durum</th></tr></thead><tbody>${appointmentRows}</tbody></table>` : '<div class="empty">Bu dönem için randevu kaydı yok.</div>'}
      <h2>Alınan Ödemeler</h2>
      ${payments.length ? `<table><thead><tr><th class="check">Kontrol</th><th>Tarih</th><th>Saat</th><th>Danışan</th><th>Plan</th><th>Tutar</th><th>Not</th></tr></thead><tbody>${paymentRows}</tbody></table>` : '<div class="empty">Bu dönem için alınmış ödeme kaydı yok.</div>'}
      <div class="footer"><span>Kontrol kutuları çıktı üzerinde elle işaretlemek içindir.</span><span>Oluşturulma: ${escapeHtml(new Date().toLocaleString('tr-TR'))}</span></div>
      <script>window.addEventListener('load',()=>{window.print();});<\/script>
    </body></html>`);
    popup.document.close();
  }

  if (!data?.access?.appointments && !data?.access?.finance) {
    return <EmptyState title="Görüntüleme yetkisi yok" text="Randevu veya finans verisini görüntüleme yetkisi bulunmuyor." />;
  }

  return (
    <div className="space-y-4 pb-5">
      <section className="rounded-[2rem] border border-black/[0.07] bg-white/90 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-[#eafda8]"><CalendarDays className="h-4 w-4" /></span>
              <div><h2 className="text-[13px] font-black text-gray-950">{allTime ? 'Tüm zamanlar kontrolü' : 'Günlük kontrol'}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">Randevular ve alınan ödemeler aynı çıktıda kontrol edilir.</p></div>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {!allTime && (
              <div className="w-[185px]"><span className="mb-1.5 block text-[8px] font-black uppercase tracking-wider text-gray-400">Kontrol tarihi</span><CustomDatePicker value={selectedDate || data?.businessToday || ''} onChange={setSelectedDate} /></div>
            )}
            <button type="button" onClick={() => downloadCsv(`berfin-akbas-kontrol-${allTime ? 'tum-zamanlar' : selectedDate}`, csvRows())} className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[9px] font-black text-gray-700"><FileDown className="h-3.5 w-3.5" /> CSV</button>
            <button type="button" onClick={printReport} className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[9px] font-black text-[#eafda8]"><Printer className="h-3.5 w-3.5" /> Yazdır / PDF</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Randevu" value={String(appointments.length)} />
        <SummaryCard label="Tamamlanan" value={String(completed)} />
        <SummaryCard label="Gelmedi" value={String(noShow)} />
        <SummaryCard label="İptal / Red" value={String(cancelled)} />
        <SummaryCard label="Alınan ödeme" value={paymentTotals.length ? paymentTotals.map(([currency, total]) => money(total, currency)).join(' · ') : '0'} />
      </div>

      <ReportTable
        title="Randevular"
        empty="Bu dönem için randevu kaydı yok."
        columns={['Kontrol', 'Tarih', 'Saat', 'Danışan', 'Hizmet', 'Terapist', 'Durum']}
        rows={appointments.map((item) => [
          '□',
          formatLocalDate(item.localDate),
          item.localTime,
          appointmentName(item),
          item.serviceNameSnapshot,
          item.practitioner?.displayName ?? '—',
          appointmentStatusLabels[item.status] ?? item.status,
        ])}
      />

      <ReportTable
        title="Alınan Ödemeler"
        empty="Bu dönem için alınmış ödeme kaydı yok."
        columns={['Kontrol', 'Tarih', 'Saat', 'Danışan', 'Plan', 'Tutar', 'Not']}
        rows={payments.map((item) => [
          '□',
          formatLocalDate(item.localDate),
          item.localTime,
          paymentName(item),
          item.plan?.name ?? '—',
          money(item.amountMinor, item.currency),
          item.note ?? '—',
        ])}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1.5rem] border border-black/[0.07] bg-white/88 p-4"><span className="block text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</span><strong className="mt-2 block text-[13px] font-black text-gray-950">{value}</strong></div>;
}

function ReportTable({ title, columns, rows, empty }: { title: string; columns: string[]; rows: Array<Array<string>>; empty: string }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/90">
      <div className="border-b border-black/[0.05] px-5 py-4"><h2 className="text-[12px] font-black text-gray-950">{title}</h2><p className="mt-1 text-[8.5px] font-semibold text-gray-400">{rows.length} kayıt</p></div>
      {rows.length === 0 ? <div className="p-5 text-[10px] font-semibold text-gray-400">{empty}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left"><thead><tr className="bg-black/[0.025]">{columns.map((column) => <th key={column} className="border-b border-black/[0.06] px-4 py-3 text-[8px] font-black uppercase tracking-wider text-gray-400">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${title}-${rowIndex}`} className="border-b border-black/[0.04] last:border-b-0">{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className={`px-4 py-3 text-[9.5px] font-semibold text-gray-600 ${cellIndex === 0 ? 'text-center text-[16px] text-gray-300' : ''} ${cellIndex === 3 ? 'font-black text-gray-900' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
    </section>
  );
}
