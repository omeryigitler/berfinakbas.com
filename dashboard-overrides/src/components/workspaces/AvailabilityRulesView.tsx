import { CustomSelect } from './CustomControls';
import { weekdayLabels } from './availability-controller';

export default function AvailabilityRulesView({ data, controller }: { data: any; controller: any }) {
  const { rules, setRules, saveRules, saving } = controller;
  return (
    <section className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-black text-gray-950">Haftalık çalışma saatleri</h2>
          <p className="mt-1 text-[10px] font-semibold text-gray-400">{data.practitioner.displayName} · {data.practitioner.timeZone}</p>
        </div>
        <button type="button" disabled={saving} onClick={saveRules} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8] disabled:opacity-50">{saving ? 'Kaydediliyor...' : 'Saatleri kaydet'}</button>
      </div>
      <div className="mt-5 space-y-2">
        {rules.map((rule: any, index: number) => (
          <div key={rule.weekday} className="grid grid-cols-[170px_80px_1fr_1fr_120px] items-center gap-3 rounded-[1.25rem] border border-black/[0.05] bg-[#faf9f6] px-4 py-3">
            <strong className="text-[10.5px] font-black text-gray-900">{weekdayLabels[index]}</strong>
            <button type="button" onClick={() => setRules((current: any[]) => current.map((item, itemIndex) => itemIndex === index ? { ...item, active: !item.active } : item))} className={`rounded-full px-3 py-1.5 text-[8px] font-black ${rule.active ? 'bg-black text-[#eafda8]' : 'bg-gray-200 text-gray-500'}`}>{rule.active ? 'Açık' : 'Kapalı'}</button>
            <input type="time" value={rule.start} disabled={!rule.active} onChange={(event) => setRules((current: any[]) => current.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold disabled:opacity-40" />
            <input type="time" value={rule.end} disabled={!rule.active} onChange={(event) => setRules((current: any[]) => current.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-bold disabled:opacity-40" />
            <CustomSelect disabled={!rule.active} value={String(rule.slotIncrementMinutes)} onChange={(value) => setRules((current: any[]) => current.map((item, itemIndex) => itemIndex === index ? { ...item, slotIncrementMinutes: Number(value) } : item))} options={[5, 10, 15, 20, 30, 45, 60].map((value) => ({ label: `${value} dk`, value: String(value) }))} />
          </div>
        ))}
      </div>
    </section>
  );
}
