'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import type { ClientListItem } from '@/components/admin/client-dashboard-types';
import DanisanDetayPanel from '@/components/admin/danisan-detay-panel';
import DanisanlarPanel from '@/components/admin/danisanlar-panel';

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? 'İşlem tamamlanamadı.';
}

export default function DanisanlarPage() {
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Danışanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const birthYear = String(formData.get('birthYear') ?? '').trim();

    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/clients', {
        body: JSON.stringify({
          birthYear: birthYear || null,
          email: String(formData.get('email') ?? '').trim() || null,
          firstName: String(formData.get('firstName') ?? '').trim(),
          guardianEmail: type === 'CHILD' ? String(formData.get('guardianEmail') ?? '').trim() || null : null,
          guardianFirstName: type === 'CHILD' ? String(formData.get('guardianFirstName') ?? '').trim() || null : null,
          guardianId: null,
          guardianLastName: type === 'CHILD' ? String(formData.get('guardianLastName') ?? '').trim() || null : null,
          guardianMode: type === 'CHILD' ? 'NEW' : null,
          guardianPhone: type === 'CHILD' ? String(formData.get('guardianPhone') ?? '').trim() || null : null,
          lastName: String(formData.get('lastName') ?? '').trim(),
          phone: String(formData.get('phone') ?? '').trim() || null,
          preferredName: String(formData.get('preferredName') ?? '').trim() || null,
          relationship: type === 'CHILD' ? String(formData.get('relationship') ?? '').trim() || null : null,
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
      <div style={styles.container}>
        <DanisanlarPanel
          clients={clients}
          loading={loading}
          onNew={openCreate}
          onRefresh={() => void loadClients()}
          onSelectDanisan={setSelectedDanisanId}
          selectedId={selectedDanisanId}
        />
        <DanisanDetayPanel
          onChanged={() => void loadClients()}
          onNew={openCreate}
          selectedDanisanId={selectedDanisanId}
        />
      </div>

      {createOpen ? (
        <div style={styles.modalBackdrop} role="presentation">
          <div aria-labelledby="danisan-olustur" aria-modal="true" role="dialog" style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.kicker}>YENİ KAYIT</span>
                <h2 id="danisan-olustur" style={styles.modalTitle}>Danışan oluştur</h2>
              </div>
              <button onClick={() => setCreateOpen(false)} style={styles.closeButton} type="button">×</button>
            </div>

            <form onSubmit={createClient} style={styles.form}>
              <div style={styles.typeSwitch}>
                <button onClick={() => setType('ADULT')} style={{ ...styles.typeButton, ...(type === 'ADULT' ? styles.typeButtonActive : {}) }} type="button">Yetişkin</button>
                <button onClick={() => setType('CHILD')} style={{ ...styles.typeButton, ...(type === 'CHILD' ? styles.typeButtonActive : {}) }} type="button">Çocuk</button>
              </div>

              <div style={styles.formGrid}>
                <label style={styles.field}><span>Ad</span><input name="firstName" required style={styles.input} /></label>
                <label style={styles.field}><span>Soyad</span><input name="lastName" required style={styles.input} /></label>
                <label style={styles.field}><span>Tercih edilen ad</span><input name="preferredName" style={styles.input} /></label>
                <label style={styles.field}><span>Doğum yılı</span><input max={new Date().getFullYear()} min="1900" name="birthYear" style={styles.input} type="number" /></label>
                <label style={styles.field}><span>E-posta</span><input name="email" style={styles.input} type="email" /></label>
                <label style={styles.field}><span>Telefon</span><input name="phone" style={styles.input} /></label>
                <label style={styles.field}><span>Durum</span><select defaultValue="PROSPECTIVE" name="status" style={styles.input}><option value="PROSPECTIVE">Ön görüşme</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></select></label>
              </div>

              {type === 'CHILD' ? (
                <section style={styles.guardianSection}>
                  <div><span style={styles.kicker}>VELİ BİLGİLERİ</span><h3 style={styles.guardianTitle}>Yeni veli kaydı</h3></div>
                  <div style={styles.formGrid}>
                    <label style={styles.field}><span>Veli adı</span><input name="guardianFirstName" required style={styles.input} /></label>
                    <label style={styles.field}><span>Veli soyadı</span><input name="guardianLastName" required style={styles.input} /></label>
                    <label style={styles.field}><span>Veli telefonu</span><input name="guardianPhone" required style={styles.input} /></label>
                    <label style={styles.field}><span>Veli e-postası</span><input name="guardianEmail" style={styles.input} type="email" /></label>
                    <label style={styles.field}><span>Yakınlık</span><input name="relationship" placeholder="Anne, baba, vasi..." required style={styles.input} /></label>
                  </div>
                </section>
              ) : null}

              {message ? <div style={styles.message}>{message}</div> : null}
              <div style={styles.actions}>
                <button onClick={() => setCreateOpen(false)} style={styles.secondaryButton} type="button">Vazgeç</button>
                <button disabled={submitting} style={styles.primaryButton} type="submit">{submitting ? 'Oluşturuluyor...' : 'Danışanı oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: 16,
    height: 'calc(100vh - 160px)',
    overflow: 'hidden',
  },
  modalBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 120,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(5, 5, 5, 0.42)',
    padding: 24,
  },
  modal: {
    width: 'min(100%, 720px)',
    maxHeight: 'calc(100vh - 48px)',
    overflow: 'auto',
    borderRadius: 24,
    background: '#ffffff',
    padding: 22,
    boxShadow: '0 28px 80px rgba(5, 5, 5, 0.22)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    borderBottom: '1px solid rgba(50, 49, 48, 0.1)',
    paddingBottom: 14,
  },
  kicker: {
    display: 'inline-flex',
    width: 'fit-content',
    borderRadius: 999,
    background: '#efffc3',
    padding: '5px 9px',
    color: '#263000',
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: '0.06em',
  },
  modalTitle: { margin: '8px 0 0', color: '#151413', fontSize: 22 },
  closeButton: {
    display: 'grid',
    width: 32,
    height: 32,
    placeItems: 'center',
    border: '1px solid rgba(50, 49, 48, 0.14)',
    borderRadius: '50%',
    background: '#ffffff',
    cursor: 'pointer',
  },
  form: { display: 'grid', gap: 18, marginTop: 18 },
  typeSwitch: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
    borderRadius: 16,
    background: '#f5f4f0',
    padding: 6,
  },
  typeButton: {
    minHeight: 38,
    border: 0,
    borderRadius: 12,
    background: 'transparent',
    color: '#77727d',
    font: 'inherit',
    fontSize: 11,
    fontWeight: 750,
    cursor: 'pointer',
  },
  typeButtonActive: { background: '#050505', color: '#ffffff' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  field: { display: 'grid', gap: 7, color: '#77727d', fontSize: 10, fontWeight: 750 },
  input: {
    width: '100%',
    border: '1px solid rgba(50, 49, 48, 0.14)',
    borderRadius: 12,
    background: '#faf9f7',
    padding: '10px 12px',
    color: '#171615',
    font: 'inherit',
    fontSize: 12,
    outline: 0,
  },
  guardianSection: {
    display: 'grid',
    gap: 14,
    borderRadius: 18,
    background: '#f7f8df',
    padding: 16,
  },
  guardianTitle: { margin: '7px 0 0', color: '#151413', fontSize: 16 },
  message: { borderRadius: 12, background: '#fff7ed', padding: '10px 12px', color: '#9a3412', fontSize: 11 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  primaryButton: {
    minHeight: 38,
    border: '1px solid #050505',
    borderRadius: 999,
    background: '#050505',
    padding: '0 16px',
    color: '#ffffff',
    font: 'inherit',
    fontSize: 11,
    fontWeight: 750,
    cursor: 'pointer',
  },
  secondaryButton: {
    minHeight: 38,
    border: '1px solid rgba(50, 49, 48, 0.15)',
    borderRadius: 999,
    background: '#ffffff',
    padding: '0 16px',
    color: '#4e4a46',
    font: 'inherit',
    fontSize: 11,
    fontWeight: 750,
    cursor: 'pointer',
  },
};