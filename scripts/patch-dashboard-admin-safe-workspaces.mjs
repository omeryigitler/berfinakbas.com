import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/workspaces/FinancePdfViews.tsx", (initialSource) => {
  return replaceRegexRequired(
    initialSource,
    /export function FinanceView\([\s\S]*?\n\}\n\nexport function PdfView/,
    `export function FinanceView({ data, selectedItemId, filter, sortDirection, onOpenWorkspace }: ModuleViewsProps) {
  const plans = useMemo(() => {
    const query = normalized(filter);
    return [...(data?.plans ?? [])]
      .filter((plan) => normalized(String(plan.name) + ' ' + String(plan.client?.firstName) + ' ' + String(plan.client?.lastName) + ' ' + String(plan.status)).includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr') * (sortDirection === 'asc' ? 1 : -1));
  }, [data, filter, sortDirection]);

  const paymentEntries = plans
    .flatMap((plan) =>
      (plan.ledgerEntries ?? [])
        .filter((entry: any) => entry.type === 'PAYMENT' && !entry.isReversed)
        .map((entry: any) => ({ ...entry, plan })),
    )
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  const summaries = new Map<string, { total: number; paid: number; open: number }>();
  for (const plan of plans.filter((item) => item.status !== 'CANCELLED')) {
    const current = summaries.get(plan.currency) ?? { total: 0, paid: 0, open: 0 };
    current.total += Number(plan.totalAmountMinor ?? 0);
    const planPaid = (plan.ledgerEntries ?? [])
      .filter((entry: any) => entry.type === 'PAYMENT' && !entry.isReversed)
      .reduce((sum: number, entry: any) => sum + Math.abs(Number(entry.amountMinor ?? 0)), 0);
    const balance = (plan.ledgerEntries ?? []).reduce(
      (sum: number, entry: any) => sum + Number(entry.amountMinor ?? 0),
      0,
    );
    current.paid += planPaid;
    current.open += Math.max(0, balance);
    summaries.set(plan.currency, current);
  }
  const summaryValue = (field: 'total' | 'paid' | 'open') => {
    const rows = [...summaries.entries()];
    if (rows.length === 0) return '0 TL';
    return rows.map(([currency, values]) => money(values[field], currency)).join(' · ');
  };

  if (selectedItemId === 'finans-ozeti') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Metric title="Toplam plan" value={summaryValue('total')} text={plans.length + ' plan'} />
          <Metric title="Alınan ödeme" value={summaryValue('paid')} text={paymentEntries.length + ' ödeme'} />
          <Metric title="Açık bakiye" value={summaryValue('open')} text="Planlara göre kalan borç" />
        </div>
        <div className="flex justify-end"><button type="button" onClick={() => onOpenWorkspace?.('danisanlar', '')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Danışandan plan / ödeme ekle</button></div>
      </div>
    );
  }

  if (selectedItemId === 'odemeler') {
    return paymentEntries.length === 0 ? <EmptyState title="Ödeme kaydı yok" text="Alınan ödemeler bir plana bağlandığında burada görünür." /> : (
      <section className="overflow-hidden rounded-[2rem] border border-black/[0.07] bg-white/88">
        {paymentEntries.map((entry, index) => <article key={entry.id} className={'grid grid-cols-[1fr_180px_160px] gap-4 px-5 py-4 ' + (index > 0 ? 'border-t border-black/[0.05]' : '')}><div><strong className="block text-[11px] font-black">{entry.plan.client.firstName} {entry.plan.client.lastName}</strong><span className="mt-1 block text-[9px] font-semibold text-gray-400">{entry.plan.name}{entry.note ? ' · ' + entry.note : ''}</span></div><span className="text-[10px] font-bold">{formatDate(entry.occurredAt, true)}</span><strong className="text-[11px] font-black text-emerald-700">{money(Math.abs(Number(entry.amountMinor)), entry.plan.currency)}</strong></article>)}
      </section>
    );
  }

  return plans.length === 0 ? <EmptyState title="Plan bulunamadı" text="Danışan detayından yeni plan oluşturabilirsiniz." /> : (
    <div className="space-y-3">
      <div className="flex justify-end"><button type="button" onClick={() => onOpenWorkspace?.('danisanlar', '')} className="rounded-full bg-black px-4 py-2.5 text-[10px] font-black text-[#eafda8]">Danışandan plan / ödeme ekle</button></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const balance = (plan.ledgerEntries ?? []).reduce((sum: number, entry: any) => sum + Number(entry.amountMinor ?? 0), 0);
          return <article key={plan.id} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><div className="flex justify-between gap-4"><div><h2 className="text-[12px] font-black">{plan.name}</h2><p className="mt-1 text-[9px] font-semibold text-gray-400">{plan.client.firstName} {plan.client.lastName}</p></div><StatusPill value={plan.status} /></div><div className="mt-4 grid grid-cols-3 gap-2"><Mini label="Tutar" value={money(plan.totalAmountMinor, plan.currency)} /><Mini label="Kalan borç" value={money(Math.max(0, balance), plan.currency)} /><Mini label="Seans" value={String(plan.sessionCount)} /></div><div className="mt-4 flex justify-end"><button type="button" onClick={() => onOpenWorkspace?.('danisanlar', plan.client.id)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-[9px] font-black">Danışanı aç</button></div></article>;
        })}
      </div>
    </div>
  );
}

export function PdfView`,
    "Simple finance workspace",
  );
});

