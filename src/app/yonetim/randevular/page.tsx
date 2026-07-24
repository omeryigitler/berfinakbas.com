'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AppointmentItem {
  client: { firstName: string; id: string; lastName: string; type: string };
  duplicateReview: { candidates: unknown[]; status: string };
  endsAt: string;
  id: string;
  locationTypeSnapshot: string;
  practitioner: { displayName: string };
  publicReference: string;
  serviceNameSnapshot: string;
  startsAt: string;
  status: string;
}

interface Prerequisites {
  clients: Array<{ firstName: string; id: string; lastName: string; type: string }>;
  practitioners: Array<{ displayName: string; id: string; timeZone: string }>;
  services: Array<{
    defaultDurationMinutes: number;
    id: string;
    locationType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
    name: string;
  }>;
}

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Onaylı',
  PENDING_REVIEW: 'Onay bekliyor',
  REQUESTED: 'Talep alındı',
  RESCHEDULE_PROPOSED: 'Saat önerildi',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    timeZone: 'Europe/Malta',
    year: 'numeric',
  }).format(new Date(value));
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

function defaultAppointmentDate() {
  const date = new Date(Date.now() + 86_400_000);
  return date.toISOString().slice(0, 10);
}

export default function RandevularPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [prerequisites, setPrerequisites] = useState<Prerequisites | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [pendingResponse, confirmedResponse] = await Promise.all([
        fetch('/api/admin/appointments?status=REQUESTED,PENDING_REVIEW&take=100', { cache: 'no-store' }),
        fetch('/api/admin/appointments?status=CONFIRMED,RESCHEDULE_PROPOSED&take=100', { cache: 'no-store' }),
      ]);
      if (!pendingResponse.ok) throw new Error(await readError(pendingResponse));
      if (!confirmedResponse.ok) throw new Error(await readError(confirmedResponse));
      const pendingPayload = (await pendingResponse.json()) as { data: AppointmentItem[] };
      const confirmedPayload = (await confirmedResponse.json()) as { data: AppointmentItem[] };
      const merged = [...pendingPayload.data, ...confirmedPayload.data]
        .filter((item, index, rows) => rows.findIndex((candidate) => candidate.id === item.id) === index)
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
      setAppointments(merged);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Randevular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrerequisites = useCallback(async () => {
    const response = await fetch('/api/admin/appointment-prerequisites', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(await readError(response));
    const payload = (await response.json()) as { data: Prerequisites };
    setPrerequisites(payload.data);
    setSelectedServiceId((current) => current || payload.data.services[0]?.id || '');
    return payload.data;
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAppointments]);

  const selectedService = useMemo(
    () => prerequisites?.services.find((service) => service.id === selectedServiceId) ?? prerequisites?.services[0] ?? null,
    [prerequisites, selectedServiceId],
  );

  async function openCreate() {
    setCreateOpen(true);
    setMessage('');
    try {
      await loadPrerequisites();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Randevu seçenekleri yüklenemedi.');
    }
  }

  async function setupPrerequisites() {
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointment-prerequisites', {
        headers: { 'x-correlation-id': crypto.randomUUID() },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await readError(response));
      await loadPrerequisites();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Varsayılan randevu ayarları oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prerequisites || !selectedService) return;
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', {
        body: JSON.stringify({
          appointmentDate: String(formData.get('appointmentDate') ?? ''),
          appointmentTime: String(formData.get('appointmentTime') ?? ''),
          clientId: String(formData.get('clientId') ?? ''),
          durationMinutes: Number(formData.get('durationMinutes') ?? selectedService.defaultDurationMinutes),
          guardianId: null,
          locationType: String(formData.get('locationType') ?? selectedService.locationType),
          practitionerId: String(formData.get('practitionerId') ?? ''),
          requestNote: String(formData.get('requestNote') ?? '').trim() || null,
          serviceId: selectedService.id,
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await readError(response));
      setCreateOpen(false);
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Randevu oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function transitionStatus(appointmentId: string, toStatus: string, reasonCode: string) {
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
        body: JSON.stringify({ reasonCode, toStatus }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(await readError(response));
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Randevu durumu güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = appointments.filter((appointment) => ['REQUESTED', 'PENDING_REVIEW'].includes(appointment.status)).length;
  const confirmedCount = appointments.filter((appointment) => appointment.status === 'CONFIRMED').length;

  return (
    <>
      <div style={styles.page}>
        <section style={styles.headerCard}>
          <div>
            <span style={styles.kicker}>RANDEVU OPERASYONU</span>
            <h1 style={styles.title}>Randevular</h1>
            <p style={styles.subtitle}>Talep, onay ve yaklaşan seansların canlı listesi.</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => void loadAppointments()} style={styles.secondaryButton} type="button">Yenile</button>
            <button onClick={() => void openCreate()} style={styles.primaryButton} type="button">Yeni randevu</button>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Açık talep</span><strong style={styles.summaryValue}>{pendingCount}</strong><small style={styles.summaryMeta}>Karar veya inceleme bekliyor</small></article>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Onaylı</span><strong style={styles.summaryValue}>{confirmedCount}</strong><small style={styles.summaryMeta}>Planlanan aktif seans</small></article>
          <article style={styles.summaryCard}><span style={styles.summaryLabel}>Toplam görünür</span><strong style={styles.summaryValue}>{appointments.length}</strong><small style={styles.summaryMeta}>Açık ve yaklaşan kayıt</small></article>
        </section>

        {message && !createOpen ? <div style={styles.message}>{message}</div> : null}

        <section style={styles.listPanel}>
          <div style={styles.listHeader}><h2 style={styles.listTitle}>Randevu akışı</h2><span style={styles.badge}>CANLI VERİ</span></div>
          <div style={styles.list}>
            {loading ? <p style={styles.empty}>Randevular yükleniyor...</p> : null}
            {!loading && appointments.length === 0 ? <p style={styles.empty}>Açık veya yaklaşan randevu bulunmuyor.</p> : null}
            {appointments.map((appointment) => (
              <article key={appointment.id} style={styles.appointmentCard}>
                <div style={styles.avatar}>{appointment.client.firstName[0]}{appointment.client.lastName[0]}</div>
                <div style={styles.appointmentMain}>
                  <strong>{appointment.client.firstName} {appointment.client.lastName}</strong>
                  <span>{appointment.serviceNameSnapshot} • {appointment.practitioner.displayName}</span>
                  <small>{appointment.publicReference} • {appointment.locationTypeSnapshot}</small>
                </div>
                <div style={styles.appointmentMeta}>
                  <strong>{formatDateTime(appointment.startsAt)}</strong>
                  <span style={{ ...styles.statusPill, ...(['REQUESTED', 'PENDING_REVIEW'].includes(appointment.status) ? styles.statusPending : styles.statusActive) }}>{statusLabels[appointment.status] ?? appointment.status}</span>
                  {appointment.duplicateReview.status === 'PENDING' ? <small style={styles.warning}>Olası mükerrer kayıt</small> : null}
                  {appointment.status === 'REQUESTED' ? (
                    <div style={styles.rowActions}>
                      <button disabled={submitting} onClick={() => void transitionStatus(appointment.id, 'PENDING_REVIEW', 'ADMIN_REVIEW')} style={styles.reviewButton} type="button">İncelemeye al</button>
                    </div>
                  ) : null}
                  {['PENDING_REVIEW', 'RESCHEDULE_PROPOSED'].includes(appointment.status) ? (
                    <div style={styles.rowActions}>
                      <button disabled={submitting} onClick={() => void transitionStatus(appointment.id, 'CONFIRMED', 'ADMIN_CONFIRMED')} style={styles.approveButton} type="button">Onayla</button>
                      <button disabled={submitting} onClick={() => void transitionStatus(appointment.id, 'REJECTED', 'ADMIN_REJECTED')} style={styles.rejectButton} type="button">Reddet</button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {createOpen ? (
        <div style={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="randevu-olustur" aria-modal="true" role="dialog" style={styles.modal}>
            <div style={styles.modalHeader}>
              <div><span style={styles.kicker}>YENİ RANDEVU</span><h2 id="randevu-olustur" style={styles.modalTitle}>Randevu oluştur</h2></div>
              <button onClick={() => setCreateOpen(false)} style={styles.closeButton} type="button">×</button>
            </div>

            {prerequisites && (prerequisites.services.length === 0 || prerequisites.practitioners.length === 0) ? (
              <div style={styles.setupCard}>
                <strong>Randevu için varsayılan hizmet veya terapist kaydı eksik.</strong>
                <span>Mevcut yönetici hesabına bağlı ilk görüşme altyapısı otomatik oluşturulabilir.</span>
                <button disabled={submitting} onClick={() => void setupPrerequisites()} style={styles.primaryButton} type="button">{submitting ? 'Hazırlanıyor...' : 'Randevu altyapısını hazırla'}</button>
              </div>
            ) : null}

            {prerequisites && prerequisites.services.length > 0 && prerequisites.practitioners.length > 0 ? (
              <form onSubmit={createAppointment} style={styles.form}>
                <div style={styles.formGrid}>
                  <label style={styles.field}><span>Danışan</span><select name="clientId" required style={styles.input}><option value="">Danışan seçin</option>{prerequisites.clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></label>
                  <label style={styles.field}><span>Terapist</span><select name="practitionerId" required style={styles.input}><option value="">Terapist seçin</option>{prerequisites.practitioners.map((practitioner) => <option key={practitioner.id} value={practitioner.id}>{practitioner.displayName}</option>)}</select></label>
                  <label style={styles.field}><span>Hizmet</span><select name="serviceId" onChange={(event) => setSelectedServiceId(event.target.value)} required style={styles.input} value={selectedServiceId}>{prerequisites.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
                  <label style={styles.field}><span>Süre</span><select defaultValue={selectedService?.defaultDurationMinutes ?? 15} key={selectedService?.id} name="durationMinutes" style={styles.input}><option value="15">15 dakika</option><option value="30">30 dakika</option><option value="45">45 dakika</option><option value="60">60 dakika</option></select></label>
                  <label style={styles.field}><span>Tarih</span><input defaultValue={defaultAppointmentDate()} min={new Date().toISOString().slice(0, 10)} name="appointmentDate" required style={styles.input} type="date" /></label>
                  <label style={styles.field}><span>Saat</span><input defaultValue="10:00" name="appointmentTime" required style={styles.input} type="time" /></label>
                  <label style={styles.field}><span>Konum</span><select defaultValue={selectedService?.locationType ?? 'HYBRID'} key={`location-${selectedService?.id}`} name="locationType" style={styles.input}><option value="IN_PERSON">Yüz yüze</option><option value="ONLINE">Online</option><option value="HYBRID">Hibrit</option></select></label>
                </div>
                <label style={styles.field}><span>Randevu notu</span><textarea maxLength={500} name="requestNote" style={styles.textarea} /></label>
                {message ? <div style={styles.message}>{message}</div> : null}
                <div style={styles.modalActions}><button onClick={() => setCreateOpen(false)} style={styles.secondaryButton} type="button">Vazgeç</button><button disabled={submitting} style={styles.primaryButton} type="submit">{submitting ? 'Oluşturuluyor...' : 'Randevu oluştur'}</button></div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

const styles = {
  page: { display: 'grid', gap: 18 },
  headerCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, border: '1px solid rgba(50,49,48,.12)', borderRadius: 28, background: 'linear-gradient(135deg,#fff 0%,#faf9f5 68%,#efffc3 100%)', padding: 24 },
  kicker: { display: 'inline-flex', width: 'fit-content', borderRadius: 999, background: '#050505', padding: '5px 9px', color: '#dfff65', fontSize: 8, fontWeight: 800, letterSpacing: '.07em' },
  title: { margin: '10px 0 4px', color: '#151413', fontSize: 28, letterSpacing: '-.04em' },
  subtitle: { margin: 0, color: '#77727d', fontSize: 13 },
  headerActions: { display: 'flex', gap: 8 },
  primaryButton: { minHeight: 38, border: '1px solid #050505', borderRadius: 999, background: '#050505', padding: '0 16px', color: '#fff', font: 'inherit', fontSize: 11, fontWeight: 750, cursor: 'pointer' },
  secondaryButton: { minHeight: 38, border: '1px solid rgba(50,49,48,.15)', borderRadius: 999, background: '#fff', padding: '0 16px', color: '#4e4a46', font: 'inherit', fontSize: 11, fontWeight: 750, cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
  summaryCard: { display: 'grid', gap: 8, border: '1px solid rgba(50,49,48,.12)', borderRadius: 22, background: '#fff', padding: 20 },
  summaryLabel: { color: '#9692a0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const },
  summaryValue: { color: '#151413', fontSize: 32, lineHeight: 1 },
  summaryMeta: { color: '#77727d', fontSize: 11 },
  listPanel: { border: '1px solid rgba(50,49,48,.12)', borderRadius: 24, background: '#fff', padding: 20 },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(50,49,48,.08)', paddingBottom: 12 },
  listTitle: { margin: 0, color: '#151413', fontSize: 15 },
  badge: { borderRadius: 999, background: '#efffc3', padding: '4px 8px', color: '#263000', fontSize: 8, fontWeight: 800 },
  list: { display: 'grid', gap: 10, marginTop: 12 },
  appointmentCard: { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) auto', alignItems: 'center', gap: 12, borderRadius: 16, background: '#faf9f7', padding: 13 },
  avatar: { display: 'grid', width: 44, height: 44, placeItems: 'center', borderRadius: '50%', background: '#050505', color: '#dfff65', fontSize: 11, fontWeight: 800 },
  appointmentMain: { display: 'grid', gap: 4, color: '#171615', fontSize: 12 },
  appointmentMeta: { display: 'grid', justifyItems: 'end', gap: 5, color: '#77727d', fontSize: 10 },
  statusPill: { borderRadius: 999, padding: '4px 8px', fontSize: 8, fontWeight: 800 },
  statusPending: { background: '#fff7ed', color: '#9a3412' },
  statusActive: { background: '#efffc3', color: '#263000' },
  warning: { color: '#b45309' },
  rowActions: { display: 'flex', gap: 6, marginTop: 2 },
  reviewButton: { minHeight: 28, border: '1px solid #050505', borderRadius: 999, background: '#050505', padding: '0 12px', color: '#fff', font: 'inherit', fontSize: 10, fontWeight: 750, cursor: 'pointer' },
  approveButton: { minHeight: 28, border: '1px solid #12897b', borderRadius: 999, background: '#12897b', padding: '0 12px', color: '#fff', font: 'inherit', fontSize: 10, fontWeight: 750, cursor: 'pointer' },
  rejectButton: { minHeight: 28, border: '1px solid rgba(50,49,48,.2)', borderRadius: 999, background: '#fff', padding: '0 12px', color: '#9a3412', font: 'inherit', fontSize: 10, fontWeight: 750, cursor: 'pointer' },
  empty: { margin: 0, color: '#77727d', fontSize: 12 },
  message: { borderRadius: 12, background: '#fff7ed', padding: '10px 12px', color: '#9a3412', fontSize: 11 },
  modalBackdrop: { position: 'fixed' as const, inset: 0, zIndex: 120, display: 'grid', placeItems: 'center', background: 'rgba(5,5,5,.42)', padding: 24 },
  modal: { width: 'min(100%,760px)', maxHeight: 'calc(100vh - 48px)', overflow: 'auto', borderRadius: 24, background: '#fff', padding: 22, boxShadow: '0 28px 80px rgba(5,5,5,.22)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid rgba(50,49,48,.1)', paddingBottom: 14 },
  modalTitle: { margin: '8px 0 0', color: '#151413', fontSize: 22 },
  closeButton: { display: 'grid', width: 32, height: 32, placeItems: 'center', border: '1px solid rgba(50,49,48,.14)', borderRadius: '50%', background: '#fff', cursor: 'pointer' },
  form: { display: 'grid', gap: 16, marginTop: 18 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
  field: { display: 'grid', gap: 7, color: '#77727d', fontSize: 10, fontWeight: 750 },
  input: { width: '100%', border: '1px solid rgba(50,49,48,.14)', borderRadius: 12, background: '#faf9f7', padding: '10px 12px', color: '#171615', font: 'inherit', fontSize: 12, outline: 0 },
  textarea: { width: '100%', minHeight: 100, resize: 'vertical' as const, border: '1px solid rgba(50,49,48,.14)', borderRadius: 12, background: '#faf9f7', padding: '10px 12px', color: '#171615', font: 'inherit', fontSize: 12, outline: 0 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  setupCard: { display: 'grid', gap: 10, marginTop: 18, borderRadius: 18, background: '#f7f8df', padding: 16, color: '#171615', fontSize: 12 },
};