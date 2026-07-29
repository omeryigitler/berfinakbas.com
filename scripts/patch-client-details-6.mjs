import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const handleMarkSessionComplete = \(\) => \{[\s\S]*?\n  \};\n\n  \/\/ Opens a real WhatsApp/,
    `  const handleMarkSessionComplete = async () => {
    const upcomingIndex = client.appointments.findIndex((appointment) => appointment.status === 'Yaklaşan');
    if (upcomingIndex === -1) {
      triggerToast('Yaklaşan bir randevu bulunamadı.', 'error');
      return;
    }
    const appointment = client.appointments[upcomingIndex];
    try {
      const response = await fetch(\`/api/admin/appointments/\${appointment.id}/complete\`, {
        method: 'POST',
        headers: { 'x-correlation-id': createCorrelationId() },
      });
      const payload = await requireSuccess(response);
      const appointments = [...client.appointments];
      appointments[upcomingIndex] = { ...appointment, status: 'Tamamlandı' };
      const plans = [...client.plans];
      if (payload?.data?.consumedPlanId && plans[0]) {
        const activePlan = plans[0];
        const usedSessions = Math.min(activePlan.totalSessions, activePlan.usedSessions + 1);
        plans[0] = {
          ...activePlan,
          usedSessions,
          remainingSessions: Math.max(0, activePlan.totalSessions - usedSessions),
          usageHistory: [
            {
              date: new Date().toISOString().split('T')[0],
              sessionNumber: usedSessions,
              note: \`${"${appointment.service}"} seansı tamamlandı.\`,
              specialist: 'Berfin Akbaş',
            },
            ...activePlan.usageHistory,
          ],
        };
      }
      onUpdateClient(client.id, {
        ...client,
        lastAppointment: \`${"${appointment.date} ${appointment.time}"}\`,
        nextAppointment: 'Planlanmadı',
        appointments,
        plans,
      });
      triggerToast('Seans tamamlandı olarak kaydedildi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Seans tamamlanamadı.', 'error');
    }
  };

  const handleArchiveDocument = async (document: DocumentRecord) => {
    try {
      const response = await fetch(\`/api/admin/clients/\${client.id}/documents/\${document.id}\`, {
        method: 'DELETE',
        headers: { 'x-correlation-id': createCorrelationId() },
      });
      await requireSuccess(response);
      onUpdateClient(client.id, {
        ...client,
        documents: client.documents.filter((item) => item.id !== document.id),
      });
      triggerToast(\`\${document.name} arşive taşındı.\`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Belge arşivlenemedi.', 'error');
    }
  };

  // Opens a real WhatsApp`,
    "Persist appointment completion and document archive",
  );

  return source;
});