await patchFile("components/workspaces/SystemViews.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `  Metric,\n  SelectField,`,
    `  Metric,\n  SelectField,\n  money,`,
    "Finance report formatter import",
  );
  source = replaceRegexRequired(
    source,
    /export function ReportsView\([\s\S]*?\n\}\n\nexport function UsersView/,
    `export function ReportsView({ data, selectedItemId }: ModuleViewsProps) {
  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktif', INACTIVE: 'Pasif', PROSPECTIVE: 'Potansiyel',
    REQUESTED: 'Talep', PENDING_REVIEW: 'İnceleme bekliyor', CONFIRMED: 'Onaylandı',
    RESCHEDULE_PROPOSED: 'Değişiklik önerildi', REJECTED: 'Reddedildi',
    CANCELLED_BY_CLIENT: 'Danışan iptali', CANCELLED_BY_PRACTITIONER: 'Terapist iptali',
    COMPLETED: 'Tamamlandı', NO_SHOW: 'Gelmedi', EXPIRED: 'Süresi doldu', CANCELLED: 'İptal',
  };
  if (selectedItemId === 'finans') {
    const rows = data?.finance ?? [];
    const financeLabels: Record<string, string> = {
      ACCRUAL: 'Plan tutarı', PAYMENT: 'Alınan ödeme', REFUND: 'İade', ADJUSTMENT: 'Düzeltme', REVERSAL: 'Geri alınan ödeme',
    };
    return rows.length === 0 ? <EmptyState title="Finans raporu verisi yok" text="Görüntüleme yetkisi veya finans kaydı bulunmuyor." /> : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {rows.map((row: any, index: number) => <Metric key={'finance-' + index} title={financeLabels[row.type] ?? row.type} value={money(Math.abs(Number(row._sum?.amountMinor ?? 0)), row.currency)} text={(row._count?._all ?? 0) + ' kayıt · ' + row.currency} />)}
      </div>
    );
  }
  const rows = selectedItemId === 'randevular' || selectedItemId === 'talepler'
    ? (data?.appointments ?? [])
    : selectedItemId === 'danisanlar'
      ? (data?.clients ?? [])
      : selectedItemId === 'planlar'
        ? (data?.plans ?? [])
        : [];
  return rows.length === 0 ? <EmptyState title="Rapor verisi yok" text="Bu raporu görüntülemek için gerekli yetki veya kayıt bulunmuyor." /> : (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {rows.map((row: any, index: number) => <Metric key={selectedItemId + '-' + index} title={statusLabels[row.status] ?? row.status ?? 'Kayıt'} value={row._count?._all ?? 0} text="Canlı veritabanı sonucu" />)}
    </div>
  );
}

export function UsersView`,
    "Meaningful reports",
  );
  source = replaceRegexRequired(
    source,
    /  if\(selectedItemId==='roller'\)\{[\s\S]*?\n  \}\n  if\(selectedItemId==='giris-gecmisi'\)\{/,
    `  if(selectedItemId==='roller'){
    const permissionLabels: Record<string,string> = {
      'appointments:read':'Randevuları görüntüleme','appointments:manage':'Randevuları yönetme',
      'availability:read':'Uygunluğu görüntüleme','availability:manage':'Uygunluğu yönetme',
      'clients:read':'Danışanları görüntüleme','clients:manage':'Danışanları yönetme',
      'consents:read':'İzinleri görüntüleme','consents:manage':'İzinleri yönetme',
      'services:read':'Hizmetleri görüntüleme','services:manage':'Hizmetleri yönetme',
      'finance:read':'Finansı görüntüleme','finance:manage':'Ödeme ve plan yönetme',
      'users:manage':'Kullanıcıları yönetme','audit:read':'İşlem geçmişini görüntüleme',
      'technical-health:read':'Teknik durumu görüntüleme',
    };
    const matrix = data?.rolePermissions ?? {};
    return <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">{Object.entries(matrix).map(([role,rawPermissions])=>{const permissions=Array.isArray(rawPermissions)?rawPermissions:[];return <article key={role} className="rounded-[2rem] border border-black/[0.07] bg-white/88 p-5"><ShieldCheck className="h-5 w-5"/><h2 className="mt-4 text-[12px] font-black">{role}</h2><div className="mt-3 space-y-1.5">{permissions.map((permission)=><p key={String(permission)} className="text-[9px] font-semibold text-gray-500">{permissionLabels[String(permission)] ?? String(permission)}</p>)}</div></article>;})}</div>;
  }
  if(selectedItemId==='giris-gecmisi'){`,
    "Actual role permission summary",
  );
  source = replaceRequired(
    source,
    `{formatDate(user.lastLoginAt,true)}`,
    `{user.lastLoginAt ? formatDate(user.lastLoginAt,true) : 'Henüz giriş yok'}`,
    "Honest last-login empty state",
  );
  source = replaceRequired(
    source,
    `<StatusPill value={active?'ACTIVE':'NOT_CONFIGURED'}/>`,
    `<StatusPill value={active?'CONFIGURED':'NOT_CONFIGURED'}/>`,
    "Configured integration status",
  );
  source = replaceRequired(
    source,
    `{active?'Bağlantı sunucu yapılandırmasında mevcut.':'Henüz yapılandırılmamış; sahte işlem düğmesi gösterilmez.'}`,
    `{active?'Gerekli sunucu yapılandırması mevcut. Bu ifade canlı sağlık testi anlamına gelmez.':'Henüz yapılandırılmamış; çalışıyormuş gibi gösterilmez.'}`,
    "Integration status explanation",
  );
  return source;
});

