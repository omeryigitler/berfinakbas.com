import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("App.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `    _completionPlanId: active && Number(active.remainingSessions ?? 0) > 0 ? active.id : null,
    _detailLoaded: true,`,
    `    _canReadFinance: d.financeAccess === true,
    _detailLoaded: true,`,
    "Remove automatic completion plan selection",
  );
  source = replaceRequired(
    source,
    `        guardianPhone: isChild && newlyCreated.phone !== 'Girilmedi' ? newlyCreated.phone : null,`,
    `        guardianPhone: isChild ? newlyCreated.parentPhone || null : null,`,
    "Separate child and guardian phone numbers",
  );
  return source;
});

await patchFile("components/MyWorkPanel.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /const serviceOptions = \[[\s\S]*?\n\];\n\nconst serviceFilterOptions = \[[\s\S]*?\n\];/,
    `const serviceOptions: Array<{ value: string; label: string }> = [];

const serviceFilterOptions = [
  { value: 'Tüm', label: 'Tüm Hizmetler' },
];`,
    "Remove unrelated service fallbacks",
  );
  source = replaceRegexRequired(
    source,
    /  \/\/ Real active services drive[\s\S]*?\n  \}, \[\]\);/,
    `  // Only services returned by the real API are shown.
  const [realServiceOptions, setRealServiceOptions] = useState(serviceOptions);
  const [realServiceFilterOptions, setRealServiceFilterOptions] = useState(serviceFilterOptions);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/admin/appointment-prerequisites', {
          headers: { accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Hizmetler yüklenemedi.');
        const payload = await response.json();
        const services = (payload?.data?.services ?? []).map((service: any) => ({
          value: service.name,
          label: service.name,
        }));
        if (!cancelled) {
          setRealServiceOptions(services);
          setRealServiceFilterOptions([
            { value: 'Tüm', label: 'Tüm Hizmetler' },
            ...services,
          ]);
        }
      } catch {
        if (!cancelled) {
          setRealServiceOptions([]);
          setRealServiceFilterOptions([{ value: 'Tüm', label: 'Tüm Hizmetler' }]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);`,
    "Use real services without demo fallback",
  );
  source = replaceRequired(
    source,
    `  parentName: string;
  source: string;`,
    `  parentName: string;
  parentPhone?: string;
  source: string;`,
    "Guardian phone client field",
  );
  source = replaceRequired(
    source,
    `    parentName: '',
    source: 'Web Sitesi',`,
    `    parentName: '',
    parentPhone: '',
    source: 'Web Sitesi',`,
    "Guardian phone form state",
  );
  source = replaceRequired(
    source,
    `  const [nameError, setNameError] = useState(false);`,
    `  const [nameError, setNameError] = useState(false);
  const [guardianError, setGuardianError] = useState('');`,
    "Guardian validation state",
  );
  source = replaceRequired(
    source,
    `    setNameError(false);
    const newlyCreated: Client = {`,
    `    setNameError(false);
    if (newClient.ageGroup === 'Çocuk') {
      if (!newClient.parentName.trim()) {
        setGuardianError('Veli adı ve soyadı zorunludur.');
        return;
      }
      if (!newClient.parentPhone.trim()) {
        setGuardianError('Veli telefonu zorunludur.');
        return;
      }
    }
    setGuardianError('');
    const newlyCreated: Client = {`,
    "Validate guardian identity separately",
  );
  source = replaceRequired(
    source,
    `      phone: newClient.phone || 'Girilmedi',
      email: newClient.email || 'Girilmedi',`,
    `      phone: newClient.phone,
      email: newClient.email,`,
    "Keep optional child contact fields empty",
  );
  source = replaceRequired(
    source,
    `      parentName: newClient.ageGroup === 'Çocuk' ? newClient.parentName : '',
      source: newClient.source,`,
    `      parentName: newClient.ageGroup === 'Çocuk' ? newClient.parentName : '',
      parentPhone: newClient.ageGroup === 'Çocuk' ? newClient.parentPhone : '',
      source: newClient.source,`,
    "Persist separate guardian phone",
  );
  source = replaceRequired(
    source,
    `      parentName: '',
      source: 'Web Sitesi',`,
    `      parentName: '',
      parentPhone: '',
      source: 'Web Sitesi',`,
    "Reset guardian phone",
  );
  source = replaceRegexRequired(
    source,
    /                \{\/\* Conditional Veli input if age group is Kid \*\/\}[\s\S]*?                \{\/\* Service type \*\/\}/,
    `                {/* Conditional guardian fields for child clients */}
                {newClient.ageGroup === 'Çocuk' && (
                  <div className="space-y-3 animate-fade-in bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/30">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-indigo-800 uppercase tracking-wider block">Veli Adı Soyadı *</label>
                      <input
                        type="text"
                        placeholder="Veli adı soyadı"
                        value={newClient.parentName}
                        onChange={(event) => {
                          setNewClient({ ...newClient, parentName: event.target.value });
                          if (guardianError) setGuardianError('');
                        }}
                        className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black text-indigo-800 uppercase tracking-wider block">Veli Telefonu *</label>
                      <input
                        type="tel"
                        placeholder="05XX-XXX-XXXX"
                        value={newClient.parentPhone}
                        onChange={(event) => {
                          setNewClient({ ...newClient, parentPhone: event.target.value });
                          if (guardianError) setGuardianError('');
                        }}
                        className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-300"
                      />
                    </div>
                    {guardianError && (
                      <span className="text-[10px] text-rose-600 font-bold block">{guardianError}</span>
                    )}
                  </div>
                )}

                {/* Service type */}`,
    "Separate guardian form fields",
  );
  return source;
});

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRequired(
    source,
    `  const [contactForm, setContactForm] = useState({ channel: 'E-posta', content: '', result: '' });`,
    `  const [contactForm, setContactForm] = useState({ channel: 'E-posta', content: '', result: '' });
  const upcomingAppointmentId = client.appointments.find((appointment) => appointment.status === 'Yaklaşan')?.id ?? '';
  const [completionPlanOptions, setCompletionPlanOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [completionPlanId, setCompletionPlanId] = useState('');
  useEffect(() => {
    let cancelled = false;
    if (!upcomingAppointmentId) {
      setCompletionPlanOptions([]);
      setCompletionPlanId('');
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const response = await fetch(\`/api/admin/appointments/\${upcomingAppointmentId}/completion-options\`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await requireSuccess(response);
        const plans = (payload?.data?.plans ?? []).map((plan: any) => ({
          value: plan.id,
          label: \`\${plan.name} — \${plan.remainingSessions} seans\`,
        }));
        if (!cancelled) {
          setCompletionPlanOptions(plans);
          setCompletionPlanId(plans.length === 1 ? plans[0].value : '');
        }
      } catch {
        if (!cancelled) {
          setCompletionPlanOptions([]);
          setCompletionPlanId('');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [upcomingAppointmentId]);`,
    "Load authorized completion plan options",
  );
  source = replaceRequired(
    source,
    `      const completionPlanId = (client as any)._completionPlanId ?? null;
      const response = await fetch(\`/api/admin/appointments/\${appointment.id}/complete\`, {`,
    `      if (completionPlanOptions.length > 0 && !completionPlanId) {
        triggerToast('Seans düşülecek planı seçin.', 'error');
        return;
      }
      const response = await fetch(\`/api/admin/appointments/\${appointment.id}/complete\`, {`,
    "Require explicit completion plan selection",
  );
  source = replaceRequired(
    source,
    `                  {/* Buttons */}
                  <div className="flex items-center gap-4 mt-1.5">`,
    `                  {completionPlanOptions.length > 0 && (
                    <div className="bg-white/55 border border-black/5 rounded-xl p-2.5">
                      <CustomSelect
                        label="Seans Düşülecek Plan"
                        options={completionPlanOptions.length > 1
                          ? [{ value: '', label: 'Plan seçin' }, ...completionPlanOptions]
                          : completionPlanOptions}
                        value={completionPlanId}
                        onChange={setCompletionPlanId}
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex items-center gap-4 mt-1.5">`,
    "Render completion plan selector",
  );
  return source;
});
