import { patchFile, replaceRequired, replaceRegexRequired } from "./dashboard-patch-utils.mjs";

await patchFile("components/ClientDetailsHub.tsx", (initialSource) => {
  let source = initialSource;
  source = replaceRegexRequired(
    source,
    /  const handleSaveEdit = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Add Appointment/,
    `  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parts = editForm.name.trim().split(/\\s+/);
      const firstName = parts.shift() || editForm.name.trim() || 'Danışan';
      const lastName = parts.join(' ') || '-';
      const yearFromBirth = editForm.birthDate ? Number(String(editForm.birthDate).slice(0, 4)) : NaN;
      const birthYear = Number.isFinite(yearFromBirth) && yearFromBirth >= 1900
        ? yearFromBirth
        : (Number(editForm.age) ? new Date().getFullYear() - Number(editForm.age) : null);
      const response = await fetch(\`/api/admin/clients/\${client.id}\`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-correlation-id': createCorrelationId() },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: editForm.phone || null,
          whatsapp: editForm.whatsapp || null,
          email: editForm.email || null,
          birthYear,
          address: editForm.address || null,
          city: editForm.city || null,
          district: editForm.district || null,
          country: editForm.country || null,
          preferredContactMethod: editForm.preferredContactMethod || null,
          contactConsent: Boolean(editForm.contactConsent),
          emergencyContact: editForm.emergencyContact || null,
          parentPrimaryName: editForm.parentPrimaryName || null,
          parentPrimaryPhone: editForm.parentPrimaryPhone || null,
          parentPrimaryEmail: editForm.parentPrimaryEmail || null,
          parentPrimaryRelation: client.parentPrimaryRelation || null,
        }),
      });
      await requireSuccess(response);
      const updated: ClientDetails = {
        ...client,
        name: editForm.name,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        email: editForm.email,
        age: Number(editForm.age),
        birthDate: editForm.birthDate,
        address: editForm.address,
        city: editForm.city,
        district: editForm.district,
        country: editForm.country,
        preferredContactMethod: editForm.preferredContactMethod as any,
        contactConsent: editForm.contactConsent,
        parentPrimaryName: editForm.parentPrimaryName,
        parentPrimaryPhone: editForm.parentPrimaryPhone,
        parentPrimaryEmail: editForm.parentPrimaryEmail,
        emergencyContact: editForm.emergencyContact,
      };
      onUpdateClient(client.id, updated);
      setIsEditing(false);
      triggerToast('Danışan bilgileri başarıyla güncellendi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Danışan bilgileri kaydedilemedi.', 'error');
    }
  };

  // Add Appointment`,
    "Persist client edit before local success",
  );

  source = replaceRegexRequired(
    source,
    /  const handleAddAppointment = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n\n  \/\/ Add Plan/,
    `  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const practitionerId = prereq.practitioners[0]?.id;
    if (!appForm.serviceId || !practitionerId) {
      triggerToast('Aktif hizmet ve terapist seçimi bulunamadı.', 'error');
      return;
    }
    const guardianId = client.ageGroup === 'Çocuk' ? (client as any)._guardianId : null;
    if (client.ageGroup === 'Çocuk' && !guardianId) {
      triggerToast('Çocuk danışan için bağlı birincil veli bulunamadı.', 'error');
      return;
    }
    try {
      const durationMinutes = parseInt(String(appForm.duration).replace(/\\D/g, ''), 10) || 50;
      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-correlation-id': createCorrelationId() },
        body: JSON.stringify({
          clientId: client.id,
          serviceId: appForm.serviceId,
          practitionerId,
          appointmentDate: appForm.date,
          appointmentTime: appForm.time,
          durationMinutes,
          locationType: appForm.type === 'Online' ? 'ONLINE' : 'IN_PERSON',
          requestNote: appForm.note || null,
          guardianId,
        }),
      });
      const payload = await requireSuccess(response);
      const newApp: Appointment = {
        id: payload?.data?.id ?? createCorrelationId(),
        date: appForm.date,
        time: appForm.time,
        service: appForm.service,
        duration: appForm.duration,
        status: 'Yaklaşan',
        payment: 'Bekleniyor',
        type: appForm.type,
        note: appForm.note,
      };
      onUpdateClient(client.id, {
        ...client,
        nextAppointment: \`${"${appForm.date} ${appForm.time}"}\`,
        appointments: [newApp, ...client.appointments],
      });
      setIsAddingAppointment(false);
      triggerToast('Yeni randevu başarıyla eklendi ve takvime işlendi!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Randevu kaydedilemedi.', 'error');
    }
  };

  // Add Plan`,
    "Persist appointment before local success",
  );

  return source;
});
