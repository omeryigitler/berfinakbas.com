import type { FormEvent } from 'react';

import type { ClientDetail } from '@/components/admin/client-dashboard-types';

import styles from '../sales-hub-dashboard.module.css';
import { SalesHubIcon } from './sales-hub-icon';

interface SalesHubModalsProps {
  deactivateOpen: boolean;
  detail: ClientDetail | null;
  displayName: string;
  editOpen: boolean;
  noteOpen: boolean;
  onCloseDeactivate: () => void;
  onCloseEdit: () => void;
  onCloseNote: () => void;
  onDeactivate: () => void;
  onNoteSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}

export default function SalesHubModals({
  deactivateOpen,
  detail,
  displayName,
  editOpen,
  noteOpen,
  onCloseDeactivate,
  onCloseEdit,
  onCloseNote,
  onDeactivate,
  onNoteSubmit,
  onUpdateSubmit,
  submitting,
}: SalesHubModalsProps) {
  if (!detail) return null;

  return (
    <>
      {editOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <h2>Danışanı düzenle</h2>
                <p>{displayName} kayıt bilgileri</p>
              </div>
              <button className={styles.circleButton} onClick={onCloseEdit} type="button">
                <SalesHubIcon name="x" size={15} />
              </button>
            </div>
            <form onSubmit={onUpdateSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  Ad
                  <input defaultValue={detail.firstName} name="firstName" required />
                </label>
                <label className={styles.field}>
                  Soyad
                  <input defaultValue={detail.lastName} name="lastName" required />
                </label>
                <label className={styles.field}>
                  Tercih edilen ad
                  <input defaultValue={detail.preferredName ?? ''} name="preferredName" />
                </label>
                <label className={styles.field}>
                  Doğum yılı
                  <input
                    defaultValue={detail.birthYear ?? ''}
                    max={new Date().getFullYear()}
                    min="1900"
                    name="birthYear"
                    type="number"
                  />
                </label>
                <label className={styles.field}>
                  Telefon
                  <input defaultValue={detail.phone ?? ''} name="phone" />
                </label>
                <label className={styles.field}>
                  E-posta
                  <input defaultValue={detail.email ?? ''} name="email" type="email" />
                </label>
                <label className={styles.field}>
                  Durum
                  <select defaultValue={detail.status} name="status">
                    <option value="PROSPECTIVE">Potansiyel</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                  </select>
                </label>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryAction}
                  onClick={onCloseEdit}
                  type="button"
                >
                  Vazgeç
                </button>
                <button className={styles.primaryAction} disabled={submitting} type="submit">
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {noteOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <h2>Operasyonel not ekle</h2>
                <p>{displayName}</p>
              </div>
              <button className={styles.circleButton} onClick={onCloseNote} type="button">
                <SalesHubIcon name="x" size={15} />
              </button>
            </div>
            <form onSubmit={onNoteSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  Kategori
                  <select defaultValue="GENERAL" name="category">
                    <option value="GENERAL">Genel</option>
                    <option value="APPOINTMENT">Randevu</option>
                    <option value="PAYMENT">Ödeme</option>
                    <option value="PLAN">Plan</option>
                  </select>
                </label>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  Not
                  <textarea name="note" required />
                </label>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryAction}
                  onClick={onCloseNote}
                  type="button"
                >
                  Vazgeç
                </button>
                <button className={styles.primaryAction} disabled={submitting} type="submit">
                  {submitting ? 'Ekleniyor...' : 'Notu ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deactivateOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <h2>Danışanı pasife al</h2>
                <p>{displayName} kaydı silinmez; pasif duruma geçirilir.</p>
              </div>
              <button
                className={styles.circleButton}
                onClick={onCloseDeactivate}
                type="button"
              >
                <SalesHubIcon name="x" size={15} />
              </button>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryAction}
                onClick={onCloseDeactivate}
                type="button"
              >
                Vazgeç
              </button>
              <button
                className={styles.primaryAction}
                disabled={submitting}
                onClick={onDeactivate}
                type="button"
              >
                {submitting ? 'İşleniyor...' : 'Pasife al'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