await patchFile("components/WorkspacePanel.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `{ label: 'Yeni Randevu', desc: 'Randevu takvimine yeni seans atayın.', icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100/40', action: () => onOpenWorkspace?.('randevular', 'liste') },`,
    `{ label: 'Yeni Randevu', desc: 'Randevu takvimine yeni seans atayın.', icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100/40', action: () => onOpenWorkspace?.('randevular', 'yeni') },`,
    "New appointment quick action",
  );
  source = replaceRequired(
    source,
    `{ label: 'Yeni Ödeme', desc: 'Ödeme tahsilat kaydı girin.', icon: CreditCard, color: 'text-lime-700 bg-lime-50 border-lime-100/40', action: () => onOpenWorkspace?.('odeme-planlar', 'odemeler') },`,
    `{ label: 'Yeni Ödeme', desc: 'Danışanın açık planına ödeme kaydı girin.', icon: CreditCard, color: 'text-lime-700 bg-lime-50 border-lime-100/40', action: () => onOpenWorkspace?.('danisanlar', '') },`,
    "Payment quick action",
  );
  source = replaceRequired(
    source,
    `{ label: 'Yeni Plan', desc: 'Danışana seans sepeti ve plan tanımlayın.', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100/40', action: () => onOpenWorkspace?.('odeme-planlar', 'planlar') },`,
    `{ label: 'Yeni Plan', desc: 'Danışana yeni seans planı tanımlayın.', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-100/40', action: () => onOpenWorkspace?.('danisanlar', '') },`,
    "Plan quick action",
  );
  source = replaceRequired(
    source,
    `              {/* Card 1: Bugünün Seans Analizi */}\n              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">`,
    `              {/* Card 1: Bugünün Seans Analizi */}\n              <div className={(overview?.access?.appointments === false ? 'hidden ' : '') + 'bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'}>`,
    "Appointment overview permission visibility",
  );
  source = replaceRequired(
    source,
    `              {/* Card 2: Bugünün Finansal Durumu */}\n              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">`,
    `              {/* Card 2: Bugünün Finansal Durumu */}\n              <div className={(overview?.access?.finance === false ? 'hidden ' : '') + 'bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'}>`,
    "Finance overview permission visibility",
  );
  source = replaceRequired(
    source,
    `              {/* Card 3: Danışan Portföyü */}\n              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">`,
    `              {/* Card 3: Danışan Portföyü */}\n              <div className={(overview?.access?.clients === false ? 'hidden ' : '') + 'bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'}>`,
    "Client overview permission visibility",
  );
  source = replaceRequired(
    source,
    `              {/* Card 4: Aktif Plan ve Seans Takibi */}\n              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group">`,
    `              {/* Card 4: Aktif Plan ve Seans Takibi */}\n              <div className={(overview?.access?.finance === false ? 'hidden ' : '') + 'bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'}>`,
    "Plan overview permission visibility",
  );
  source = replaceRegexRequired(
    source,
    /\s*\{\/\* Payment badge \*\/\}\s*<span className=\{`px-2\.5[\s\S]*?<\/span>/,
    "",
    "Remove meaningless appointment payment badge",
  );
  return source;
});
