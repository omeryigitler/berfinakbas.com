import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const handleSaveNotes = async \(\) => \{[\s\S]*?\n  \};\n\n  \/\/ Status transitions/,
    `  const handleSaveNotes = async () => {
    const noteCats: Array<[string, string, string]> = [
      ['ADMIN', notesForm.admin, client.notes.admin],
      ['APPOINTMENT', notesForm.appointment, client.notes.appointment],
      ['PAYMENT', notesForm.payment, client.notes.payment],
      ['PLAN', notesForm.plan, client.notes.plan],
    ];
    try {
      for (const [category, next, prev] of noteCats) {
        if (!next || !next.trim() || next.trim() === (prev || '').trim()) continue;
        const response = await fetch(\`/api/admin/clients/\${client.id}/notes\`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-correlation-id': createCorrelationId() },
          body: JSON.stringify({ category, note: next.trim() }),
        });
        await requireSuccess(response);
      }
      onUpdateClient(client.id, {
        ...client,
        notes: {
          admin: notesForm.admin,
          appointment: notesForm.appointment,
          payment: notesForm.payment,
          plan: notesForm.plan,
        },
      });
      triggerToast('Notlar başarıyla kaydedildi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Notlar kaydedilemedi.', 'error');
    }
  };

  // Status transitions`,
    "Validate note API responses",
  );

  source = replaceRegexRequired(
    source,
    /  const handleToggleStatus = \(newStatus: 'Aktif' \| 'Pasif' \| 'Arşivlenmiş' \| 'Potansiyel'\) => \{[\s\S]*?\n  \};\n\n  \/\/ Stage change transition[\s\S]*?\n  \};\n\n  \/\/ Mark next upcoming session complete/,
    `  const persistStatus = async (newStatus: 'Aktif' | 'Pasif' | 'Arşivlenmiş' | 'Potansiyel') => {
    const apiStatus = newStatus === 'Aktif'
      ? 'ACTIVE'
      : newStatus === 'Potansiyel'
        ? 'PROSPECTIVE'
        : 'INACTIVE';
    const response = await fetch(\`/api/admin/clients/\${client.id}\`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-correlation-id': createCorrelationId() },
      body: JSON.stringify({ status: apiStatus }),
    });
    await requireSuccess(response);
  };

  const handleToggleStatus = async (newStatus: 'Aktif' | 'Pasif' | 'Arşivlenmiş' | 'Potansiyel') => {
    try {
      await persistStatus(newStatus);
      onUpdateClient(client.id, { ...client, status: newStatus });
      triggerToast(\`Danışan durumu "\${newStatus}" olarak güncellendi!\`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Danışan durumu güncellenemedi.', 'error');
    }
  };

  const handleStageClick = async (stage: number, stageName: string) => {
    const newStatus = stage === 1
      ? 'Potansiyel'
      : stage === 4
        ? 'Pasif'
        : stage === 5
          ? 'Arşivlenmiş'
          : 'Aktif';
    try {
      await persistStatus(newStatus);
      setCurrentStage(stage);
      onUpdateClient(client.id, { ...client, status: newStatus });
      triggerToast(\`Süreç "\${stageName}" aşamasına taşındı!\`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Süreç güncellenemedi.', 'error');
    }
  };

  // Mark next upcoming session complete`,
    "Persist status and stage changes",
  );

  return source;
});
