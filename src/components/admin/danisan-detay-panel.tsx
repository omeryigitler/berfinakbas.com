'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientDetail } from './client-dashboard-types';
import styles from './danisan-detay-panel.module.css';

interface DanisanDetayPanelProps {
  onChanged: () => void;
  onNew: () => void;
  selectedDanisanId: string;
}

type ActiveTab = 'summary' | 'progress' | 'notes' | 'relations';
type ModalType = 'edit' | 'note' | 'delete' | null;

const clientStatusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
  PROSPECTIVE: 'Ön görüşme',
};

const appointmentStatusLabels: Record<string, string> = {
  CANCELLED_BY_CLIENT: 'Danışan iptal etti',
  CANCELLED_BY_PRACTITIONER: 'Uzman iptal etti',
  COMPLETED: 'Tamamlandı',
  CONFIRMED: 'Onaylı',
  NO_SHOW: 'Gelmedi',
  PENDING_REVIEW: 'Onay bekliyor',
  REJECTED: 'Reddedildi',
  REQUESTED: 'Talep alındı',
  RESCHEDULE_PROPOSED: 'Saat önerildi',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Malta',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Malta',
    year: 'numeric',
  }).format(new Date(value));
}

function formatMoney(amountMinor: string, currency: string) {
  const amount = Number(amountMinor) / 100;
  return new Intl.NumberFormat('tr-TR', {
    currency,
    style: 'currency',
  }).format(amount);
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export default function DanisanDetayPanel({
  onChanged,
  onNew,
  selectedDanisanId,
}: DanisanDetayPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!selectedDanisanId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/clients/${selectedDanisanId}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: ClientDetail };
      setDetail(payload.data);
    } catch (loadError) {
      setDetail(null);
      setError(loadError instanceof Error ? loadError.message : 'Danışan bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [selectedDanisanId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveTab('summary');
      void loadDetail();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDetail]);

  const completedAppointments = useMemo(
    () => detail?.appointments.filter((appointment) => appointment.status === 'COMPLETED').length ?? 0,
    [detail],
  );

  const latestService = detail?.nextAppointment?.serviceNameSnapshot ?? detail?.appointments[0]?.serviceNameSnapshot ?? 'Henüz hizmet yok';
  const latestNote = detail?.notes[0] ?? null;
  const activePlan = detail?.plans.find((plan) => plan.status === 'ACTIVE') ?? detail?.plans[0] ?? null;
  const grade = !detail ? '—' : detail.score >= 85 ? 'A' : detail.score >= 70 ? 'B' : detail.score >= 50 ? 'C' : 'D';

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;

    const formData = new FormData(event.currentTarget);
    const birthYearValue = String(formData.get('birthYear') ?? '').trim();
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}`, {
        body: JSON.stringify({
          birthYear: birthYearValue ? Number(birthYearValue) : null,
          email: String(formData.get('email') ?? '').trim() || null,
          firstName: String(formData.get('firstName') ?? '').trim(),
          lastName: String(formData.get('lastName') ?? '').trim(),
          phone: String(formData.get('phone') ?? '').trim() || null,
          preferredName: String(formData.get('preferredName') ?? '').trim() || null,
          status: String(formData.get('status') ?? detail.status),
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(await readError(response));
      setModal(null);
      await loadDetail();
      onChanged();
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Danışan kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}/notes`, {
        body: JSON.stringify({
          category: String(formData.get('category') ?? 'GENERAL'),
          note: String(formData.get('note') ?? '').trim(),
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await readError(response));
      setModal(null);
      await loadDetail();
      onChanged();
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Not eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivateClient() {
    if (!detail) return;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/clients/${detail.id}`, {
        headers: { 'x-correlation-id': crypto.randomUUID() },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await readError(response));
      setModal(null);
      await loadDetail();
      onChanged();
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Danışan pasife alınamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedDanisanId) {
    return <section className={styles.panel}><div className={styles.loadingState}>Bir danışan seçin.</div></section>;
  }

  if (loading && !detail) {
    return <section className={styles.panel}><div className={styles.loadingState}>Danışan bilgileri yükleniyor...</div></section>;
  }

  if (error || !detail) {
    return (
      <section className={styles.panel}>
        <div className={styles.errorState}>
          <span>{error || 'Danışan kaydı bulunamadı.'}</span>
          <button className={styles.btnPrimary} onClick={() => void loadDetail()} type="button">Yeniden dene</button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.topSection}>
        <div className={styles.toolbar}>
          <button className={styles.toolBtn} onClick={() => { setMessage(''); setModal('edit'); }} type="button">💾 Kaydet</button>
          <button className={styles.toolBtn} onClick={onNew} type="button">➕ Yeni</button>
          <button className={styles.toolBtn} disabled={detail.status === 'INACTIVE'} onClick={() => { setMessage(''); setModal('delete'); }} type="button">🗑️ Pasife Al</button>
          <button className={styles.toolBtn} onClick={() => void loadDetail()} type="button">🔄 Yenile</button>
          <button className={styles.toolBtn} onClick={() => { setMessage(''); setModal('note'); }} type="button">📝 Not Ekle</button>
          <button className={styles.toolBtn} onClick={() => window.print()} type="button">📊 Raporla</button>
        </div>

        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{detail.firstName[0]}{detail.lastName[0]}</div>
            <div className={styles.headerInfo}>
              <h1 className={styles.headerName}>{detail.firstName} {detail.lastName}</h1>
              <div className={styles.headerBadges}>
                <span className={styles.badge}>{detail.type === 'CHILD' ? 'ÇOCUK DANIŞAN' : 'YETİŞKİN DANIŞAN'}</span>
                <span className={styles.badgeDark}>✓ {clientStatusLabels[detail.status]}</span>
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>HİZMET</span>
              <span className={styles.statValue}>{latestService}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>DURUM</span>
              <span className={styles.statValue}>{clientStatusLabels[detail.status]}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>KAYIT TARİHİ</span>
              <span className={styles.statValue}>{formatDate(detail.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className={styles.processCard}>
          <div className={styles.processLeft}>
            <span className={styles.processTitle}>Danışmanlık Süreci</span>
            <span className={styles.processSubtitle}>{completedAppointments} tamamlanan seans • {detail.appointments.length} toplam kayıt</span>
          </div>
          <div className={styles.processSteps}>
            <div className={styles.stepActive}><span>✓</span><span>Değerlendirme</span></div>
            <div className={completedAppointments >= 1 ? styles.stepActive : styles.stepInactive}><span>{completedAppointments >= 1 ? '✓' : '○'}</span><span>Müdahale</span></div>
            <div className={completedAppointments >= 4 ? styles.stepActive : styles.stepInactive}><span>{completedAppointments >= 4 ? '✓' : '○'}</span><span>İzleme</span></div>
            <div className={detail.status === 'INACTIVE' ? styles.stepActive : styles.stepInactive}><span>{detail.status === 'INACTIVE' ? '✓' : '○'}</span><span>Sonlandırma</span></div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={activeTab === 'summary' ? styles.tabActive : styles.tabInactive} onClick={() => setActiveTab('summary')} type="button">Özet</button>
          <button className={activeTab === 'progress' ? styles.tabActive : styles.tabInactive} onClick={() => setActiveTab('progress')} type="button">İlerleme</button>
          <button className={activeTab === 'notes' ? styles.tabActive : styles.tabInactive} onClick={() => setActiveTab('notes')} type="button">Notlar</button>
          <button className={activeTab === 'relations' ? styles.tabActive : styles.tabInactive} onClick={() => setActiveTab('relations')} type="button">İlişkiler</button>
        </div>
      </div>

      <div className={styles.lowerSection}>
        {activeTab === 'summary' ? (
          <div className={styles.grid}>
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>👤 Danışan Bilgileri</h2>
              <div className={styles.cardContent}>
                <div className={styles.field}><span className={styles.label}>Ad</span><span className={styles.value}>{detail.firstName}</span></div>
                <div className={styles.field}><span className={styles.label}>Soyad</span><span className={styles.value}>{detail.lastName}</span></div>
                <div className={styles.field}><span className={styles.label}>E-posta</span><span className={styles.valueBlue}>{detail.email ?? '—'}</span></div>
                <div className={styles.field}><span className={styles.label}>Telefon</span><span className={styles.value}>{detail.phone ?? '—'}</span></div>
              </div>
            </article>

            <article className={`${styles.card} ${styles.cardAccent}`}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Sonraki Seans</h2><span className={styles.badgeMini}>{detail.nextAppointment ? 'AKTİF' : 'BOŞ'}</span></div>
              {detail.nextAppointment ? (
                <div className={styles.cardContent}>
                  <div className={styles.sequenceLabel}>{detail.nextAppointment.serviceNameSnapshot}</div>
                  <div className={styles.task}>
                    <span className={styles.taskIcon}>◷</span>
                    <div className={styles.taskInfo}>
                      <span className={styles.taskName}>{formatDateTime(detail.nextAppointment.startsAt)}</span>
                      <span className={styles.taskTime}>{appointmentStatusLabels[detail.nextAppointment.status] ?? detail.nextAppointment.status} • {detail.nextAppointment.durationMinutesSnapshot} dk</span>
                    </div>
                  </div>
                  <p className={styles.taskDesc}>{detail.nextAppointment.requestNote ?? 'Randevu notu bulunmuyor.'}</p>
                  <div className={styles.taskButtons}>
                    <Link className={styles.btnPrimary} href="/yonetim/randevular">Randevuya git</Link>
                    <button className={styles.btnSecondary} onClick={() => setActiveTab('progress')} type="button">Tarihçe</button>
                  </div>
                </div>
              ) : <p className={styles.empty}>Planlanmış randevu bulunmuyor.</p>}
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Kayıt Puanı</h2><span className={styles.aiLabel}>CANLI VERİ</span></div>
              <div className={styles.scoreContainer}>
                <div className={styles.scoreCircle}><span className={styles.scoreNumber}>{detail.score}</span><span className={styles.scoreGrade}>{grade}</span></div>
                <div className={styles.scoreTrend}><span>{detail.score >= 70 ? '🟢 Düzenli' : '🟠 Geliştirilmeli'}</span><p className={styles.trendText}>İletişim bilgileri, seans ve not kayıtlarından hesaplanır.</p></div>
              </div>
              <div className={styles.insights}>
                <span className={styles.insightsLabel}>Gözlemler</span>
                <ul className={styles.insightsList}>
                  <li>{detail.phone ? 'Telefon kayıtlı' : 'Telefon bilgisi eksik'}</li>
                  <li>{detail.email ? 'E-posta kayıtlı' : 'E-posta bilgisi eksik'}</li>
                  <li>{detail.appointments.length} randevu kaydı</li>
                  <li>{detail.notes.length} yönetim notu</li>
                </ul>
              </div>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardTitle}>🎯 Plan Bilgileri</h2>
              <div className={styles.cardContent}>
                <div className={styles.field}><span className={styles.label}>Plan</span><span className={styles.value}>{activePlan?.name ?? 'Plan yok'}</span></div>
                <div className={styles.field}><span className={styles.label}>Seans</span><span className={styles.value}>{activePlan ? `${activePlan.sessionCount} × ${activePlan.sessionDurationMinutes} dk` : '—'}</span></div>
                <div className={styles.field}><span className={styles.label}>Tutar</span><span className={styles.value}>{activePlan ? formatMoney(activePlan.totalAmountMinor, activePlan.currency) : '—'}</span></div>
              </div>
            </article>

            <article className={styles.card}>
              <h2 className={styles.cardTitle}>📅 Tarihçe</h2>
              <div className={styles.historyList}>
                {detail.appointments.slice(0, 3).map((appointment) => (
                  <div className={styles.historyItem} key={appointment.id}>
                    <strong>{appointment.serviceNameSnapshot}</strong>
                    <span className={styles.historyMeta}>{formatDateTime(appointment.startsAt)} • {appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                  </div>
                ))}
                {detail.appointments.length === 0 ? <p className={styles.empty}>Randevu kaydı bulunmuyor.</p> : null}
              </div>
            </article>

            <article className={`${styles.card} ${styles.cardWarm}`}>
              <h2 className={styles.cardTitle}>Önemli Notlar</h2>
              <div className={styles.notesArea}>
                <p className={styles.notes}>{latestNote?.note ?? 'Henüz danışan notu eklenmedi.'}</p>
                {latestNote ? <span className={styles.historyMeta}>{formatDateTime(latestNote.createdAt)} • {latestNote.createdBy.name ?? 'Yönetici'}</span> : null}
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === 'progress' ? (
          <div className={styles.grid}>
            <article className={`${styles.card} ${styles.fullWidth}`}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Randevu ve İlerleme Geçmişi</h2><span className={styles.badgeMini}>{detail.appointments.length} KAYIT</span></div>
              <div className={styles.historyList}>
                {detail.appointments.map((appointment) => (
                  <div className={styles.historyItem} key={appointment.id}>
                    <strong>{appointment.serviceNameSnapshot} • {appointment.practitioner.displayName}</strong>
                    <span className={styles.historyMeta}>{formatDateTime(appointment.startsAt)} • {appointment.durationMinutesSnapshot} dk • {appointmentStatusLabels[appointment.status] ?? appointment.status}</span>
                    {appointment.requestNote ? <span className={styles.notes}>{appointment.requestNote}</span> : null}
                  </div>
                ))}
                {detail.appointments.length === 0 ? <p className={styles.empty}>Randevu geçmişi bulunmuyor.</p> : null}
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === 'notes' ? (
          <div className={styles.grid}>
            <article className={`${styles.card} ${styles.fullWidth}`}>
              <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Danışan Notları</h2><button className={styles.btnPrimary} onClick={() => setModal('note')} type="button">Not ekle</button></div>
              <div className={styles.historyList}>
                {detail.notes.map((note) => (
                  <div className={styles.historyItem} key={note.id}>
                    <strong>{note.category}</strong>
                    <span className={styles.notes}>{note.note}</span>
                    <span className={styles.historyMeta}>{formatDateTime(note.createdAt)} • {note.createdBy.name ?? 'Yönetici'}</span>
                  </div>
                ))}
                {detail.notes.length === 0 ? <p className={styles.empty}>Not bulunmuyor.</p> : null}
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === 'relations' ? (
          <div className={styles.grid}>
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Veli / Yakın İlişkileri</h2>
              <div className={styles.historyList}>
                {detail.guardians.map((relation) => (
                  <div className={styles.historyItem} key={relation.guardian.id}>
                    <strong>{relation.guardian.firstName} {relation.guardian.lastName}</strong>
                    <span className={styles.historyMeta}>{relation.relationship}{relation.isPrimary ? ' • Birincil' : ''}</span>
                    <span className={styles.notes}>{relation.guardian.phone} • {relation.guardian.email ?? 'E-posta yok'}</span>
                  </div>
                ))}
                {detail.guardians.length === 0 ? <p className={styles.empty}>Bağlı veli kaydı bulunmuyor.</p> : null}
              </div>
            </article>
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Ödeme Planları</h2>
              <div className={styles.historyList}>
                {detail.plans.map((plan) => (
                  <div className={styles.historyItem} key={plan.id}>
                    <strong>{plan.name}</strong>
                    <span className={styles.historyMeta}>{plan.status} • {plan.sessionCount} seans • {formatMoney(plan.totalAmountMinor, plan.currency)}</span>
                  </div>
                ))}
                {detail.plans.length === 0 ? <p className={styles.empty}>Ödeme planı bulunmuyor.</p> : null}
              </div>
            </article>
            <article className={`${styles.card} ${styles.fullWidth}`}>
              <h2 className={styles.cardTitle}>Finans Hareketleri</h2>
              <div className={styles.historyList}>
                {detail.financeEntries.map((entry) => (
                  <div className={styles.historyItem} key={entry.id}>
                    <strong>{entry.type} • {formatMoney(entry.amountMinor, entry.currency)}</strong>
                    <span className={styles.historyMeta}>{formatDateTime(entry.occurredAt)} • {entry.paymentMethod?.name ?? entry.plan?.name ?? 'Genel hareket'}</span>
                    {entry.note ? <span className={styles.notes}>{entry.note}</span> : null}
                  </div>
                ))}
                {detail.financeEntries.length === 0 ? <p className={styles.empty}>Finans hareketi bulunmuyor.</p> : null}
              </div>
            </article>
          </div>
        ) : null}
      </div>

      {modal === 'edit' ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="danisan-duzenle" aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><span className={styles.badge}>DANIŞAN</span><h2 className={styles.modalTitle} id="danisan-duzenle">Danışan bilgilerini düzenle</h2></div><button className={styles.modalClose} onClick={() => setModal(null)} type="button">×</button></div>
            <form className={styles.modalForm} onSubmit={submitEdit}>
              <div className={styles.formGrid}>
                <label className={styles.formField}><span>Ad</span><input defaultValue={detail.firstName} name="firstName" required /></label>
                <label className={styles.formField}><span>Soyad</span><input defaultValue={detail.lastName} name="lastName" required /></label>
                <label className={styles.formField}><span>Tercih edilen ad</span><input defaultValue={detail.preferredName ?? ''} name="preferredName" /></label>
                <label className={styles.formField}><span>Doğum yılı</span><input defaultValue={detail.birthYear ?? ''} max={new Date().getFullYear()} min="1900" name="birthYear" type="number" /></label>
                <label className={styles.formField}><span>E-posta</span><input defaultValue={detail.email ?? ''} name="email" type="email" /></label>
                <label className={styles.formField}><span>Telefon</span><input defaultValue={detail.phone ?? ''} name="phone" /></label>
                <label className={styles.formField}><span>Durum</span><select defaultValue={detail.status} name="status"><option value="PROSPECTIVE">Ön görüşme</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></select></label>
              </div>
              {message ? <div className={styles.formMessage}>{message}</div> : null}
              <div className={styles.modalActions}><button className={styles.modalButtonSecondary} onClick={() => setModal(null)} type="button">Vazgeç</button><button className={styles.modalButton} disabled={submitting} type="submit">{submitting ? 'Kaydediliyor...' : 'Kaydet'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === 'note' ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="not-ekle" aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><span className={styles.badge}>NOT</span><h2 className={styles.modalTitle} id="not-ekle">Danışan notu ekle</h2></div><button className={styles.modalClose} onClick={() => setModal(null)} type="button">×</button></div>
            <form className={styles.modalForm} onSubmit={submitNote}>
              <label className={styles.formField}><span>Kategori</span><select defaultValue="GENERAL" name="category"><option value="GENERAL">Genel</option><option value="CLINICAL">Klinik</option><option value="FOLLOW_UP">Takip</option><option value="FINANCE">Finans</option></select></label>
              <label className={styles.formField}><span>Not</span><textarea maxLength={500} name="note" required /></label>
              {message ? <div className={styles.formMessage}>{message}</div> : null}
              <div className={styles.modalActions}><button className={styles.modalButtonSecondary} onClick={() => setModal(null)} type="button">Vazgeç</button><button className={styles.modalButton} disabled={submitting} type="submit">{submitting ? 'Ekleniyor...' : 'Notu ekle'}</button></div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === 'delete' ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="danisan-pasif" aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}><div><span className={styles.badge}>DURUM DEĞİŞİKLİĞİ</span><h2 className={styles.modalTitle} id="danisan-pasif">Danışanı pasife al</h2></div><button className={styles.modalClose} onClick={() => setModal(null)} type="button">×</button></div>
            <div className={styles.modalForm}>
              <p className={styles.notes}>{detail.firstName} {detail.lastName} kaydı silinmeyecek; geçmiş randevu ve ödeme bağlantıları korunarak pasif duruma alınacak.</p>
              {message ? <div className={styles.formMessage}>{message}</div> : null}
              <div className={styles.modalActions}><button className={styles.modalButtonSecondary} onClick={() => setModal(null)} type="button">Vazgeç</button><button className={styles.modalButton} disabled={submitting} onClick={() => void deactivateClient()} type="button">{submitting ? 'İşleniyor...' : 'Pasife al'}</button></div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}