import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const handleAddDocument = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  const handleAddContact/,
    `  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.file) {
      triggerToast('Yüklenecek belgeyi seçin.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.set('file', docForm.file);
      formData.set('title', docForm.name || docForm.file.name);
      formData.set('category', docForm.type);
      const response = await fetch(\`/api/admin/clients/\${client.id}/documents\`, {
        method: 'POST',
        headers: { 'x-correlation-id': createCorrelationId() },
        body: formData,
      });
      const payload = await requireSuccess(response);
      const stored = payload?.data ?? {};
      const newDoc: DocumentRecord = {
        id: stored.id,
        name: stored.title,
        type: stored.category,
        size: Number(stored.sizeBytes) > 0
          ? \`${"${Math.max(1, Math.round(Number(stored.sizeBytes) / 1024))} KB"}\`
          : '—',
        date: new Date(stored.createdAt ?? Date.now()).toISOString().split('T')[0],
        status: 'Aktif',
        url: stored.downloadUrl ?? stored.url ?? '',
      } as any;
      onUpdateClient(client.id, {
        ...client,
        documents: [newDoc, ...client.documents],
      });
      setDocForm({ name: 'Gelişim Gözlem Formu.pdf', type: 'Yüklenen Belge', file: null });
      setIsUploadingDoc(false);
      triggerToast('Dosya başarıyla sisteme yüklendi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Belge yüklenemedi.', 'error');
    }
  };

  const handleAddContact`,
    "Real document upload",
  );

  source = replaceRegexRequired(
    source,
    /  const handleAddContact = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Save Notes/,
    `  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.content.trim()) return;
    try {
      const response = await fetch(\`/api/admin/clients/\${client.id}/contact-log\`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': createCorrelationId() },
        body: JSON.stringify({
          channel: contactForm.channel,
          summary: contactForm.content,
          result: contactForm.result || null,
        }),
      });
      const payload = await requireSuccess(response);
      const stored = payload?.data ?? {};
      const newContact = {
        id: stored.id,
        type: stored.channel,
        date: new Date(stored.occurredAt).toLocaleString('tr-TR'),
        content: stored.summary,
        result: stored.result || '—',
      };
      onUpdateClient(client.id, {
        ...client,
        contactHistory: [newContact as any, ...client.contactHistory],
      });
      setContactForm({ channel: 'E-posta', content: '', result: '' });
      setIsAddingContact(false);
      triggerToast('İletişim kaydı eklendi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'İletişim kaydı eklenemedi.', 'error');
    }
  };

  // Save Notes`,
    "Persist contact before local success",
  );

  return source;
});
