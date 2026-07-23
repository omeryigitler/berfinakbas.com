import { useState } from 'react';
import { CustomDatePicker, CustomSelect } from './CustomControls';
import { EmptyState, formatDate, normalized, type ModuleViewsProps } from './shared';

export default function AvailabilityExceptionsView({ props, controller }: { props: ModuleViewsProps; controller: any }) {
  const { data, selectedItemId, filter, sortDirection } = props;
  const { exceptionOpen, setExceptionOpen, createException, toggleException, saving } = controller;
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionType, setExceptionType] = useState('CLOSED');
  const allowedTypes = selectedItemId === 'ozel-saatler' ? ['CUSTOM_HOURS'] : ['CLOSED', 'BLOCKED'];
  const query = normalized(filter);
  const exceptions = [...(data.exceptions ?? [])]
    .filter((item: any) => allowedTypes.includes(item.type))
    .filter((item: any) => normalized(`${item.localDate} ${item.reasonCode} ${item.privateNote} ${item.status}`).includes(query))
    .sort((left: any, right: any) => (new Date(left.localDate).getTime() - new Date(right.localDate).getTime()) * (sortDirection === 'asc' ? 1 : -1));

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-end"><button type="button" onClick={() => setExceptionOpen((value: boolean) => !value)} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">+ {selectedItemId === 'ozel-saatler' ? 'Özel saat ekle' : 'Kapalı zaman ekle'}</button></div>
      {exceptionOpen && (
        <form onSubmit={createException} className="rounded-[2rem] border border-black/[0.07] bg-white/92 p-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Tarih</span><input type="hidden" name="date" value={exceptionDate} /><CustomDatePicker value={exceptionDate} onChange={setExceptionDate} min={new Date().toISOString().slice(0, 10)} /></label>
            {selectedItemId === 'kapali-zamanlar' && <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Tür</span><input type="hidden" name="type" value={exceptionType} /><CustomSelect value={exceptionType} onChange={setExceptionType} options={[{ value: 'CLOSED', label: 'Tam gün kapalı' }, { value: 'BLOCKED', label: 'Saat aralığı kapalı' }]} /></label>}
            <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Başlangıç</span><input type="time" name="start" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>
            <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Bitiş</span><input type="time" name="end" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>
            <label className="space-y-1.5"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Sebep</span><input name="reasonCode" required defaultValue="MANUAL" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-bold" /></label>
            <label className="space-y-1.5 xl:col-span-2"><span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Özel not</span><textarea name="privateNote" maxLength={500} className="min-h-20 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[10px] font-semibold" /></label>
          </div>
          <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setExceptionOpen(false)} className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[10px] font-bold text-gray-600">Vazgeç</button><button type="submit" disabled={saving || !exceptionDate} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">Kaydet</button></div>
        </form>
      )}
      {exceptions.length === 0 ? <EmptyState title="Kayıt bulunamadı" text="Bu görünüm için özel veya kapalı zaman kaydı bulunmuyor." /> : (
        <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
          {exceptions.map((item: any, index: number) => (
            <article key={item.id} className={`grid grid-cols-[1fr_200px_130px] items-center gap-4 px-5 py-4 ${index > 0 ? 'border-t border-black/[0.05]' : ''}`}>
              <div><strong className="block text-[11px] font-black text-gray-950">{formatDate(item.localDate)}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-500">{item.reasonCode} {item.privateNote ? `· ${item.privateNote}` : ''}</span></div>
              <span className="text-[10px] font-black text-gray-700">{item.localStartTime && item.localEndTime ? `${item.localStartTime}–${item.localEndTime}` : 'Tüm gün'}</span>
              <button type="button" onClick={() => void toggleException(item)} className={`rounded-full px-3 py-2 text-[8px] font-black ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
