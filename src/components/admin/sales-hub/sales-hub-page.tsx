'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import type { ClientListItem } from '@/components/admin/client-dashboard-types';

import ExactSalesHubDashboard from './exact-sales-hub-dashboard';
import styles from './sales-hub-dashboard.module.css';
import { SalesHubIcon } from './source/sales-hub-icon';

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export default function SalesHubPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDanisanId, setSelectedDanisanId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'ADULT' | 'CHILD'>('ADULT');

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/clients?take=100', {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: ClientListItem[] };
      setClients(payload.data);
      setSelectedDanisanId((current) => {
        if (current && payload.data.some((client) => client.id === current)) return current;
        return payload.data[0]?.id ?? '';
      });
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Danışanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadClients(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadClients]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const birthYearValue = String(formData.get('birthYear') ?? '').trim();

    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/clients', {
        body: JSON.stringify({
          birthYear: birthYearValue ? Number(birthYearValue) : null,
          email: String(formData.get('email') ?? '').trim() || null,
          firstName: String(formData.get('firstName') ?? '').trim(),
          guardianEmail:
            type === 'CHILD' ? String(formData.get('guardianEmail') ?? '').trim() || null : null,
          guardianFirstName:
            type === 'CHILD' ? String(formData.get('guardianFirstName') ?? '').trim() || null : null,
          guardianId: null,
          guardianLastName:
            type === 'CHILD' ? String(formData.get('guardianLastName') ?? '').trim() || null : null,
          guardianMode: type === 'CHILD' ? 'NEW' : null,
          guardianPhone:
            type === 'CHILD' ? String(formData.get('guardianPhone') ?? '').trim() || null : null,
          lastName: String(formData.get('lastName') ?? '').trim(),
          phone: String(formData.get('phone') ?? '').trim() || null,
          preferredName: String(formData.get('preferredName') ?? '').trim() || null,
          relationship:
            type === 'CHILD' ? String(formData.get('relationship') ?? '').trim() || null : null,
          requestId: crypto.randomUUID(),
          status: String(formData.get('status') ?? 'PROSPECTIVE'),
          type,
        }),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': crypto.randomUUID(),
        },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await readError(response));
      const payload = (await response.json()) as { data: { id: string } };
      setCreateOpen(false);
      setType('ADULT');
      await loadClients();
      setSelectedDanisanId(payload.data.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Danışan oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  function openCreate() {
    setMessage('');
    setType('ADULT');
    setCreateOpen(true);
  }

  return (
    <>
      <ExactSalesHubDashboard
        clients={clients}
        loading={loading}
        onChanged={() => void loadClients()}
        onNew={openCreate}
        onRefresh={() => void loadClients()}
        onSelectClient={setSelectedDanisanId}
        selectedId={selectedDanisanId}
      />

      {message && !createOpen ? <div className={styles.toast}>{message}</div> : null}

      {createOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby="danisan-olustur"
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="danisan-olustur">Yeni danışan</h2>
                <p>Portföye gerçek danışan kaydı ekleyin.</p>
              </div>
              <button
                className={styles.circleButton}
                onClick={() => setCreateOpen(false)}
                type="button"
              >
                <SalesHubIcon name="x" size={15} />
              </button>
            </div>
            <form onSubmit={createClient}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  Danışan tipi
                  <select
                    onChange={(event) => setType(event.target.value as 'ADULT' | 'CHILD')}
                    value={type}
                  >
                    <option value="ADULT">Yetişkin</option>
                    <option value="CHILD">Çocuk</option>
                  </select>
                </label>
                <label className={styles.field}>
                  Durum
                  <select defaultValue="PROSPECTIVE" name="status">
                    <option value="PROSPECTIVE">Potansiyel</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                  </select>
                </label>
                <label className={styles.field}>Ad<input name="firstName" required /></label>
                <label className={styles.field}>Soyad<input name="lastName" required /></label>
                <label className={styles.field}>Tercih edilen ad<input name="preferredName" /></label>
                <label className={styles.field}>Doğum yılı<input max={new Date().getFullYear()} min="1900" name="birthYear" type="number" /></label>
                <label className={styles.field}>Telefon<input name="phone" /></label>
                <label className={styles.field}>E-posta<input name="email" type="email" /></label>
                {type === 'CHILD' ? (
                  <>
                    <label className={styles.field}>Veli adı<input name="guardianFirstName" required /></label>
                    <label className={styles.field}>Veli soyadı<input name="guardianLastName" required /></label>
                    <label className={styles.field}>Veli telefonu<input name="guardianPhone" required /></label>
                    <label className={styles.field}>Veli e-postası<input name="guardianEmail" type="email" /></label>
                    <label className={styles.field}>Yakınlık<input name="relationship" placeholder="Anne, baba, vasi..." required /></label>
                  </>
                ) : null}
              </div>
              {message ? <div className={styles.toast}>{message}</div> : null}
              <div className={styles.modalActions}>
                <button className={styles.secondaryAction} onClick={() => setCreateOpen(false)} type="button">Vazgeç</button>
                <button className={styles.primaryAction} disabled={submitting} type="submit">{submitting ? 'Oluşturuluyor...' : 'Danışanı oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
